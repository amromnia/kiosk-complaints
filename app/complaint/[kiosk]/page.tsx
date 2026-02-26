'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface ComplaintType {
  id: number;
  name_ar: string;
  requires_image: boolean;
  priority: number;
}

interface Kiosk {
  id: number;
  unique_link: string;
  location: string;
}

export default function ComplaintPage() {
  const params = useParams();
  const kioskLink = params.kiosk as string;

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [complaintId, setComplaintId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [complaintTypes, setComplaintTypes] = useState<ComplaintType[]>([]);
  const [kiosk, setKiosk] = useState<Kiosk | null>(null);
  const [formData, setFormData] = useState({
    client_phone: '',
    client_national_id: '',
    client_name: '',
    complaint_type_id: '',
    description: '',
  });
  const [files, setFiles] = useState<File[]>([]);

  const selectedType = complaintTypes.find(t => t.id === parseInt(formData.complaint_type_id));

  useEffect(() => {
    fetchComplaintTypes();
    fetchKiosk();
  }, []);

  const fetchComplaintTypes = async () => {
    try {
      const res = await fetch('/api/complaint-types');
      const data = await res.json();
      setComplaintTypes(data.types);
    } catch (err) { console.error('Error fetching complaint types:', err); }
  };

  const fetchKiosk = async () => {
    try {
      const res = await fetch('/api/kiosks');
      const data = await res.json();
      const found = data.kiosks.find((k: Kiosk) => k.unique_link === kioskLink);
      setKiosk(found || null);
    } catch (err) { console.error('Error fetching kiosk:', err); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files));
  };

  const uploadFiles = async () => {
    const uploaded = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('uploadedBy', 'client');
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.success) uploaded.push({ path: data.path, type: data.type, filename: data.filename });
      } catch (err) { console.error('Upload error:', err); }
    }
    return uploaded;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!formData.client_phone || !formData.client_national_id || !formData.client_name ||
          !formData.complaint_type_id || !formData.description) {
        setError('جميع الحقول مطلوبة');
        setLoading(false);
        return;
      }
      if (selectedType?.requires_image && files.length === 0) {
        setError('يجب إرفاق صورة لهذا النوع من الشكاوى');
        setLoading(false);
        return;
      }
      let attachments: any[] = [];
      if (files.length > 0) attachments = await uploadFiles();

      const res = await fetch('/api/complaints/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, kiosk_link: kioskLink, attachments }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        setComplaintId(data.complaint_id);
      } else {
        setError(data.error || 'حدث خطأ أثناء تسجيل الشكوى');
      }
    } catch {
      setError('حدث خطأ أثناء تسجيل الشكوى');
    } finally { setLoading(false); }
  };

  /* ===== SUCCESS STATE ===== */
  if (submitted) {
    return (
      <div className="min-h-screen" style={{ background: '#f0f4f8' }}>
        <Header kiosk={kiosk} />
        <main className="container-app py-12">
          <div className="max-w-lg mx-auto card text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: '#d1fae5' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#065f46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#065f46' }}>تم تسجيل الشكوى بنجاح!</h1>
            <p className="text-lg mb-1" style={{ color: '#1e293b' }}>رقم الشكوى: <span className="font-bold" style={{ color: '#1b2a4a' }}>#{complaintId}</span></p>
            <p className="text-sm mb-8" style={{ color: '#64748b' }}>سيتم التواصل معكم قريباً لحل المشكلة. شكراً لتواصلكم معنا.</p>
            <button
              onClick={() => { setSubmitted(false); setFormData({ client_phone: '', client_national_id: '', client_name: '', complaint_type_id: '', description: '' }); setFiles([]); setComplaintId(null); }}
              className="btn btn-primary"
            >تقديم شكوى أخرى</button>
          </div>
        </main>
      </div>
    );
  }

  /* ===== FORM STATE ===== */
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f0f4f8' }}>
      <Header kiosk={kiosk} />

      <main className="container-app py-8 sm:py-12 flex-1">
        <div className="max-w-2xl mx-auto">
          {/* Form card */}
          <div className="card animate-fade-in">
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold" style={{ color: '#1b2a4a' }}>تقديم شكوى</h2>
              <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>يرجى ملء جميع الحقول المطلوبة بدقة</p>
            </div>

            {error && (
              <div className="alert alert-error mb-6">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Two columns on wider screens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="form-label">رقم الهاتف *</label>
                  <input type="tel" className="form-input" placeholder="01xxxxxxxxx" value={formData.client_phone}
                    onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })} required pattern="01[0-2,5][0-9]{8}" maxLength={11} />
                  <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>رقم مكون من 11 رقم</p>
                </div>
                <div>
                  <label className="form-label">الرقم القومي *</label>
                  <input type="text" className="form-input" placeholder="xxxxxxxxxxxxxxxx" value={formData.client_national_id}
                    onChange={(e) => setFormData({ ...formData, client_national_id: e.target.value })} required pattern="[0-9]{14}" maxLength={14} />
                  <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>رقم مكون من 14 رقم</p>
                </div>
              </div>

              <div>
                <label className="form-label">الاسم الكامل *</label>
                <input type="text" className="form-input" placeholder="أدخل اسمك الكامل" value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })} required />
              </div>

              <div>
                <label className="form-label">نوع الشكوى *</label>
                <select className="form-input" value={formData.complaint_type_id}
                  onChange={(e) => setFormData({ ...formData, complaint_type_id: e.target.value })} required>
                  <option value="">اختر نوع الشكوى</option>
                  {complaintTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name_ar}{type.requires_image && ' (يتطلب صورة)'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">وصف المشكلة *</label>
                <textarea className="form-input" rows={4} placeholder="اشرح المشكلة بالتفصيل..." value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} required maxLength={500} />
                <p className="text-xs mt-1 text-left" style={{ color: '#94a3b8' }}>{formData.description.length} / 500</p>
              </div>

              <div>
                <label className="form-label">إرفاق صور {selectedType?.requires_image && '*'}</label>
                <div className="relative">
                  <input type="file" className="form-input" style={{ padding: '10px 16px' }}
                    accept="image/jpeg,image/jpg,image/png,image/webp" multiple onChange={handleFileChange} required={selectedType?.requires_image} />
                </div>
                <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>JPG, PNG, WEBP — حد أقصى 10 ميجابايت</p>
                {files.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {files.map((file, idx) => (
                      <span key={idx} className="badge" style={{ background: '#eff6ff', color: '#1e40af' }}>{file.name}</span>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
                {loading ? (
                  <span className="flex items-center justify-center gap-2"><span className="spinner" />جاري التسجيل...</span>
                ) : 'تقديم الشكوى'}
              </button>
            </form>
          </div>

          {/* Info box */}
          <div className="alert alert-info mt-6">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <div className="space-y-1 text-sm">
              <p>سيتم معالجة شكواكم في أقرب وقت ممكن</p>
              <p>يرجى التأكد من صحة رقم الهاتف للتواصل معكم</p>
              <p>احتفظ برقم الشكوى للمتابعة</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="gov-header py-5 mt-auto">
        <div className="container-app text-center">
          <p className="text-sm opacity-80">© 2026 وزارة الداخلية — جمهورية مصر العربية</p>
        </div>
      </footer>
    </div>
  );
}

/* ===== SUB-COMPONENTS ===== */
function Header({ kiosk }: { kiosk: Kiosk | null }) {
  return (
    <header className="gov-header py-5 sm:py-6">
      <div className="container-app text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5"><path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/></svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold">نظام شكاوى ماكينات التجديد الذاتي</h1>
        </div>
        <p className="text-sm opacity-60">وزارة الداخلية — جمهورية مصر العربية</p>
        {kiosk && (
          <p className="text-sm mt-1 font-medium" style={{ color: '#c8a84e' }}>الموقع: {kiosk.location}</p>
        )}
      </div>
    </header>
  );
}
