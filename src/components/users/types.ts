export interface ProfileCompletion {
  percentage: number;
  requiredMissing: string[];
}

export type AccountType = "BUYER" | "STORE_OWNER" | "STAFF";

export interface ApiUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone_number: string;
  amount_spent: number | string;
  date_joined: string;
  accountType?: string;
  isSuspended?: boolean;
  badge: boolean;
  profileCompletion?: ProfileCompletion;
  locationSource?: "AUTO" | "MANUAL" | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  amount_spent: number;
  date_joined: string;
  accountType?: string;
  isSuspended?: boolean;
  hasBadge?: boolean;
  profileCompletion?: ProfileCompletion;
  locationSource?: "AUTO" | "MANUAL" | null;
}

export interface FormattedUserRow extends User {
  dateJoinedLabel: string;
  amountSpentLabel: string;
  canUpgrade: boolean;
}
