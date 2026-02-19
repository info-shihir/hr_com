export type RiskLevel = 'High' | 'Medium' | 'Low';

export interface Employee {
  employeeID: string;
  employeeName: string;
  department: string;
  role: string;
  email: string;
  joinDate: string;
  compliance_score: number;
  risk_level: RiskLevel;
  total_required: number;
  total_gaps: number;
  high_criticality_gaps: number;
  check_date: string;
  missing_documents: DocumentGap[];
  expired_documents: ExpiredDocumentGap[];
  expiring_soon: ExpiringSoonGap[];
  pending_acknowledgements: PolicyGap[];
}

export interface DocumentGap {
  document: string;
  criticality: string;
  category: string;
  action: string;
}

export interface ExpiredDocumentGap {
  document: string;
  upload_date: string;
  expiry_date: string;
  days_overdue: number;
  criticality: string;
  action: string;
}

export interface ExpiringSoonGap {
  document: string;
  expiry_date: string;
  days_remaining: number;
  criticality: string;
  action: string;
}

export interface PolicyGap {
  policy: string;
  status: string;
  last_acknowledged: string | null;
  action: string;
}

export interface DashboardStats {
  totalEmployees: number;
  averageCompliance: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  reportDate: string;
  overallStatus: string;
}
