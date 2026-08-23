import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { assignmentAPI, classAPI } from '../services/api';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { useForm } from '../hooks/useForm';
import { 
  Plus, Search, FileText, Clock, BookOpen, Edit, Trash2, 
  Eye, Loader2, CheckCircle, AlertCircle, Calendar, Upload
} from 'lucide-react';
import { formatDate, relativeTime, getAssignmentStatusLabel, getAssignmentStatusColor, cn } from '../utils/helpers';

export default function Assignments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const { values, errors, handleChange, handleBlur, handleSubmit, resetForm, setFieldError, setValues } = useForm({
    initialValues: { title: '', description: '', classId: '', dueDate: '', maxScore: 100, attachments: [] },
    validate: (values) => {
      const errs = {};
      if (!values.title.trim()) errs.title = 'العنوان مطلوب';
      if (!values.description.trim()) errs.description = 'الوصف مطلوب';
      if (!values.classId) errs.classId = 'الصف مطلوب';
      if (!values.dueDate) errs.dueDate = 'تاريخ التسليم مطلوب';
      return errs;
    },
    onSubmit: async (formValues) => {
      try {
        setCreating(true);
        await assignmentAPI.create(formValues);
        setShowCreateModal(false);
        resetForm();
        loadAssignments();
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
    loadAssignments();
    loadClasses();
  }, [page, filter]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const res = await assignmentAPI.getAll({ page, limit: 10 });
      setAssignments(res.data.assignments || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error('Failed to load assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const res = await classAPI.getMyClasses();
      setClasses(res.data.classes || []);
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الواجب؟')) return;
    try {
      await assignmentAPI.delete(id);
      loadAssignments();
    } catch (error) {
      console.error('Failed to delete assignment:', error);
    }
  };

  const canCreate = user.role === 'TEACHER' || user.role === 'ADMIN';

  const filteredAssignments = assignments.filter(a => {
    if (filter === 'pending') return a._count?.submissions === 0;
    if (filter === 'submitted') return a._count?.submissions > 0;
    if (filter === 'overdue') return new Date(a.dueDate) < new Date();
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الواجبات</h1>
          <p className="text-gray-500 mt-1">إدارة الواجبات المنزلية والتسليمات</p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            واجب جديد
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: 'all', label: 'الكل' },
          { value: 'pending', label: 'في الانتظار' },
          { value: 'submitted', label: 'مُسلمة' },
          { value: 'overdue', label: 'متأخرة' }
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
              filter === f.value 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Assignments List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-28" />
            </Card>
          ))}
        </div>
      ) : filteredAssignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">لا توجد واجبات</h3>
            <p className="text-gray-500 mb-4">
              {filter !== 'all' ? 'جرب تغيير الفلتر' : 'ابدأ بإنشاء واجب جديد'}
            </p>
            {canCreate && filter === 'all' && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                إنشاء أول واجب
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {filteredAssignments.map((assignment) => (
              <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5" />
                              {assignment.class?.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              تسليم: {formatDate(assignment.dueDate)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-600 line-clamp-2">{assignment.description}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <Badge variant="gray" size="sm" className={cn(getAssignmentStatusColor(
                          new Date(assignment.dueDate) < new Date() ? 'LATE' : 
                          assignment._count?.submissions > 0 ? 'SUBMITTED' : 'PENDING'
                        ))}>
                          {getAssignmentStatusLabel(
                            new Date(assignment.dueDate) < new Date() ? 'LATE' : 
                            assignment._count?.submissions > 0 ? 'SUBMITTED' : 'PENDING'
                          )}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {assignment._count?.submissions || 0} تسليم
                        </span>
                        <span className="text-sm text-gray-500">
                          من {assignment.maxScore} درجة
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link to={`/assignments/${assignment.id}`} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="عرض التفاصيل">
                        <Eye className="w-5 h-5" />
                      </Link>
                      {canCreate && (
                        <>
                          <button className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="تعديل">
                            <Edit className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleDelete(assignment.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="حذف">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
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

      {/* Create Assignment Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="إنشاء واجب جديد" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="العنوان"
            name="title"
            value={values.title}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.title}
            placeholder="مثال: واجب الرياضيات - الوحدة الأولى"
          />
          <div>
            <label className="label">الوصف</label>
            <textarea
              name="description"
              value={values.description}
              onChange={handleChange}
              onBlur={handleBlur}
              rows={4}
              className={cn('input min-h-[100px] resize-y', errors.description && 'border-red-500 focus:ring-red-500')}
              placeholder="تعليمات الواجب والتفاصيل..."
            />
            {errors.description && <p className="mt-1 text-sm text-red-600" role="alert">{errors.description}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="الصف"
              name="classId"
              value={values.classId}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.classId}
              placeholder="اختر الصف"
            >
              <select name="classId" value={values.classId} onChange={handleChange} onBlur={handleBlur} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white cursor-pointer">
                <option value="">اختر الصف</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name} (الصف {c.grade} - {c.section})</option>)}
              </select>
            </Input>
            <Input
              label="تاريخ التسليم"
              type="datetime-local"
              name="dueDate"
              value={values.dueDate}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.dueDate}
            />
          </div>
          <Input
            label="الدرجة العظمى"
            type="number"
            name="maxScore"
            value={values.maxScore}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="100"
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>إلغاء</Button>
            <Button type="submit" loading={creating}>حفظ</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}