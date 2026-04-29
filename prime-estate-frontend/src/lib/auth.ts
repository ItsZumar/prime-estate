export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
};

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pe_token');
}

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('pe_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function saveAuth(token: string, user: AuthUser): void {
  localStorage.setItem('pe_token', token);
  localStorage.setItem('pe_user', JSON.stringify(user));
}

export function logout(): void {
  localStorage.removeItem('pe_token');
  localStorage.removeItem('pe_user');
}

export function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
