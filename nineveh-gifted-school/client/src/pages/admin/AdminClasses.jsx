import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { classAPI, userAPI } from '../../services/api';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { useForm } from '../../hooks/useForm';
import { 
  Building2, Search, Plus, Users, GraduationCap, Edit, 
  Trash2, Eye, Loader2, MoreVertical, UserPlus, Shield
} from 'lucide-react';
import { formatDate, getInitials, cn } from '../../utils/helpers';

export default function AdminClasses() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [viewingClass, setViewingClass] = useState(null);
  const [classStudents, setClassStudents] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  const { values, errors, handleChange, handleBlur, handleSubmit, resetForm, setFieldError, setValues } = useForm({
    initialValues: { name: '', grade: '', section: '', teacherId: '' },
    validate: (values) => {
      const errs = {};
      if (!values.name.trim()) errs.name = 'اسم الصف مطلوب';
      if (!values.grade) errs.grade = 'المرحلة مطلوبة';
      if (!values.section.trim()) errs.section = 'الشعبة مطلوبة';
      return errs;
    },
    onSubmit: async (formValues) => {
      if (editingClass) {
        await handleUpdateClass(formValues);
      } else {
        await handleCreateClass(formValues);
      }
    }
  });

  useEffect(() => {
    loadClasses();
    loadTeachers();
  }, [page, search, gradeFilter]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (gradeFilter) params.grade = gradeFilter;
      const res = await classAPI.getAll(params);
      setClasses(res.data.classes || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error('Failed to load classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTeachers = async () => {
    try {
      const res = await userAPI.getAll({ role: 'TEACHER', limit: 100 });
      setTeachers(res.data.users || []);
    } catch (error) {
      console.error('Failed to load teachers:', error);
    }
  };

  const handleCreateClass = async (formValues) => {
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
  };

  const handleUpdateClass = async (formValues) => {
    try {
      setUpdating(true);
      await classAPI.update(editingClass.id, formValues);
      setShowEditModal(false);
      resetForm();
      loadClasses();
    } catch (err) {
      if (err.response?.data?.details) {
        err.response.data.details.forEach(d => setFieldError(d.field, d.message));
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الصف؟ سيتم إزالة جميع الطلاب منه.')) return;
    try {
      await classAPI.delete(id);
      loadClasses();
    } catch (error) {
      console.error('Failed to delete class:', error);
    }
  };

  const openEditModal = (cls) => {
    setEditingClass(cls);
    setValues({
      name: cls.name,
      grade: String(cls.grade),
      section: cls.section,
      teacherId: cls.teacherId || ''
    });
    setShowEditModal(true);
  };

  const openStudentsModal = async (cls) => {
    setViewingClass(cls);
    try {
      const [studentsRes, allStudentsRes] = await Promise.all([
        classAPI.getStudents(cls.id),
        userAPI.getAll({ role: 'STUDENT', limit: 200 })
      ]);
      setClassStudents(studentsRes.data.students || []);
      const unassigned = (allStudentsRes.data.users || []).filter(u => !u.student?.classId);
      setAvailableStudents(unassigned);
      setShowStudentsModal(true);
    } catch (error) {
      console.error('Failed to load students:', error);
    }
  };

  const handleAssignStudent = async (studentId) => {
    try {
      await classAPI.assignStudent(viewingClass.id, studentId);
      openStudentsModal(viewingClass); // Refresh
    } catch (error) {
      console.error('Failed to assign student:', error);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm('هل أنت متأكد من إزالة هذا الطالب من الصف؟')) return;
    try {
      await classAPI.removeStudent(viewingClass.id, studentId);
      openStudentsModal(viewingClass); // Refresh
    } catch (error) {
      console.error('Failed to remove student:', error);
    }
  };

  const grades = [1,2,3,4,5,6,7,8,9,10,11,12];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة الصفوف</h1>
          <p className="text-gray-500 mt-1">إنشاء وتعديل وحذف الصفوف الدراسية</p>
        </div>
        <Button onClick={() => { resetForm(); setEditingClass(null); setShowCreateModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          صف جديد
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="البحث باسم الصف..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-w-[150px]"
            >
              <option value="">جميع المراحل</option>
              {grades.map(g => <option key={g} value={g}>الصف {g}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Classes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-40" />
            </Card>
          ))}
        </div>
      ) : classes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">لا توجد صفوف</h3>
            <p className="text-gray-500 mb-4">
              {search || gradeFilter ? 'جرب تغيير معايير البحث' : 'ابدأ بإنشاء صف جديد'}
            </p>
            {!search && !gradeFilter && (
              <Button onClick={() => { resetForm(); setEditingClass(null); setShowCreateModal(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                إنشاء أول صف
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <Card key={cls.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                          <GraduationCap className="w-6 h-6 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="primary" size="sm">الصف {cls.grade}</Badge>
                            <Badge variant="gray" size="sm">شعبة {cls.section}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {cls._count?.students || 0} طالب
                        </span>
                        {cls.teacher && (
                          <span className="flex items-center gap-1">
                            <Shield className="w-4 h-4" />
                            {cls.teacher.user?.fullName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openStudentsModal(cls)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="إدارة الطلاب">
                        <Users className="w-5 h-5" />
                      </button>
                      <button onClick={() => openEditModal(cls)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="تعديل">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(cls.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="حذف">
                        <Trash2 className="w-5 h-5" />
                      </button>
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
            placeholder="مثال: الصف الأول، القسم أ"
          />
          <div className="grid grid-cols-3 gap-4">
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
                {grades.map(g => <option key={g} value={g}>{g}</option>)}
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
            <Input
              label="المدرس المسؤول"
              name="teacherId"
              value={values.teacherId}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="اختر"
            >
              <select name="teacherId" value={values.teacherId} onChange={handleChange} onBlur={handleBlur} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white cursor-pointer">
                <option value="">بدون مدرس</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
              </select>
            </Input>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>إلغاء</Button>
            <Button type="submit" loading={creating}>حفظ</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Class Modal */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditingClass(null); }} title="تعديل الصف" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="اسم الصف"
            name="name"
            value={values.name}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.name}
          />
          <div className="grid grid-cols-3 gap-4">
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
                {grades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </Input>
            <Input
              label="الشعبة"
              name="section"
              value={values.section}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.section}
            />
            <Input
              label="المدرس المسؤول"
              name="teacherId"
              value={values.teacherId}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="اختر"
            >
              <select name="teacherId" value={values.teacherId} onChange={handleChange} onBlur={handleBlur} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white cursor-pointer">
                <option value="">بدون مدرس</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
              </select>
            </Input>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => { setShowEditModal(false); setEditingClass(null); }}>إلغاء</Button>
            <Button type="submit" loading={updating}>حفظ التغييرات</Button>
          </div>
        </form>
      </Modal>

      {/* Manage Students Modal */}
      <Modal isOpen={showStudentsModal} onClose={() => setShowStudentsModal(false)} title={`طلاب ${viewingClass?.name}`} size="xl">
        <div className="space-y-4">
          {/* Current Students */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-600" />
              الطلاب الحاليون ({classStudents.length})
            </h4>
            {classStudents.length === 0 ? (
              <p className="text-gray-500 text-center py-4">لا يوجد طلاب في هذا الصف</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {classStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar name={student.user?.fullName} src={student.user?.avatar} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900">{student.user?.fullName}</p>
                        <p className="text-xs text-gray-500">{student.user?.email}</p>
                      </div>
                    </div>
                    <button onClick={() => handleRemoveStudent(student.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="إزالة">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-green-600" />
              إضافة طلاب ({availableStudents.length} متاح)
            </h4>
            {availableStudents.length === 0 ? (
              <p className="text-gray-500 text-center py-4">جميع الطلاب مسجلين في صفوف</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar name={student.fullName} src={student.avatar} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900">{student.fullName}</p>
                        <p className="text-xs text-gray-500">{student.email}</p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleAssignStudent(student.id)}>
                      إضافة
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}