'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ComplaintType {
  id: number;
  name_ar: string;
  parent_id: number | null;
  level: number;
  display_order: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface AssignmentRule {
  id: number;
  complaint_type_id: number;
  user_id: number;
  user_name: string;
  complaint_type_name: string;
  is_active: boolean;
  created_at: string;
}

export default function AssignmentRulesPage() {
  const router = useRouter();
  const [rules, setRules] = useState<AssignmentRule[]>([]);
  const [complaintTypes, setComplaintTypes] = useState<ComplaintType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [newRule, setNewRule] = useState({
    complaint_type_id: '',
    user_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rulesRes, typesRes, usersRes] = await Promise.all([
        fetch('/api/assignment-rules'),
        fetch('/api/complaint-types'),
        fetch('/api/users'),
      ]);

      if (rulesRes.ok) {
        const data = await rulesRes.json();
        setRules(data.rules);
      }

      if (typesRes.ok) {
        const data = await typesRes.json();
        setComplaintTypes(data.complaintTypes);
      }

      if (usersRes.ok) {
        const data = await usersRes.json();
        // Only show active users with role 'user'
        setUsers(data.users.filter((u: User) => u.role === 'user' && u.status === 'active'));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newRule.complaint_type_id || !newRule.user_id) {
      setError('يرجى اختيار نوع الشكوى والمستخدم');
      return;
    }

    // Check if this combination already exists
    const duplicate = rules.find(
      r => r.complaint_type_id === parseInt(newRule.complaint_type_id) && 
           r.user_id === parseInt(newRule.user_id)
    );
    
    if (duplicate) {
      setError('هذا الموظف مُكلف بالفعل بهذا النوع من الشكاوى');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/assignment-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint_type_id: parseInt(newRule.complaint_type_id),
          user_id: parseInt(newRule.user_id),
        }),
      });

      if (res.ok) {
        setSuccess('تم إضافة القاعدة بنجاح');
        setNewRule({ complaint_type_id: '', user_id: '' });
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || 'فشل إضافة القاعدة');
      }
    } catch (err) {
      console.error('Error adding rule:', err);
      setError('حدث خطأ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRule = async (id: number) => {
    if (!confirm('هل تريد حذف هذه القاعدة؟')) return;

    try {
      const res = await fetch(`/api/assignment-rules?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSuccess('تم حذف القاعدة بنجاح');
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || 'فشل حذف القاعدة');
      }
    } catch (err) {
      console.error('Error deleting rule:', err);
      setError('حدث خطأ');
    }
  };

  // Get leaf complaint types (types with no children)
  const getLeafComplaintTypes = () => {
    if (!complaintTypes || complaintTypes.length === 0) return [];
    
    const typeIds = new Set(complaintTypes.map(t => t.id));
    const parentIds = new Set(complaintTypes.filter(t => t.parent_id !== null).map(t => t.parent_id));
    
    // Leaf types are those that are not in the parentIds set (no one has them as parent)
    return complaintTypes.filter(t => !parentIds.has(t.id)).sort((a, b) => a.name_ar.localeCompare(b.name_ar));
  };

  // Group rules by complaint type
  const groupedRules = (rules || []).reduce((acc, rule) => {
    const typeId = rule.complaint_type_id;
    if (!acc[typeId]) {
      acc[typeId] = {
        typeName: rule.complaint_type_name,
        rules: [],
      };
    }
    acc[typeId].rules.push(rule);
    return acc;
  }, {} as Record<number, { typeName: string; rules: AssignmentRule[] }>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner spinner-dark spinner-lg"></div>
      </div>
    );
  }

  const leafTypes = getLeafComplaintTypes();

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-navy)' }}>
          قواعد التكليف التلقائي
        </h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          إدارة تكليف الموظفين بالشكاوى حسب نوعها
        </p>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success mb-6">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>{success}</span>
        </div>
      )}

      {/* Add New Rule Form */}
      <div className="card mb-8">
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-navy)' }}>
          إضافة قاعدة جديدة
        </h3>
        
        <form onSubmit={handleAddRule} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">نوع الشكوى</label>
              <select
                className="form-input"
                value={newRule.complaint_type_id}
                onChange={(e) => setNewRule({ ...newRule, complaint_type_id: e.target.value })}
                required
                style={{ fontSize: '0.95rem' }}
              >
                <option value="">اختر نوع الشكوى</option>
                {(() => {
                  // Group complaint types hierarchically (same as complaint portal)
                  const level1Types = complaintTypes.filter(t => t.level === 1).sort((a, b) => a.display_order - b.display_order);
                  
                  return level1Types.flatMap(mainType => {
                    const level2Types = complaintTypes.filter(t => t.parent_id === mainType.id && t.level === 2).sort((a, b) => a.display_order - b.display_order);
                    
                    // If main type has no subtypes, show it directly (it's a leaf)
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
                                </option>
                              ))
                            ];
                          } else {
                            // Subtype is selectable (no level 3 children - it's a leaf)
                            return (
                              <option key={subType.id} value={subType.id}>
                                {subType.name_ar}
                              </option>
                            );
                          }
                        })}
                      </optgroup>
                    ];
                  });
                })()}
              </select>
            </div>

            <div>
              <label className="form-label">الموظف</label>
              <select
                className="form-input"
                value={newRule.user_id}
                onChange={(e) => setNewRule({ ...newRule, user_id: e.target.value })}
                required
              >
                <option value="">اختر الموظف</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? 'جاري الإضافة...' : 'إضافة قاعدة'}
          </button>
        </form>
      </div>

      {/* Rules List */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-6" style={{ color: 'var(--color-navy)' }}>
          القواعد الحالية
        </h3>

        {Object.keys(groupedRules).length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto mb-4 opacity-40">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
            <p>لا توجد قواعد محددة بعد</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedRules).map(([typeId, { typeName, rules }]) => (
              <div key={typeId} className="border-b pb-4 last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                <h4 className="font-semibold mb-3" style={{ color: 'var(--color-navy)' }}>
                  {typeName}
                  <span className="text-sm font-normal mr-2" style={{ color: 'var(--color-text-muted)' }}>
                    ({rules.length} {rules.length === 1 ? 'موظف' : 'موظفين'})
                  </span>
                </h4>
                
                <div className="space-y-2">
                  {rules.map(rule => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ background: 'var(--color-gold)', color: 'white', fontWeight: 'bold' }}
                        >
                          {rule.user_name.charAt(0)}
                        </div>
                        <span style={{ color: 'var(--color-text)' }}>{rule.user_name}</span>
                      </div>

                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="btn-icon text-red-600 hover:text-red-700"
                        title="حذف"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                          <line x1="10" y1="11" x2="10" y2="17"/>
                          <line x1="14" y1="11" x2="14" y2="17"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="card mt-6" style={{ background: '#eff6ff', border: '1px solid #3b82f6' }}>
        <div className="flex gap-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" className="flex-shrink-0">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <div className="text-sm" style={{ color: '#1e40af' }}>
            <p className="font-semibold mb-2">كيف تعمل قواعد التكليف التلقائي:</p>
            <ul className="list-disc mr-5 space-y-1">
              <li><strong>لا يوجد موظفين:</strong> الشكاوى تُكلف يدوياً فقط</li>
              <li><strong>موظف واحد:</strong> جميع الشكاوى تُكلف له تلقائياً</li>
              <li><strong>عدة موظفين:</strong> يتم اختيار الموظف صاحب أقل عدد شكاوى نشطة</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
