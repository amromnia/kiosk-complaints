import ComplaintAnalytics from '@/components/ComplaintAnalytics';

export default function UserAnalyticsPage() {
  return <>
    <div className="page-header">
      <div>
        <h1>تحليلات الأداء</h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>نظرة على الشكاوى المكلف بها ومؤشرات الأداء</p>
      </div>
    </div>
    <ComplaintAnalytics />
  </>;
}
