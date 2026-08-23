import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { classAPI } from '../../services/api';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { useForm } from '../../hooks/useForm';
import { 
  Plus, Search, Users, GraduationCap, Building2, 
  Edit, Trash2, Eye, MoreVertical, Loader2
} from 'lucide-react';
import { formatDate, getInitials, cn } from '../../utils/helpers';

export default function Classes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const { values, errors, handleChange, handleBlur, handleSubmit, resetForm, setFieldError } = useForm({
    initialValues: { name: '', grade: '', section: '', teacherId: '' },
    validate: (values) => {
      const errs = {};
      if (!values.name.trim()) errs.name = 'اسم الصف مطلوب';
      if (!values.grade) errs.grade = 'المرحلة مطلوبة';
      if (!values.section.trim()) errs.section = 'الشعبة مطلوبة';
      return errs;
    },
    onSubmit: async (formValues) => {
      try {
        setCreating(true);
        await classAPI.create(formValues);
        setShowCreateModal(false);
        resetForm();
        loadClasses();
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
    loadClasses();
  }, [user]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const res = await classAPI.getMyClasses();
      setClasses(res.data.classes || []);
    } catch (error) {
      console.error('Failed to load classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الصف؟')) return;
    try {
      await classAPI.delete(id);
      loadClasses();
    } catch (error) {
      console.error('Failed to delete class:', error);
    }
  };

  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.section.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الصفوف</h1>
          <p className="text-gray-500 mt-1">إدارة الصفوف والطلاب</p>
        </div>
        {(user.role === 'ADMIN' || user.role === 'TEACHER') && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            صف جديد
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="البحث عن صف..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Classes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-40" />
            </Card>
          ))}
        </div>
      ) : filteredClasses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">لا توجد صفوف</h3>
            <p className="text-gray-500 mb-4">ابدأ بإنشاء صف جديد</p>
            {(user.role === 'ADMIN' || user.role === 'TEACHER') && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                إنشاء صف جديد
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.map((cls) => (
            <Card key={cls.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 truncate">{cls.name}</h3>
                        <p className="text-sm text-gray-500">الصف {cls.grade} - شعبة {cls.section}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {cls._count?.students || 0} طالب
                      </span>
                      {cls.teacher && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          {cls.teacher.user?.fullName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/classes/${cls.id}`} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="عرض التفاصيل">
                      <Eye className="w-5 h-5" />
                    </Link>
                    {(user.role === 'ADMIN' || user.role === 'TEACHER') && (
                      <>
                        <button className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="تعديل">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(cls.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="حذف">
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
      )}

      {/* Create Class Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="إنشاء صف جديد">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="اسم الصف"
            name="name"
            value={values.name}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.name}
            placeholder="مثال: الصف الأول"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="المرحلة"
              name="grade"
              value={values.grade}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.grade}
              placeholder="اختر"
            >
              <select name="grade" value={values.grade} onChange={handleChange} onBlur={handleBlur} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white cursor-pointer">
                <option value="">اختر المرحلة</option>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </Input>
            <Input
              label="الشعبة"
              name="section"
              value={values.section}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.section}
              placeholder="أ، ب، ج..."
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