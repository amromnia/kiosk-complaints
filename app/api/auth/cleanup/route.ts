import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/schema';

// This endpoint should be called periodically (e.g., via cron job) to clean up expired registration links
// Example: curl -X POST http://localhost:3000/api/auth/cleanup -H "Authorization: Bearer YOUR_SECRET_KEY"

export async function POST(request: NextRequest) {
  try {
    // Simple authorization check - you can make this more secure
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CLEANUP_TOKEN || 'your-secret-cleanup-token';
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }
    
    // Delete expired tokens that are older than their expiration date
    const result = db.prepare(`
      DELETE FROM registration_links 
      WHERE datetime(expires_at) < datetime('now')
    `).run();
    
    // Also delete old used tokens (older than 30 days)
    const oldUsedResult = db.prepare(`
      DELETE FROM registration_links 
      WHERE is_used = 1 
      AND datetime(created_at) < datetime('now', '-30 days')
    `).run();
    
    return NextResponse.json({
      success: true,
      message: `تم حذف ${result.changes} رابط منتهي و ${oldUsedResult.changes} رابط مستخدم قديم`,
      expired_deleted: result.changes,
      old_used_deleted: oldUsedResult.changes
    });
  } catch (error: any) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء التنظيف' },
      { status: 500 }
    );
  }
}
