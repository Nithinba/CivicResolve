export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  role: 'citizen' | 'admin';
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
  contact_email?: string;
  is_active: boolean;
}

export interface AIAnalysis {
  id: number;
  issue_category: string;
  detected_problem: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  severity_score: number;
  public_safety_risk: string;
  department: string;
  reason_for_classification: string;
  recommended_action: string;
  estimated_resolution_time: string;
  created_at: string;
}

export interface ComplaintUpdate {
  id: number;
  previous_status?: string;
  new_status: string;
  remarks?: string;
  updated_by_id: number;
  created_at: string;
}

export interface ResolutionRecord {
  id: number;
  resolution_description: string;
  resolution_date: string;
  admin_remarks?: string;
  resolved_by_id: number;
  created_at: string;
}

export interface Complaint {
  id: number;
  complaint_id: string;
  title: string;
  description: string;
  location_text: string;
  latitude?: number;
  longitude?: number;
  image_path?: string;
  status: 'reported' | 'in_progress' | 'resolved' | 'rejected';
  citizen_id: number;
  department_id?: number;
  department?: Department;
  ai_analysis?: AIAnalysis;
  updates?: ComplaintUpdate[];
  resolution?: ResolutionRecord;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface DepartmentCount {
  name: string;
  count: number;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface DashboardStats {
  total_complaints: number;
  reported_count: number;
  in_progress_count: number;
  resolved_count: number;
  rejected_count: number;
  critical_count: number;
  by_department: DepartmentCount[];
  by_category: CategoryCount[];
  recent_complaints: Complaint[];
}

export interface DistributionItem {
  label: string;
  count: number;
}

export interface MonthlyTrend {
  month: string;
  count: number;
}

export interface AnalyticsOverview {
  category_distribution: DistributionItem[];
  priority_distribution: DistributionItem[];
  status_distribution: DistributionItem[];
  monthly_trends: MonthlyTrend[];
}

export interface DepartmentAnalytics {
  department_name: string;
  total_complaints: number;
  resolved_complaints: number;
  avg_resolution_days: number;
}

export interface DuplicateResult {
  complaint_id: string;
  title: string;
  similarity_reason: string;
}

export interface TrackingResult {
  complaint_id: string;
  title: string;
  status: string;
  department_name?: string;
  priority?: string;
  created_at: string;
  updated_at: string;
  latest_update_remarks?: string;
}
