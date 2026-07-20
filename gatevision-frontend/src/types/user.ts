export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export enum UserRole {
  ADMIN = "admin",
  SECURITY_OFFICER = "security_officer",
}
