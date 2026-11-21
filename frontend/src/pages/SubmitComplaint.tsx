import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  MapPin,
  Camera,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  ArrowRight,
  X,
  Upload,
} from 'lucide-react';
import { complaintsAPI } from '../services/api';
import { Complaint, DuplicateResult } from '../types';
import { AIAnalysisCard } from '../components/AIAnalysisCard';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const SubmitComplaint: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationText, setLocationText] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Duplicate detection state
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateResult[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  // Success state with AI response
  const [submittedComplaint, setSubmittedComplaint] = useState<Complaint | null>(null);

  const navigate = useNavigate();

  // Handle GPS location detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        if (!locationText.trim()) {
          setLocationText(`GPS Location: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setError(`Unable to retrieve GPS location: ${err.message}. Please enter location manually.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Handle Image Selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file must be less than 5 MB.');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  // Perform Gemini duplicate check before actual submission
  const handlePreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !locationText.trim()) {
      setError('Please fill in title, description, and location.');
      return;
    }

    setError(null);
    setCheckingDuplicates(true);

    try {
      const res = await complaintsAPI.checkDuplicates({
        title: title.trim(),
        description: description.trim(),
        location_text: locationText.trim(),
      });

      if (res.potential_duplicates && res.potential_duplicates.length > 0) {
        setDuplicates(res.potential_duplicates);
        setShowDuplicateModal(true);
      } else {
        // No duplicates, proceed directly
        executeSubmission();
      }
    } catch {
      // If check fails, still allow submission gracefully
      executeSubmission();
    } finally {
      setCheckingDuplicates(false);
    }
  };

  // Actual Complaint Submission with multipart
  const executeSubmission = async () => {
    setShowDuplicateModal(false);
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('location_text', locationText.trim());
      if (latitude !== null) formData.append('latitude', latitude.toString());
      if (longitude !== null) formData.append('longitude', longitude.toString());
      if (imageFile) formData.append('image', imageFile);

      const created = await complaintsAPI.submit(formData);
      setSubmittedComplaint(created);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 'Failed to submit complaint. Please check your network connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  // View rendered when submission succeeds
  if (submittedComplaint) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 my-6">
        <div className="bg-white rounded-3xl border border-green-200 p-8 shadow-sm space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200 uppercase">
                Complaint Lodged Successfully
              </span>
              <h1 className="text-2xl font-black text-slate-900 mt-1">
                Grievance #{submittedComplaint.complaint_id}
              </h1>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs sm:text-sm space-y-2">
            <p className="font-semibold text-slate-800">
              Your grievance has been permanently registered in the municipal database.
            </p>
            <p className="text-slate-600">
              Keep your Complaint Tracking ID: <strong className="font-mono text-blue-700 text-sm">{submittedComplaint.complaint_id}</strong>
            </p>
          </div>

          {/* AI Analysis Result Display */}
          {submittedComplaint.ai_analysis && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Instant AI Classification Result
              </h3>
              <AIAnalysisCard analysis={submittedComplaint.ai_analysis} />
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => navigate(`/complaints/${submittedComplaint.id}`)}
              className="flex-1 py-3 px-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 text-sm transition-all"
            >
              View Complaint Timeline
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="py-3 px-5 rounded-xl font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 my-6">
      {/* Title */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
          Citizen Reporting
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
          Report a Civic Problem
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Provide problem details. Google Gemini AI will analyze the safety hazard, prioritize it, and route it to the appropriate municipal department.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs sm:text-sm flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Submission Form */}
      <form onSubmit={handlePreSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Title */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Problem Title *
            </label>
            <span className="text-[11px] text-slate-400">{title.length}/200</span>
          </div>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Deep Pothole on 5th Main Road"
            required
            minLength={5}
            maxLength={200}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Detailed Description *
            </label>
            <span className="text-[11px] text-slate-400">{description.length}/5000</span>
          </div>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue, any visible risks (sparks, overflowing sewage, vehicle damage, children nearby), and how long it has been occurring..."
            required
            minLength={10}
            maxLength={5000}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-y"
          />
        </div>

        {/* Location Section */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label htmlFor="locationText" className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Location / Address *
            </label>
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={locating}
              className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg transition-colors"
            >
              <Navigation className={`w-3.5 h-3.5 mr-1 ${locating ? 'animate-spin' : ''}`} />
              {locating ? 'Detecting GPS...' : 'Use My GPS Location'}
            </button>
          </div>

          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              id="locationText"
              type="text"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              placeholder="e.g. In front of Central Library, 2nd Cross, Sector 4"
              required
              minLength={3}
              maxLength={500}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {latitude && longitude && (
            <p className="text-[11px] font-mono text-emerald-600 flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              GPS Coordinates locked: {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </p>
          )}
        </div>

        {/* Image Upload */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
            Evidence Photo (Optional)
          </label>

          {imagePreview ? (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 max-h-60 group">
              <img
                src={imagePreview}
                alt="Selected issue preview"
                className="w-full h-48 object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition-all"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="imageUpload"
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-2xl hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer"
            >
              <Upload className="w-8 h-8 text-slate-400 mb-2" />
              <p className="text-xs font-bold text-slate-700">Click to upload photo or drag & drop</p>
              <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, WEBP up to 5 MB</p>
              <input
                id="imageUpload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={loading || checkingDuplicates}
            className="w-full py-3.5 px-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 flex items-center justify-center transition-all disabled:opacity-50 text-sm"
          >
            {checkingDuplicates ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                Gemini Checking Neighborhood Duplicates...
              </>
            ) : loading ? (
              <>
                <LoadingSpinner size="sm" text="" />
                Submitting & Analyzing with Gemini AI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Submit Grievance to Municipal Authority
              </>
            )}
          </button>
        </div>
      </form>

      {/* Duplicate Detection Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-2.5 text-amber-600">
              <div className="p-2 bg-amber-100 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Potential Duplicate Reports Detected
                </h3>
                <p className="text-xs text-slate-500">
                  Gemini identified similar civic complaints nearby
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Before submitting a new report, please review whether one of these active issues matches your grievance:
            </p>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {duplicates.map((dup) => (
                <div
                  key={dup.complaint_id}
                  className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span className="font-mono text-amber-800">{dup.complaint_id}</span>
                    <span className="truncate max-w-[200px]">{dup.title}</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{dup.similarity_reason}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDuplicateModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition-colors"
              >
                Review My Input
              </button>
              <button
                type="button"
                onClick={executeSubmission}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white text-xs transition-colors shadow-sm"
              >
                Submit As New Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
