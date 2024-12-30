import { User } from '../src/types/auth';

export interface Env {
  USERS?: string;
  ADMIN_PASSWORD?: string;
}

interface Session {
  id: string;
  userId: string;
  expiresAt: number;
}

const SESSIONS = new Map<string, Session>();
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function createSession(userId: string): Session {
  // Clean up expired sessions
  const now = Date.now();
  for (const [id, session] of SESSIONS.entries()) {
    if (session.expiresAt < now) {
      SESSIONS.delete(id);
    }
  }

  const session: Session = {
    id: crypto.randomUUID(),
    userId,
    expiresAt: Date.now() + SESSION_DURATION,
  };

  SESSIONS.set(session.id, session);
  return session;
}

export function getSession(sessionId: string): Session | undefined {
  const session = SESSIONS.get(sessionId);
  if (!session) return undefined;

  // Check if session is expired
  if (session.expiresAt < Date.now()) {
    SESSIONS.delete(sessionId);
    return undefined;
  }

  return session;
}

export function deleteSession(sessionId: string): void {
  SESSIONS.delete(sessionId);
}

export function getUserFromSession(sessionId: string, users: User[]): User | undefined {
  const session = getSession(sessionId);
  if (!session) return undefined;

  return users.find(user => user.username === session.userId);
}
