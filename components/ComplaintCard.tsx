'use client';

import { STATUS_LABELS_AR, PRIORITY_LABELS_AR } from '@/lib/utils/constants';

interface ComplaintCardProps {
  complaint: any;
  onClick?: () => void;
}

export default function ComplaintCard({ complaint, onClick }: ComplaintCardProps) {
  const getPriorityColor = (priority: string) => {
    if (priority === 'high') return 'bg-red-500';
    if (priority === 'medium') return 'bg-orange-500';
    return 'bg-gray-500';
  };
  
  const getStatusColor = (status: string) => {
    if (status === 'new') return 'bg-blue-500';
    if (status === 'assigned') return 'bg-purple-500';
    if (status === 'in_progress') return 'bg-yellow-500';
    if (status === 'resolved') return 'bg-green-500';
    if (status === 'closed') return 'bg-gray-600';
    return 'bg-orange-600';
  };
  
  return (
    <div
      className="card card-hover cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-[var(--primary)]">
            شكوى #{complaint.id}
          </h3>
          <p className="text-sm text-gray-500">{complaint.type_name}</p>
        </div>
        
        <div className="flex gap-2">
          <span className={`badge ${getPriorityColor(complaint.priority)} text-white`}>
            {PRIORITY_LABELS_AR[complaint.priority as keyof typeof PRIORITY_LABELS_AR]}
          </span>
          <span className={`badge ${getStatusColor(complaint.status)} text-white`}>
            {STATUS_LABELS_AR[complaint.status as keyof typeof STATUS_LABELS_AR]}
          </span>
        </div>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">الاسم:</span>
          <span className="font-semibold">{complaint.client_name}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">الهاتف:</span>
          <span className="font-semibold">{complaint.client_phone}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">الموقع:</span>
          <span className="font-semibold">{complaint.kiosk_location}</span>
        </div>
        
        {complaint.assigned_user_name && (
          <div className="flex justify-between">
            <span className="text-gray-600">المسؤول:</span>
            <span className="font-semibold">{complaint.assigned_user_name}</span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span className="text-gray-600">التاريخ:</span>
          <span className="font-semibold">
            {new Date(complaint.created_at).toLocaleDateString('ar-EG')}
          </span>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-gray-700 text-sm line-clamp-2">{complaint.description}</p>
      </div>
    </div>
  );
}
