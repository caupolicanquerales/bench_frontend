
export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  email: string;
  roles: string[];
  avatarUrl?: string;
}