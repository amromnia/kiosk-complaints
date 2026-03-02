export const ALLOWED_IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'webp'];
export const ALLOWED_DOCUMENT_TYPES = ['pdf', 'doc', 'docx', 'txt'];
export const MAX_FILE_SIZE_MB = 10;

export const STATUS_LABELS_AR = {
  new: 'جديدة',
  assigned: 'معينة',
  in_progress: 'قيد المعالجة',
  resolved: 'محلولة',
  closed: 'مغلقة',
  reopened: 'مُعادة الفتح'
};

export const PRIORITY_LABELS_AR = {
  high: 'عالية',
  medium: 'متوسطة',
  low: 'منخفضة'
};

export const PRIORITY_COLORS = {
  high: 'bg-red-500 text-white',
  medium: 'bg-orange-500 text-white',
  low: 'bg-gray-500 text-white'
};

export const ROLE_LABELS_AR = {
  superadmin: 'مدير أعلى',
  admin: 'مسؤول',
  user: 'موظف'
};

export const NOTIFICATION_TYPES_AR = {
  new_complaint: 'شكوى جديدة',
  status_change: 'تغيير الحالة',
  comment: 'تعليق جديد',
  assignment: 'تكليف جديد'
};

export const DESCRIPTION_MAX_LENGTH = 500;

export function getPriorityFromType(priority: number): string {
  if (priority === 1) return 'high';
  if (priority === 2) return 'medium';
  return 'low';
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
}

export function formatDateShort(date: string | Date): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d);
}

export function calculateTimeElapsed(startDate: string | Date): string {
  const start = new Date(startDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays} يوم`;
  } else if (diffHours > 0) {
    return `${diffHours} ساعة`;
  } else {
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return `${diffMins} دقيقة`;
  }
}
