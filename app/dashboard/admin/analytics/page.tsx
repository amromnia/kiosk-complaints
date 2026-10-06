import ComplaintAnalytics from '@/components/ComplaintAnalytics';

export default function AdminAnalyticsPage() {
  return <>
    <div className="page-header">
      <div>
        <h1>التحليلات</h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>توزيع شكاوى الماكينات ومؤشرات أداء الموظفين</p>
      </div>
    </div>
    <ComplaintAnalytics showKiosks />
  </>;
}
