import axios from 'axios';
import {
  AnalyticsOverview,
  Complaint,
  DashboardStats,
  Department,
  DepartmentAnalytics,
  DuplicateResult,
  LoginResponse,
  PaginatedResponse,
  TrackingResult,
  User,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

// Interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('civicresolve_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if invalid or expired
      if (localStorage.getItem('civicresolve_token')) {
        localStorage.removeItem('civicresolve_token');
        localStorage.removeItem('civicresolve_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

export const authAPI = {
  register: async (data: {
    username: string;
    email: string;
    password: string;
    full_name: string;
    phone?: string;
  }): Promise<User> => {
    const res = await api.post<User>('/auth/register', data);
    return res.data;
  },

  login: async (username: string, password: string): Promise<LoginResponse> => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    const res = await api.post<LoginResponse>('/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },
};

// ---------------------------------------------------------------------------
// Departments
// ---------------------------------------------------------------------------

export const departmentsAPI = {
  getAll: async (): Promise<Department[]> => {
    const res = await api.get<Department[]>('/departments');
    return res.data;
  },
};

// ---------------------------------------------------------------------------
// Complaints (Citizen & General)
// ---------------------------------------------------------------------------

export const complaintsAPI = {
  submit: async (formData: FormData): Promise<Complaint> => {
    const res = await api.post<Complaint>('/complaints', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  getComplaints: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    priority?: string;
  }): Promise<PaginatedResponse<Complaint>> => {
    const res = await api.get<PaginatedResponse<Complaint>>('/complaints', { params });
    return res.data;
  },

  getComplaintById: async (id: number): Promise<Complaint> => {
    const res = await api.get<Complaint>(`/complaints/${id}`);
    return res.data;
  },

  track: async (complaintIdString: string): Promise<TrackingResult> => {
    const res = await api.get<TrackingResult>(`/complaints/track/${encodeURIComponent(complaintIdString.trim())}`);
    return res.data;
  },

  checkDuplicates: async (data: {
    title: string;
    description: string;
    location_text: string;
  }): Promise<{ potential_duplicates: DuplicateResult[] }> => {
    const res = await api.post<{ potential_duplicates: DuplicateResult[] }>(
      '/complaints/check-duplicates',
      data
    );
    return res.data;
  },
};

// ---------------------------------------------------------------------------
// Admin Operations
// ---------------------------------------------------------------------------

export const adminAPI = {
  getDashboard: async (): Promise<DashboardStats> => {
    const res = await api.get<DashboardStats>('/admin/dashboard');
    return res.data;
  },

  getComplaints: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    priority?: string;
    department_id?: number;
    search?: string;
  }): Promise<PaginatedResponse<Complaint>> => {
    const res = await api.get<PaginatedResponse<Complaint>>('/admin/complaints', { params });
    return res.data;
  },

  getComplaintById: async (id: number): Promise<Complaint> => {
    const res = await api.get<Complaint>(`/admin/complaints/${id}`);
    return res.data;
  },

  updateStatus: async (
    id: number,
    data: { status: 'in_progress' | 'reported'; remarks?: string }
  ): Promise<Complaint> => {
    const res = await api.put<Complaint>(`/admin/complaints/${id}/status`, data);
    return res.data;
  },

  updateDepartment: async (id: number, department_id: number): Promise<Complaint> => {
    const res = await api.put<Complaint>(`/admin/complaints/${id}/department`, { department_id });
    return res.data;
  },

  resolve: async (
    id: number,
    data: { resolution_description: string; admin_remarks?: string }
  ): Promise<Complaint> => {
    const res = await api.post<Complaint>(`/admin/complaints/${id}/resolve`, data);
    return res.data;
  },

  reject: async (id: number, reason: string): Promise<Complaint> => {
    const res = await api.post<Complaint>(`/admin/complaints/${id}/reject`, { reason });
    return res.data;
  },
};

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export const analyticsAPI = {
  getOverview: async (): Promise<AnalyticsOverview> => {
    const res = await api.get<AnalyticsOverview>('/analytics/overview');
    return res.data;
  },

  getDepartments: async (): Promise<{ departments: DepartmentAnalytics[] }> => {
    const res = await api.get<{ departments: DepartmentAnalytics[] }>('/analytics/departments');
    return res.data;
  },
};

export default api;
