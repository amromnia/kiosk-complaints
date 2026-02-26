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
    description: ''
  });
  
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  
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
    } catch (err) {
      console.error('Error fetching complaint types:', err);
    }
  };
  
  const fetchKiosk = async () => {
    try {
      const res = await fetch('/api/kiosks');
      const data = await res.json();
      const foundKiosk = data.kiosks.find((k: Kiosk) => k.unique_link === kioskLink);
      setKiosk(foundKiosk || null);
    } catch (err) {
      console.error('Error fetching kiosk:', err);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
    }
  };
  
  const uploadFiles = async () => {
    const uploaded = [];
    
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadedBy', 'client');
      
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        const data = await res.json();
        
        if (data.success) {
          uploaded.push({
            path: data.path,
            type: data.type,
            filename: data.filename
          });
        }
      } catch (err) {
        console.error('Upload error:', err);
      }
    }
    
    return uploaded;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Validate required fields
      if (!formData.client_phone || !formData.client_national_id || !formData.client_name || 
          !formData.complaint_type_id || !formData.description) {
        setError('جميع الحقول مطلوبة');
        setLoading(false);
        return;
      }
      
      // Check if image is required
      if (selectedType?.requires_image && files.length === 0) {
        setError('يجب إرفاق صورة لهذا النوع من الشكاوى');
        setLoading(false);
        return;
      }
      
      // Upload files if any
      let attachments: any[] = [];
      if (files.length > 0) {
        attachments = await uploadFiles();
      }
      
      // Submit complaint
      const res = await fetch('/api/complaints/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          kiosk_link: kioskLink,
          attachments
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSubmitted(true);
        setComplaintId(data.complaint_id);
      } else {
        setError(data.error || 'حدث خطأ أثناء تسجيل الشكوى');
      }
    } catch (err) {
      setError('حدث خطأ أثناء تسجيل الشكوى');
      console.error('Submit error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="card max-w-2xl w-full text-center">
          <div className="mb-6">
            <svg className="w-20 h-20 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-green-600 mb-4">تم تسجيل الشكوى بنجاح!</h1>
          <p className="text-xl mb-4">رقم الشكوى: <span className="font-bold text-[var(--primary)]">#{complaintId}</span></p>
          <p className="text-gray-600 mb-8">
            سيتم التواصل معكم قريباً لحل المشكلة. شكراً لتواصلكم معنا.
          </p>
          <button 
            onClick={() => {
              setSubmitted(false);
              setFormData({
                client_phone: '',
                client_national_id: '',
                client_name: '',
                complaint_type_id: '',
                description: ''
              });
              setFiles([]);
              setComplaintId(null);
            }}
            className="btn btn-primary"
          >
            تقديم شكوى أخرى
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header */}
      <header className="gov-header py-6">
        <div className="container-custom">
          <h1 className="text-3xl font-bold text-center">نظام شكاوى ماكينات التجديد الذاتي</h1>
          <p className="text-center mt-2 text-blue-100">وزارة الداخلية - جمهورية مصر العربية</p>
          {kiosk && (
            <p className="text-center mt-2 text-yellow-300">الموقع: {kiosk.location}</p>
          )}
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container-custom py-12">
        <div className="max-w-3xl mx-auto">
          <div className="card">
            <h2 className="text-2xl font-bold mb-6 text-center text-[var(--primary)]">تقديم شكوى</h2>
            
            {error && (
              <div className="bg-red-100 border-r-4 border-red-500 text-red-700 p-4 mb-6 rounded">
                <p className="font-bold">خطأ</p>
                <p>{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Phone Number */}
              <div>
                <label className="label">رقم الهاتف *</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="01xxxxxxxxx"
                  value={formData.client_phone}
                  onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                  required
                  pattern="01[0-2,5][0-9]{8}"
                  maxLength={11}
                />
                <p className="text-sm text-gray-500 mt-1">أدخل رقم الهاتف المكون من 11 رقم</p>
              </div>
              
              {/* National ID */}
              <div>
                <label className="label">الرقم القومي *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="xxxxxxxxxxxxxxxx"
                  value={formData.client_national_id}
                  onChange={(e) => setFormData({ ...formData, client_national_id: e.target.value })}
                  required
                  pattern="[0-9]{14}"
                  maxLength={14}
                />
                <p className="text-sm text-gray-500 mt-1">أدخل الرقم القومي المكون من 14 رقم</p>
              </div>
              
              {/* Full Name */}
              <div>
                <label className="label">الاسم الكامل *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="أدخل اسمك الكامل"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  required
                />
              </div>
              
              {/* Complaint Type */}
              <div>
                <label className="label">نوع الشكوى *</label>
                <select
                  className="input"
                  value={formData.complaint_type_id}
                  onChange={(e) => setFormData({ ...formData, complaint_type_id: e.target.value })}
                  required
                >
                  <option value="">اختر نوع الشكوى</option>
                  {complaintTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name_ar}
                      {type.requires_image && ' (يتطلب صورة)'}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Description */}
              <div>
                <label className="label">وصف المشكلة *</label>
                <textarea
                  className="input"
                  rows={5}
                  placeholder="اشرح المشكلة بالتفصيل... (حد أقصى 500 حرف)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  maxLength={500}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.description.length} / 500 حرف
                </p>
              </div>
              
              {/* File Upload */}
              <div>
                <label className="label">
                  إرفاق صور {selectedType?.requires_image && '*'}
                </label>
                <input
                  type="file"
                  className="input"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  onChange={handleFileChange}
                  required={selectedType?.requires_image}
                />
                <p className="text-sm text-gray-500 mt-1">
                  يمكنك إرفاق صور بصيغة JPG, PNG, WEBP (حد أقصى 10 ميجابايت لكل ملف)
                </p>
                {files.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-semibold">الملفات المحددة:</p>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {Array.from(files).map((file, idx) => (
                        <li key={idx}>{file.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`btn btn-primary w-full text-lg ${loading ? 'btn-disabled' : ''}`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <span className="spinner mr-2"></span>
                      جاري التسجيل...
                    </span>
                  ) : (
                    'تقديم الشكوى'
                  )}
                </button>
              </div>
            </form>
          </div>
          
          {/* Info Section */}
          <div className="mt-8 bg-blue-50 border-r-4 border-blue-500 p-6 rounded-lg">
            <h3 className="font-bold text-lg mb-3 text-blue-900">معلومات هامة:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-500 ml-2">•</span>
                سيتم معالجة شكواكم في أقرب وقت ممكن
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 ml-2">•</span>
                يرجى التأكد من صحة رقم الهاتف للتواصل معكم
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 ml-2">•</span>
                احتفظ برقم الشكوى للمتابعة
              </li>
            </ul>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="gov-header py-6 mt-12">
        <div className="container-custom text-center">
          <p>© 2026 وزارة الداخلية - جمهورية مصر العربية</p>
          <p className="text-sm mt-2 text-blue-100">جميع الحقوق محفوظة</p>
        </div>
      </footer>
    </div>
  );
}
