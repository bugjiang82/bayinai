export type AdminTab = "overview" | "users" | "content" | "settings";

export interface AdminStats {
  totalUsers: number;
  totalWorks: number;
  totalCreditsUsed: number;
  todayActive: number;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  credits: number;
  createdAt: string;
  industry?: string;
}

export interface GenerationRecord {
  id: string;
  type: string;
  status: string;
  prompt: string;
  cost: number;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}