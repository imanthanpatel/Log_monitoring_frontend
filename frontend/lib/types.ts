export type Role = 'ADMIN' | 'SOC' | 'INVESTIGATOR' | 'VIEWER';

export type AlertStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'FALSE_POSITIVE'
  | 'RESOLVED'
  | 'CLOSED';

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type InvestigationStatus =
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CLOSED';

export interface User {
  id: number;
  username: string;
  email?: string;
  role: Role;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  date_joined?: string;
  last_login?: string;
  [key: string]: unknown;
}

export interface AuthResponse {
  access: string;
  refresh?: string;
  access_token?: string;
  refresh_token?: string;
  user?: User;
  username?: string;
  role?: Role;
  [key: string]: unknown;
}

export interface DashboardData {
  total_logs: number;
  total_alerts: number;
  active_rules: number;
  critical_alerts: number;
  high_alerts: number;
  medium_alerts: number;
  low_alerts: number;
  total_users: number;
  failed_logins: number;
  [key: string]: unknown;
}

export interface Alert {
  id: number;
  rule_name?: string;
  rule?: string | { id: number; name: string };
  severity: Severity | string;
  status: AlertStatus | string;
  source?: string;
  source_ip?: string;
  message?: string;
  description?: string;
  timestamp?: string;
  created_at?: string;
  updated_at?: string;
  assigned_to?: number | User | null;
  assigned_investigator?: number | User | null;
  investigation?: number | null;
  mitre_technique?: string;
  mitre_tactic?: string;
  raw_log?: string;
  [key: string]: unknown;
}

export interface SecurityLog {
  id: number;
  timestamp?: string;
  created_at?: string;
  level?: string;
  severity?: string;
  source?: string;
  source_ip?: string;
  message?: string;
  event_type?: string;
  raw_data?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface DetectionRule {
  id: number;
  name: string;
  description?: string;
  enabled?: boolean;
  is_active?: boolean;
  severity?: Severity | string;
  mitre_technique?: string;
  mitre_tactic?: string;
  technique_id?: string;
  tactic_id?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface MitreTechnique {
  id: number;
  technique_id?: string;
  name?: string;
  description?: string;
  tactic?: string;
  tactic_name?: string;
  tactic_id?: string;
  url?: string;
  rules_count?: number;
  mapped_rules?: number;
  [key: string]: unknown;
}

export interface MitreCoverage {
  total_rules: number;
  mapped_rules: number;
  coverage_percent: number;
  [key: string]: unknown;
}

export interface MitreStats {
  total_techniques: number;
  total_tactics: number;
  [key: string]: unknown;
}

export interface Investigation {
  id: number;
  alert?: number | Alert;
  alert_id?: number;
  status: InvestigationStatus | string;
  summary?: string;
  root_cause?: string;
  recommendations?: string;
  conclusion?: string;
  evidence?: unknown[];
  evidence_count?: number;
  assigned_to?: number | User;
  investigator?: number | User;
  created_at?: string;
  updated_at?: string;
  completed_at?: string | null;
  [key: string]: unknown;
}

export interface Evidence {
  id: number;
  file?: string;
  file_name?: string;
  filename?: string;
  description?: string;
  uploaded_by?: number | User;
  uploaded_at?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface Notification {
  id: number;
  type?: string;
  message?: string;
  title?: string;
  read?: boolean;
  is_read?: boolean;
  created_at?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface AuditLog {
  id: number;
  action?: string;
  user?: number | User | string;
  username?: string;
  object?: string;
  target?: string;
  details?: string;
  description?: string;
  timestamp?: string;
  created_at?: string;
  [key: string]: unknown;
}
