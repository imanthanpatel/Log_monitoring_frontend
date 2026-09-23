import type {
  Alert,
  AlertStatus,
  AuditLog,
  AuthResponse,
  DashboardData,
  DetectionRule,
  Evidence,
  Investigation,
  MitreCoverage,
  MitreStats,
  MitreTechnique,
  Notification,
  SecurityLog,
  User,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001/api';

const TOKEN_KEY = 'sentinelsiem_access_token';
const REFRESH_KEY = 'sentinelsiem_refresh_token';
const USER_KEY = 'sentinelsiem_user';

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh?: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function setStoredUser(user: unknown) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function clearAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

type FetchOptions = {
  method?: string;
  body?: BodyInit | null;
  headers?: Record<string, string>;
  isFormData?: boolean;
  skipAuth?: boolean;
};

async function request<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = { ...opts.headers };

  if (!opts.isFormData && opts.body && typeof opts.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }

  if (!opts.skipAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: opts.method || 'GET',
      headers,
      body: opts.body,
    });
  } catch {
    throw new ApiError('Unable to reach the server. Check your connection.', 0);
  }

  if (response.status === 401) {
    clearAuth();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new ApiError('Your session has expired. Please sign in again.', 401);
  }

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    if (data && typeof data === 'object') {
      const d = data as Record<string, unknown>;
      if (typeof d.detail === 'string') message = d.detail;
      else if (typeof d.error === 'string') message = d.error;
      else if (typeof d.message === 'string') message = d.message;
      else if (typeof d.non_field_errors === 'object') {
        const arr = d.non_field_errors as string[];
        if (Array.isArray(arr)) message = arr.join('; ');
      }
    } else if (typeof data === 'string') {
      message = data;
    }
    if (response.status === 403)
      message = 'You do not have permission to perform this action.';
    if (response.status === 404) message = 'The requested resource was not found.';
    if (response.status >= 500)
      message = 'A server error occurred. Please try again shortly.';
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : null,
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : null,
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : null,
    }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  postForm: <T>(path: string, formData: FormData) =>
    request<T>(path, { method: 'POST', body: formData, isFormData: true }),
};

// ---- Auth ----
export async function login(
  username: string,
  password: string
): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/auth/login/', { username, password });
  const access = res.access || res.access_token || '';
  const refresh = res.refresh || res.refresh_token || '';
  if (access) setTokens(access, refresh);
  if (res.user) setStoredUser(res.user);
  return res;
}

export async function register(data: {
  username: string;
  password: string;
  email?: string;
}): Promise<AuthResponse> {
  return api.post<AuthResponse>('/auth/register/', data);
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout/', {});
  } catch {
    // ignore — we clear locally regardless
  }
  clearAuth();
}

export async function getCurrentUser(): Promise<User> {
  return api.get<User>('/auth/me/');
}

// ---- Dashboard ----
export const getDashboard = () => api.get<DashboardData>('/dashboard/');

// ---- Alerts ----
export const getAlerts = () => api.get<Alert[]>('/alerts/');
export const getAlert = (id: number | string) => api.get<Alert>(`/alerts/${id}/`);
export const updateAlertStatus = (id: number, status: AlertStatus) =>
  api.put<Alert>('/alerts/status/', { id, status });
export const assignAlert = (id: number | string, investigatorId: number) =>
  api.post<Alert>(`/alerts/${id}/assign/`, { investigator_id: investigatorId });

// ---- Logs ----
export const getLogs = () => api.get<SecurityLog[]>('/logs/');

// ---- Rules ----
export const getRules = () => api.get<DetectionRule[]>('/rules/');

// ---- MITRE ----
export const getMitre = () => api.get<MitreTechnique[]>('/mitre/');
export const getMitreCoverage = () => api.get<MitreCoverage>('/mitre/coverage/');
export const getMitreStats = () => api.get<MitreStats>('/mitre/stats/');

// ---- Investigations ----
export const getMyInvestigations = () =>
  api.get<Investigation[]>('/investigations/me/');
export const getInvestigation = (id: number | string) =>
  api.get<Investigation>(`/investigations/${id}/`);
export const updateInvestigation = (
  id: number | string,
  data: Partial<Pick<Investigation, 'status' | 'summary' | 'root_cause' | 'recommendations' | 'conclusion'>>
) => api.patch<Investigation>(`/investigations/${id}/`, data);
export const completeInvestigation = (id: number | string) =>
  api.post<Investigation>(`/investigations/${id}/complete/`, {});

// ---- Evidence ----
export const getEvidence = (id: number | string) =>
  api.get<Evidence[]>(`/investigations/${id}/evidence/`);
export const uploadEvidence = (
  id: number | string,
  file: File,
  description: string
) => {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('description', description);
  return api.postForm<Evidence>(`/investigations/${id}/evidence/`, fd);
};

// ---- Notifications ----
export const getNotifications = () => api.get<Notification[]>('/notifications/');
export const markNotificationRead = (id: number | string) =>
  api.post<Notification>(`/notifications/${id}/read/`, {});

// ---- Audit Logs ----
export const getAuditLogs = () => api.get<AuditLog[]>('/audit-logs/');

// ---- Users ----
export const getUsers = () => api.get<User[]>('/user-list/');
export const updateUser = (id: number | string, data: Partial<User>) =>
  api.patch<User>(`/users/${id}/`, data);
export const deleteUser = (id: number | string) =>
  api.delete<{ success?: boolean }>(`/users/${id}/delete`);
