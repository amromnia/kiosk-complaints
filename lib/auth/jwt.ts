import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kiosk-complaints-secret-key-change-in-production'
);

export interface UserSession {
  id: number;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'user';
}

/**
 * Edge-compatible JWT token creation
 * No database dependencies
 */
export async function createToken(user: UserSession) {
  return await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET_KEY);
}

/**
 * Edge-compatible JWT token verification
 * No database dependencies - safe to use in middleware
 */
export async function verifyToken(token: string): Promise<UserSession | null> {
  try {
    const verified = await jwtVerify(token, SECRET_KEY);
    return verified.payload as unknown as UserSession;
  } catch (error) {
    return null;
  }
}
