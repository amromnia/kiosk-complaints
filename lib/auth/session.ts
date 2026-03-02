import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { getUserByEmail, getUserById } from '../db/queries';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kiosk-complaints-secret-key-change-in-production'
);

export interface UserSession {
  id: number;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'user';
}

export async function createToken(user: UserSession) {
  return await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET_KEY);
}

export async function verifyToken(token: string): Promise<UserSession | null> {
  try {
    const verified = await jwtVerify(token, SECRET_KEY);
    return verified.payload as unknown as UserSession;
  } catch (error) {
    return null;
  }
}

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session');
  
  if (!token) return null;
  
  return await verifyToken(token.value);
}

export async function setSession(user: UserSession) {
  const token = await createToken(user);
  const cookieStore = await cookies();
  
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export async function authenticateUser(email: string, password: string): Promise<UserSession | null> {
  const user: any = getUserByEmail(email);
  
  if (!user) return null;
  
  const isValidPassword = await bcrypt.compare(password, user.password);
  
  if (!isValidPassword) return null;
  
  if (user.status !== 'active') return null;
  
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export async function requireAuth(): Promise<UserSession> {
  const session = await getSession();
  
  if (!session) {
    throw new Error('Unauthorized');
  }
  
  return session;
}

export async function requireAdmin(): Promise<UserSession> {
  const session = await requireAuth();
  
  if (session.role !== 'admin' && session.role !== 'superadmin') {
    throw new Error('Forbidden: Admin access required');
  }
  
  return session;
}
