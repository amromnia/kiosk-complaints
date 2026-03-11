'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { formatDate, STATUS_LABELS_AR, PRIORITY_LABELS_AR, calculateTimeElapsed } from '@/lib/utils/constants';
import { getAllowedStatusTransitions } from '@/lib/utils/status-workflow';

export default function AdminComplaintDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [complaint, setComplaint] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [assigningTo, setAssigningTo] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusChangeDescription, setStatusChangeDescription] = useState('');

  useEffect(() => { fetchAll(); }, [id]);

  const fetchAll = async () => {
    try {
      const [compRes, commentsRes, usersRes] = await Promise.all([
        fetch(`/api/complaints/${id}`),
        fetch(`/api/complaints/${id}/comments`),
        fetch('/api/users?pageSize=100'),
      ]);
      const compData = compRes.ok ? await compRes.json() : {};
      const commentsData = commentsRes.ok ? await commentsRes.json() : {};
      const usersData = usersRes.ok ? await usersRes.json() : {};

      setComplaint(compData.complaint || null);
      setComments(commentsData.comments || []);
      setAttachments(compData.attachments || []);
      setStatusHistory(compData.history || []);
      setActiveUsers((usersData.users || []).filter((u: any) => u.role === 'user' && u.status === 'active'));
      if (compData.complaint) {
        setAssigningTo(compData.complaint.assigned_user_id?.toString() || '');
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAssign = async () => {
    if (!assigningTo) return;
    setAssigning(true);
    try {
      const res = await fetch(`/api/complaints/${id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: parseInt(assigningTo) })
      });
      if (res.ok) await fetchAll();
    } catch (err) { console.error(err); }
    finally { setAssigning(false); }
  };

  const handleStatusChange = async () => {
    if (!newStatus || !statusChangeDescription.trim()) return;
    setChangingStatus(true);
    try {
      const res = await fetch(`/api/complaints/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, description: statusChangeDescription })
      });
      if (res.ok) {
        setNewStatus('');
        setStatusChangeDescription('');
        await fetchAll();
      }
    } catch (err) { console.error(err); }
    finally { setChangingStatus(false); }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/complaints/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_text: commentText, is_internal: isInternal })
      });
      if (res.ok) {
        setCommentText('');
        const data = await fetch(`/api/complaints/${id}/comments`).then(r => r.json());
        setComments(data.comments || []);
      }
    } catch (err) { console.error(err); }
    finally { setSubmittingComment(false); }
  };

  if (loading) return (
    <div className="empty-state"><div className="spinner spinner-dark spinner-lg"></div></div>
  );

  if (!complaint) return (
    <div className="empty-state">
      <p>الشكوى غير موجودة</p>
      <button className="btn btn-primary mt-3" onClick={() => router.push('/dashboard/admin/complaints')}>العودة للشكاوى</button>
    </div>
  );

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={() => router.push('/dashboard/admin/complaints')} className="btn btn-secondary" style={{ padding: '6px 12px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l7-7-7-7"/></svg>
          </button>
          <div>
            <h1>شكوى #{complaint.reference_number}</h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {complaint.type_name} — {complaint.kiosk_location}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className={`badge status-${complaint.status}`} style={{ fontSize: '0.9rem', padding: '6px 14px' }}>
            {(STATUS_LABELS_AR as any)[complaint.status]}
          </span>
          <span className={`badge priority-${complaint.priority}`} style={{ fontSize: '0.9rem', padding: '6px 14px' }}>
            {(PRIORITY_LABELS_AR as any)[complaint.priority]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Client Info */}
          <div className="card">
            <h3 className="text-base font-bold mb-4" style={{ color: 'var(--color-navy)', borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>بيانات مقدم الشكوى</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)', marginBottom: 4 }}>الاسم</p>
                <p style={{ fontWeight: 600 }}>{complaint.client_name}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)', marginBottom: 4 }}>الهاتف</p>
                <p style={{ direction: 'ltr', textAlign: 'right' }}>{complaint.client_phone}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)', marginBottom: 4 }}>الرقم القومي</p>
                <p style={{ direction: 'ltr', textAlign: 'right' }}>{complaint.client_national_id}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="card">
            <h3 className="text-base font-bold mb-3" style={{ color: 'var(--color-navy)', borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>وصف الشكوى</h3>
            <p style={{ lineHeight: 1.8, color: 'var(--color-text)' }}>{complaint.description}</p>
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="card">
              <h3 className="text-base font-bold mb-3" style={{ color: 'var(--color-navy)', borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>المرفقات ({attachments.length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {attachments.map((att: any) => (
                  <a key={att.id} href={`/api/files/${att.file_path}`} target="_blank" rel="noopener" className="card" style={{ padding: 12, textAlign: 'center', textDecoration: 'none' }}>
                    {att.file_type?.startsWith('image') ? (
                      <img src={`/api/files/${att.file_path}`} alt="" style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 6, marginBottom: 8 }} />
                    ) : (
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" style={{ margin: '0 auto 8px' }}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    )}
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{att.file_type || 'ملف'}</p>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="card">
            <h3 className="text-base font-bold mb-4" style={{ color: 'var(--color-navy)', borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>التعليقات ({comments.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              {comments.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 16 }}>لا توجد تعليقات بعد</p>
              ) : (
                comments.map((c: any) => (
                  <div key={c.id} style={{ padding: 12, background: c.is_internal ? '#fef3c7' : '#f0f9ff', borderRadius: 8, borderRight: `3px solid ${c.is_internal ? '#f59e0b' : '#2b7cda'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.user_name}</span>
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{formatDate(c.created_at)}</span>
                    </div>
                    <p className="text-sm" style={{ lineHeight: 1.7 }}>{c.comment_text}</p>
                    {c.is_internal ? <span className="badge badge-warning" style={{ marginTop: 6, fontSize: '0.7rem' }}>تعليق داخلي</span> : null}
                  </div>
                ))
              )}
            </div>
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
              <textarea
                className="form-input"
                rows={3}
                placeholder="أضف تعليقاً..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} />
                  تعليق داخلي (لا يظهر للمواطن)
                </label>
                <button className="btn btn-primary" disabled={submittingComment || !commentText.trim()} onClick={handleComment} style={{ padding: '6px 16px' }}>
                  {submittingComment ? 'جاري الإرسال...' : 'إضافة تعليق'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Info card */}
          <div className="card">
            <h3 className="text-base font-bold mb-4" style={{ color: 'var(--color-navy)', borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>معلومات</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)', marginBottom: 2 }}>الماكينة</p>
                <p className="text-sm" style={{ fontWeight: 600 }}>{complaint.kiosk_location}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)', marginBottom: 2 }}>نوع الشكوى</p>
                <p className="text-sm" style={{ fontWeight: 600 }}>{complaint.type_name}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)', marginBottom: 2 }}>تاريخ التقديم</p>
                <p className="text-sm">{formatDate(complaint.created_at)}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)', marginBottom: 2 }}>الوقت المنقضي</p>
                <p className="text-sm">{calculateTimeElapsed(complaint.created_at)}</p>
              </div>
              {complaint.assigned_user_name && (
                <div>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)', marginBottom: 2 }}>المكلف</p>
                  <p className="text-sm" style={{ fontWeight: 600 }}>{complaint.assigned_user_name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Assign */}
          <div className="card">
            <h3 className="text-base font-bold mb-3" style={{ color: 'var(--color-navy)', borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>تكليف موظف</h3>
            <select className="form-input mb-3" value={assigningTo} onChange={e => setAssigningTo(e.target.value)}>
              <option value="">اختر موظف...</option>
              {activeUsers.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <button className="btn btn-primary w-full" disabled={assigning || !assigningTo} onClick={handleAssign}>
              {assigning ? 'جاري التكليف...' : 'تكليف'}
            </button>
          </div>

          {/* Change Status */}
          <div className="card">
            <h3 className="text-base font-bold mb-3" style={{ color: 'var(--color-navy)', borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>تغيير الحالة</h3>
            <select className="form-input mb-3" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
              <option value="">اختر الحالة الجديدة...</option>
              {getAllowedStatusTransitions(complaint.status).map(status => (
                <option key={status} value={status}>{(STATUS_LABELS_AR as any)[status]}</option>
              ))}
            </select>
            <textarea
              className="form-input mb-3"
              rows={2}
              placeholder="سبب التغيير (مطلوب)..."
              value={statusChangeDescription}
              onChange={e => setStatusChangeDescription(e.target.value)}
            />
            <button className="btn btn-warning w-full" disabled={changingStatus || !newStatus || !statusChangeDescription.trim()} onClick={handleStatusChange}>
              {changingStatus ? 'جاري التحديث...' : 'تحديث الحالة'}
            </button>
          </div>

          {/* Status History */}
          {statusHistory.length > 0 && (
            <div className="card">
              <h3 className="text-base font-bold mb-3" style={{ color: 'var(--color-navy)', borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>سجل التغييرات</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {statusHistory.map((h: any) => (
                  <div key={h.id} style={{ fontSize: '0.8rem', padding: 8, background: '#f8fafc', borderRadius: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{h.user_name}</span>
                      <span style={{ color: 'var(--color-text-muted)' }}>{formatDate(h.created_at)}</span>
                    </div>
                    <p>
                      <span className={`badge status-${h.old_status}`} style={{ fontSize: '0.7rem' }}>{(STATUS_LABELS_AR as any)[h.old_status]}</span>
                      {' ← '}
                      <span className={`badge status-${h.new_status}`} style={{ fontSize: '0.7rem' }}>{(STATUS_LABELS_AR as any)[h.new_status]}</span>
                    </p>
                    {h.change_description && <p style={{ marginTop: 4, color: 'var(--color-text-muted)' }}>{h.change_description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
