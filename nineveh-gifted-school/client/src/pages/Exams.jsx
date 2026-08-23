import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { examAPI, classAPI } from '../../services/api';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { useForm } from '../../hooks/useForm';
import { 
  Plus, Award, Clock, Calendar, BookOpen, Edit, Trash2, 
  Eye, Loader2, Search, Users, Star, FileText
} from 'lucide-react';
import { formatDate, relativeTime, cn } from '../../utils/helpers';

export default function Exams() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('upcoming');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const { values, errors, handleChange, handleBlur, handleSubmit, resetForm, setFieldError } = useForm({
    initialValues: { title: '', classId: '', subject: '', examDate: '', duration: 60, maxScore: 100 },
    validate: (values) => {
      const errs = {};
      if (!values.title.trim()) errs.title = 'العنوان مطلوب';
      if (!values.classId) errs.classId = 'الصف مطلوب';
      if (!values.subject.trim()) errs.subject = 'المادة مطلوبة';
      if (!values.examDate) errs.examDate = 'تاريخ الامتحان مطلوب';
      if (!values.duration) errs.duration = 'المدة مطلوبة';
      return errs;
    },
    onSubmit: async (formValues) => {
      try {
        setCreating(true);
        await examAPI.create(formValues);
        setShowCreateModal(false);
        resetForm();
        loadExams();
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
    loadExams();
    loadClasses();
  }, [page, filter]);

  const loadExams = async () => {
    try {
      setLoading(true);
      const res = await examAPI.getAll({ page, limit: 10 });
      setExams(res.data.exams || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error('Failed to load exams:', error);
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
    if (!window.confirm('هل أنت متأكد من حذف هذا الامتحان؟')) return;
    try {
      await examAPI.delete(id);
      loadExams();
    } catch (error) {
      console.error('Failed to delete exam:', error);
    }
  };

  const canManage = user.role === 'TEACHER' || user.role === 'ADMIN';

  const now = new Date();
  const filteredExams = exams.filter(e => {
    const examDate = new Date(e.examDate);
    if (filter === 'upcoming') return examDate >= now;
    if (filter === 'past') return examDate < now;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الامتحانات</h1>
          <p className="text-gray-500 mt-1">جدول الامتحانات والدرجات</p>
        </div>
        {canManage && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            امتحان جديد
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: 'all', label: 'الكل' },
          { value: 'upcoming', label: 'القادمة' },
          { value: 'past', label: 'الماضية' }
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

      {/* Exams List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-28" />
            </Card>
          ))}
        </div>
      ) : filteredExams.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">لا توجد امتحانات</h3>
            <p className="text-gray-500 mb-4">
              {filter !== 'all' ? 'جرب تغيير الفلتر' : 'ابدأ بإنشاء امتحان جديد'}
            </p>
            {canManage && filter === 'all' && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                إنشاء أول امتحان
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {filteredExams.map((exam) => (
              <Card key={exam.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                          <Award className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{exam.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5" />
                              {exam.subject}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              {exam.class?.name}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(exam.examDate, { weekday: 'long', month: 'long', day: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {exam.duration} دقيقة
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5" />
                          {exam.maxScore} درجة
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link to={`/exams/${exam.id}`} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="عرض التفاصيل">
                        <Eye className="w-5 h-5" />
                      </Link>
                      {canManage && (
                        <>
                          <button className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="تعديل">
                            <Edit className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleDelete(exam.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="حذف">
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

      {/* Create Exam Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="إنشاء امتحان جديد" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="العنوان"
            name="title"
            value={values.title}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.title}
            placeholder="مثال: امتحان منتصف الفصل - رياضيات"
          />
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
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Input>
            <Input
              label="المادة"
              name="subject"
              value={values.subject}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.subject}
              placeholder="مثال: رياضيات، علوم، لغة عربية"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="تاريخ الامتحان"
              type="datetime-local"
              name="examDate"
              value={values.examDate}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.examDate}
            />
            <Input
              label="المدة (دقيقة)"
              type="number"
              name="duration"
              value={values.duration}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.duration}
              placeholder="60"
              min={1}
            />
            <Input
              label="الدرجة العظمى"
              type="number"
              name="maxScore"
              value={values.maxScore}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="100"
              min={1}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>إلغاء</Button>
            <Button type="submit" loading={creating}>حفظ</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}