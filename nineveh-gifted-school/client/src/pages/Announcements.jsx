import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { announcementAPI } from '../services/api';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { useForm } from '../hooks/useForm';
import { 
  Plus, Bell, Edit, Trash2, Eye, MoreVertical, 
  Loader2, Users, Shield, User, ChevronDown
} from 'lucide-react';
import { formatDate, relativeTime, getRoleLabel, getRoleColor, cn } from '../utils/helpers';

export default function Announcements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const { values, errors, handleChange, handleBlur, handleSubmit, resetForm, setFieldError } = useForm({
    initialValues: { title: '', content: '', targetRoles: ['STUDENT', 'TEACHER', 'PARENT'] },
    validate: (values) => {
      const errs = {};
      if (!values.title.trim()) errs.title = 'العنوان مطلوب';
      if (!values.content.trim()) errs.content = 'المحتوى مطلوب';
      return errs;
    },
    onSubmit: async (formValues) => {
      try {
        setCreating(true);
        await announcementAPI.create(formValues);
        setShowCreateModal(false);
        resetForm();
        loadAnnouncements();
      } catch (err) {
        if (err.response?.data?.details) {
          err.response.data.details.forEach(d => setFieldError(d.field, d.message));
        }
      } finally {
        setCreating(false);
      }
    }
  });

  useEffect(() => {
    loadAnnouncements();
  }, [page]);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await announcementAPI.getAll({ page, limit: 10 });
      setAnnouncements(res.data.announcements || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error('Failed to load announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;
    try {
      await announcementAPI.delete(id);
      loadAnnouncements();
    } catch (error) {
      console.error('Failed to delete announcement:', error);
    }
  };

  const canManage = user.role === 'ADMIN' || user.role === 'TEACHER';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الإعلانات</h1>
          <p className="text-gray-500 mt-1">إعلانات المدرسة والأخبار الهامة</p>
        </div>
        {canManage && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            إعلان جديد
          </Button>
        )}
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-24" />
            </Card>
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">لا توجد إعلانات</h3>
            <p className="text-gray-500 mb-4">سيظهر الإعلانات هنا عند إضافتها</p>
            {canManage && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                إنشاء أول إعلان
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {announcements.map((ann) => (
              <Card key={ann.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar name={ann.author?.fullName} src={ann.author?.avatar} size="sm" />
                        <div>
                          <h3 className="font-semibold text-gray-900">{ann.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{relativeTime(ann.createdAt)}</span>
                            <span>•</span>
                            <span>{ann.author?.fullName}</span>
                            <Badge variant="gray" size="xs" className={cn(getRoleColor(ann.author?.role))}>
                              {getRoleLabel(ann.author?.role)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700 line-clamp-3">{ann.content}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {ann.targetRoles?.map(role => (
                          <Badge key={role} variant="gray" size="xs" className={cn(getRoleColor(role))}>
                            {getRoleLabel(role)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="عرض">
                          <Eye className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="تعديل">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(ann.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="حذف">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                السابق
              </Button>
              <span className="text-sm text-gray-600">صفحة {page} من {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                التالي
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create Announcement Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="إنشاء إعلان جديد" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="العنوان"
            name="title"
            value={values.title}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.title}
            placeholder="عنوان الإعلان"
          />
          <div>
            <label className="label">المحتوى</label>
            <textarea
              name="content"
              value={values.content}
              onChange={handleChange}
              onBlur={handleBlur}
              rows={6}
              className={cn('input min-h-[120px] resize-y', errors.content && 'border-red-500 focus:ring-red-500')}
              placeholder="اكتب محتوى الإعلان هنا..."
            />
            {errors.content && <p className="mt-1 text-sm text-red-600" role="alert">{errors.content}</p>}
          </div>
          <fieldset>
            <legend className="label">المستهدفون</legend>
            <div className="grid grid-cols-3 gap-3">
              {['STUDENT', 'TEACHER', 'PARENT'].map(role => (
                <label key={role} className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    name="targetRoles"
                    value={role}
                    checked={values.targetRoles.includes(role)}
                    onChange={(e) => handleChange({ 
                      target: { 
                        name: 'targetRoles', 
                        value: e.target.checked 
                          ? [...values.targetRoles, role] 
                          : values.targetRoles.filter(r => r !== role) 
                      } 
                    })}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">{getRoleLabel(role)}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>إلغاء</Button>
            <Button type="submit" loading={creating}>نشر</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}