'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface ComplaintType {
  id: number;
  name_ar: string;
  parent_id: number | null;
  level: number;
  requires_image: boolean;
  priority: number;
  display_order: number;
}

export default function ComplaintPage() {
  const params = useParams();
  const kioskLink = params.kiosk as string;

  const [kiosk, setKiosk] = useState<any>(null);
  const [kioskLoading, setKioskLoading] = useState(true);
  const [kioskNotFound, setKioskNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [complaintTypes, setComplaintTypes] = useState<ComplaintType[]>([]);
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
    fetchKiosk();
    fetchComplaintTypes();
  }, [kioskLink]);

  const fetchKiosk = async () => {
    setKioskLoading(true);
    try {
      const res = await fetch(`/api/kiosks/by-link/${kioskLink}`);
      if (res.ok) {
        const data = await res.json();
        setKiosk(data.kiosk);
        setKioskNotFound(false);
      } else {
        setKioskNotFound(true);
      }
    } catch (err) {
      console.error('Error fetching kiosk:', err);
      setKioskNotFound(true);
    } finally {
      setKioskLoading(false);
    }
  };

  const fetchComplaintTypes = async () => {
    try {
      const res = await fetch('/api/complaint-types');
      const data = await res.json();
      setComplaintTypes(data.complaintTypes || data.types || []);
    } catch (err) { console.error('Error fetching complaint types:', err); }
  };

  const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    const invalid = selected.filter(f => {
      const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
      return !ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_MIME_TYPES.includes(f.type);
    });
    if (invalid.length > 0) {
      setError(`الملفات التالية غير مسموح بها: ${invalid.map(f => f.name).join('، ')}. يُسمح فقط بـ JPG و PNG و WEBP.`);
      e.target.value = '';
      setFiles([]);
      return;
    }
    setError('');
    setFiles(selected);
  };

  const uploadFiles = async (): Promise<Array<{ path: string; type: string; filename: string }>> => {
    const uploaded = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('uploadedBy', 'client');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `فشل رفع الملف: ${file.name}`);
      }
      uploaded.push({ path: data.path, type: data.type, filename: data.filename });
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
      if (files.length > 0) {
        try {
          attachments = await uploadFiles();
        } catch (uploadErr: any) {
          setError(uploadErr.message || 'حدث خطأ أثناء رفع الملفات');
          setLoading(false);
          return;
        }
      }

      const res = await fetch('/api/complaints/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, kiosk_link: kioskLink, attachments }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        setReferenceNumber(data.reference_number);
      } else {
        setError(data.error || 'حدث خطأ أثناء تسجيل الشكوى');
      }
    } catch {
      setError('حدث خطأ أثناء تسجيل الشكوى');
    } finally { setLoading(false); }
  };

  /* ===== LOADING STATE ===== */
  if (kioskLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="spinner spinner-dark spinner-lg"></div>
        <p className="mt-4" style={{ color: 'var(--color-text-muted)' }}>جاري التحميل...</p>
      </div>
    );
  }

  /* ===== 404 STATE ===== */
  if (kioskNotFound || !kiosk) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
        <Header kioskLocation={null} />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-lg">
            <div className="card text-center" style={{ padding: '48px 32px' }}>
              <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <h1 className="text-3xl font-bold mb-3" style={{ color: '#dc2626' }}>الماكينة غير موجودة</h1>
              <p className="text-base mb-6" style={{ color: 'var(--color-text-secondary)', lineHeight: '1.7' }}>
                هذا الرابط غير صحيح أو أن الماكينة معطلة حالياً.<br/>
                يرجى التحقق من الرابط أو التواصل مع الدعم الفني.
              </p>
            </div>
          </div>
        </main>
        <footer style={{ background: 'var(--color-navy)', color: 'white', padding: '24px 0' }}>
          <div className="container-app text-center">
            <p className="text-sm opacity-90">© 2026 وزارة الداخلية — جمهورية مصر العربية</p>
          </div>
        </footer>
      </div>
    );
  }

  /* ===== SUCCESS STATE ===== */
  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
        <Header kioskLocation={kiosk.location} />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-lg">
            <div className="card text-center animate-fade-in" style={{ padding: '48px 32px' }}>
              <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#065f46" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h1 className="text-3xl font-bold mb-3" style={{ color: '#065f46' }}>تم تسجيل الشكوى بنجاح!</h1>
              <div className="mb-6 p-4 rounded-lg" style={{ background: '#f0fdf4', border: '2px solid #86efac' }}>
                <p className="text-sm mb-2" style={{ color: '#166534' }}>رقم الشكوى</p>
                <p className="text-2xl font-bold" style={{ color: '#065f46', wordBreak: 'break-all' }}>#{referenceNumber}</p>
              </div>
              <p className="text-base mb-8" style={{ color: 'var(--color-text-secondary)', lineHeight: '1.7' }}>
                سيتم التواصل معكم قريباً لحل المشكلة.<br/>
                شكراً لتواصلكم معنا.
              </p>
              <button
                onClick={() => { 
                  setSubmitted(false); 
                  setFormData({ client_phone: '', client_national_id: '', client_name: '', complaint_type_id: '', description: '' }); 
                  setFiles([]); 
                  setReferenceNumber(null); 
                }}
                className="btn btn-primary btn-lg"
              >
                تقديم شكوى أخرى
              </button>
            </div>
          </div>
        </main>
        <footer style={{ background: 'var(--color-navy)', color: 'white', padding: '24px 0' }}>
          <div className="container-app text-center">
            <p className="text-sm opacity-90">© 2026 وزارة الداخلية — جمهورية مصر العربية</p>
          </div>
        </footer>
      </div>
    );
  }

  /* ===== FORM STATE ===== */
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      <Header kioskLocation={kiosk.location} />

      <main className="flex-1 flex items-center justify-center py-8 px-4">
        <div className="w-full max-w-3xl">
          {/* Form card */}
          <div className="card animate-fade-in">
            <div className="mb-6 text-center pb-4" style={{ borderBottom: '2px solid var(--color-border)' }}>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-navy)' }}>تقديم شكوى</h2>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>يرجى ملء جميع الحقول المطلوبة بدقة</p>
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
                    onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })} required pattern="01[0-2,5][0-9]{8}" maxLength={11} dir="rtl" />
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
                  onChange={(e) => setFormData({ ...formData, complaint_type_id: e.target.value })} required
                  style={{ fontSize: '0.95rem' }}>
                  <option value="">اختر نوع الشكوى</option>
                  {(() => {
                    // Group complaint types hierarchically
                    const level1Types = complaintTypes.filter(t => t.level === 1).sort((a, b) => a.display_order - b.display_order);
                    
                    return level1Types.flatMap(mainType => {
                      const level2Types = complaintTypes.filter(t => t.parent_id === mainType.id && t.level === 2).sort((a, b) => a.display_order - b.display_order);
                      
                      // If main type has no subtypes, show it directly
                      if (level2Types.length === 0) {
                        return (
                          <option key={mainType.id} value={mainType.id}>
                            {mainType.name_ar}
                          </option>
                        );
                      }
                      
                      // Show subtypes grouped under main type
                      return [
                        <optgroup key={mainType.id} label={`━━━ ${mainType.name_ar} ━━━`}>
                          {level2Types.flatMap(subType => {
                            const level3Types = complaintTypes.filter(t => t.parent_id === subType.id && t.level === 3).sort((a, b) => a.display_order - b.display_order);
                            
                            // If subtype has children (level 3), show subtype as disabled header then list children
                            if (level3Types.length > 0) {
                              return [
                                <option key={`header-${subType.id}`} disabled style={{ fontWeight: 600, color: '#1e293b', paddingTop: '4px' }}>
                                  - {subType.name_ar} -
                                </option>,
                                ...level3Types.map(leafType => (
                                  <option key={leafType.id} value={leafType.id}>
                                    {'    ' + leafType.name_ar}
                                    {/* {leafType.requires_image ? ' ⚠️' : ''} */}
                                  </option>
                                ))
                              ];
                            } else {
                              // Subtype is selectable (no level 3 children)
                              return (
                                <option key={subType.id} value={subType.id}>
                                  {subType.name_ar}
                                  {/* {subType.requires_image ? ' ⚠️' : ''} */}
                                </option>
                              );
                            }
                          })}
                        </optgroup>
                      ];
                    });
                  })()}
                </select>
                {selectedType?.requires_image ? (
                  <p className="text-xs mt-1" style={{ color: '#f59e0b' }}>⚠️ هذا النوع يتطلب إرفاق صور</p>
                ) : null}
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
          <div className="mt-8 p-6 rounded-xl" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid #bfdbfe' }}>
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#3b82f6' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              </div>
              <div className="flex-1 space-y-2 text-sm" style={{ color: '#1e40af' }}>
                <p className="font-medium">ملاحظات مهمة:</p>
                <ul className="space-y-1 mr-4" style={{ listStyle: 'disc' }}>
                  <li>سيتم معالجة شكواكم في أقرب وقت ممكن</li>
                  <li>يرجى التأكد من صحة رقم الهاتف للتواصل معكم</li>
                  <li>احتفظ برقم الشكوى للمتابعة</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ background: 'var(--color-navy)', color: 'white', padding: '24px 0' }}>
        <div className="container-app">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5"><path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/></svg>
              </div>
              <div>
                <p className="font-medium">وزارة الداخلية</p>
                <p className="text-xs opacity-75">جمهورية مصر العربية</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm opacity-90">نظام شكاوى ماكينات التجديد الذاتي</p>
              <p className="text-xs opacity-75 mt-1">© 2026 جميع الحقوق محفوظة</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ===== SUB-COMPONENTS ===== */
function Header({ kioskLocation }: { kioskLocation: string | null }) {
  return (
    <header style={{ background: 'linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-light) 100%)', color: 'white', padding: '32px 0', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      <div className="container-app">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(200,168,78,0.2)', border: '2px solid var(--color-gold)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="1.5"><path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/></svg>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1">نظام شكاوى ماكينات التجديد الذاتي</h1>
              <p className="text-sm opacity-90">وزارة الداخلية — جمهورية مصر العربية</p>
            </div>
          </div>
          {kioskLocation && (
            <div className="text-center md:text-right">
              <p className="text-xs opacity-75 mb-1">الموقع</p>
              <p className="text-lg font-semibold">{kioskLocation}</p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
