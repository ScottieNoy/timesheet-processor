export interface User {
  username: string;
  password: string;
  isAdmin?: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}
