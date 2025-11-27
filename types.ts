
export enum Role {
  ADMIN = 'Administrator',
  SALESPERSON = 'Salesperson',
  APPROVER_L1 = 'Regional Manager (L1)',
  APPROVER_L2 = 'VP of Sales (L2)',
}

export type RoleLabels = Record<Role, string>;

export enum RequestStatus {
  DRAFT = 'Draft',
  PENDING_L1 = 'Pending L1 Approval',
  PENDING_L2 = 'Pending L2 Approval',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

export interface User {
  id: string;
  name: string;
  username: string;
  password: string;
  role: Role;
}

export interface AIAnalysis {
  riskScore: number; // 0-100
  riskLevel: 'Low' | 'Medium' | 'High';
  summary: string;
  recommendation: string;
}

export interface HawbSubmission {
  hawbNumbers: string;
  remarks: string;
  submittedAt: string;
}

export interface SalesRequest {
  id: string;
  icirs: string;
  customerName: string;
  territory: string;
  weight: string;
  destination: string;
  requestedPrice: number;
  submitterEmail: string;
  
  status: RequestStatus;
  createdAt: string; // ISO date string
  updatedAt: string;
  createdBy: string; // User name
  aiAnalysis?: AIAnalysis;
  rejectionReason?: string;
  
  hawbSubmission?: HawbSubmission;
  
  history: {
    action: string;
    timestamp: string;
    actor: Role;
    note?: string;
  }[];
}

export interface DashboardStats {
  totalRequests: number;
  approved: number;
  rejected: number;
  pendingValue: number;
  approvedValue: number;
}
