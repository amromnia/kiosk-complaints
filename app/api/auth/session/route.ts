import { NextResponse } from 'next/server';
import { getSession, clearSession } from '@/lib/auth/session';
import { getUserById } from '@/lib/db/queries';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ user: null });
    }

    // Verify the user still exists and is active in the database.
    // This ensures the frontend detects deactivation and redirects to login.
    const user: any = getUserById(session.id);
    if (!user || user.status !== 'active') {
      await clearSession();
      return NextResponse.json({ user: null });
    }
    
    return NextResponse.json({ 
      user: {
        id: session.id,
        name: session.name,
        email: session.email,
        role: session.role
      }
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ user: null });
  }
}
