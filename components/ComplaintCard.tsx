'use client';

import { STATUS_LABELS_AR, PRIORITY_LABELS_AR } from '@/lib/utils/constants';

interface ComplaintCardProps {
  complaint: any;
  onClick?: () => void;
}

export default function ComplaintCard({ complaint, onClick }: ComplaintCardProps) {
  const getPriorityClass = (priority: string) => {
    if (priority === 'high') return 'priority-high';
    if (priority === 'medium') return 'priority-medium';
    return 'priority-low';
  };

  const getStatusClass = (status: string) => {
    return `status-${status}`;
  };

  return (
    <div className="card card-hover cursor-pointer" onClick={onClick}>
      {/* Top row: ID + badges */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="min-w-0">
          <p className="text-lg font-bold" style={{ color: '#1b2a4a' }}>
            شكوى #{complaint.reference_number}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{complaint.type_name}</p>
        </div>
        <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
          <span className={`badge ${getPriorityClass(complaint.priority)}`}>
            {PRIORITY_LABELS_AR[complaint.priority as keyof typeof PRIORITY_LABELS_AR]}
          </span>
          <span className={`badge ${getStatusClass(complaint.status)}`}>
            {STATUS_LABELS_AR[complaint.status as keyof typeof STATUS_LABELS_AR]}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2.5 text-sm">
        <div className="flex items-center justify-between">
          <span style={{ color: '#94a3b8' }}>الاسم</span>
          <span className="font-medium" style={{ color: '#1e293b' }}>{complaint.client_name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span style={{ color: '#94a3b8' }}>الهاتف</span>
          <span className="font-medium" style={{ color: '#1e293b' }} dir="ltr">{complaint.client_phone}</span>
        </div>
        <div className="flex items-center justify-between">
          <span style={{ color: '#94a3b8' }}>الموقع</span>
          <span className="font-medium" style={{ color: '#1e293b' }}>{complaint.kiosk_location}</span>
        </div>
        {complaint.assigned_user_name && (
          <div className="flex items-center justify-between">
            <span style={{ color: '#94a3b8' }}>المسؤول</span>
            <span className="font-medium" style={{ color: '#1e293b' }}>{complaint.assigned_user_name}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span style={{ color: '#94a3b8' }}>التاريخ</span>
          <span className="font-medium" style={{ color: '#1e293b' }}>
            {new Date(complaint.created_at).toLocaleDateString('ar-EG')}
          </span>
        </div>
      </div>

      {/* Description preview */}
      <div className="mt-4 pt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
        <p className="text-sm line-clamp-2" style={{ color: '#64748b' }}>{complaint.description}</p>
      </div>
    </div>
  );
}
