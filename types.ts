
export type UserRole = 'ADMIN' | 'CREATOR';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Optional for security but needed for this demo auth
  role: UserRole;
  avatar?: string;
  active: boolean;
}

export interface Client {
  id: string;
  name: string;
  active: boolean;
}

// Fix: Changed 'Otherssss' to 'Other' to resolve type overlap errors in comparisons across the app
export type ContentType = 'Video' | 'Flyer' | 'Animation' | 'Newsletter' | 'Other';

export interface ContentEntry {
  id: string;
  creatorId: string;
  clientId: string; // Linked to the Client ID
  title: string;
  type: ContentType;
  link: string;
  date: string; // ISO string YYYY-MM-DD
}

export interface Notice {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'urgent';
  active: boolean;
  createdAt: string;
}

export interface AppSettings {
  appName: string;
  dailyGoal: number;
  monthlyClientGoal: number; // Goal per client per month
  allowWeekends: boolean;
  theme: 'light' | 'dark';
  logo?: string;
  favicon?: string;
  primaryColor?: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string; // ISO string YYYY-MM-DD
}
