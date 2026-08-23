import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { classAPI, userAPI } from '../services/api';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { useForm } from '../hooks/useForm';
import { 
  ArrowLeft, Users, GraduationCap, Building2, Mail, Phone,
  Plus, Search, MoreVertical, Edit, Trash2, Eye, Loader2
} from 'lucide-react';
import { formatDate, getInitials, getRoleLabel, getRoleColor, cn } from '../utils/helpers';

export default function ClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('students');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [search, setSearch] = useState('');

  const { values, errors, handleChange, handleBlur, handleSubmit, resetForm, setFieldError } = useForm({
    initialValues: { studentId: '' },
    validate: (values) => {
      const errs = {};
      if (!values.studentId) errs.studentId = 'يجب اختيار طالب';
      return errs;
    },
    onSubmit: async (formValues) => {
      try {
        await classAPI.assignStudent(id, formValues.studentId);
        setShowAddStudentModal(false);
        resetForm();
        loadClassData();
      } catch (err) {
        if (err.response?.data?.details) {
          err.response.data.details.forEach(d => setFieldError(d.field, d.message));
        }
      }
    }
  });

  useEffect(() => {
    loadClassData();
  }, [id]);

  const loadClassData = async () => {
    try {
      setLoading(true);
      const [classRes, studentsRes] = await Promise.all([
        classAPI.getById(id),
        classAPI.getStudents(id)
      ]);
      setClassData(classRes.data.class);
      setStudents(studentsRes.data.students || []);
    } catch (error) {
      console.error('Failed to load class:', error);
      navigate('/classes');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableStudents = async () => {
    try {
      const res = await userAPI.getAll({ role: 'STUDENT', limit: 100 });
      const unassigned = res.data.users.filter(u => !u.student?.classId);
      setAvailableStudents(unassigned);
    } catch (error) {
      console.error('Failed to load students:', error);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm('هل أنت متأكد من إزالة هذا الطالب من الصف؟')) return;
    try {
      await classAPI.removeStudent(id, studentId);
      loadClassData();
    } catch (error) {
      console.error('Failed to remove student:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="animate-pulse"><CardContent className="h-64" /></Card>
          <Card className="lg:col-span-2 animate-pulse"><CardContent className="h-64" /></Card>
        </div>
      </div>
    );
  }

  if (!classData) return null;

  const filteredStudents = students.filter(s => 
    s.user?.fullName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/classes')} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-primary-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{classData.name}</h1>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <Badge variant="primary" size="sm">الصف {classData.grade}</Badge>
                  <Badge variant="gray" size="sm">شعبة {classData.section}</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
        {(user.role === 'ADMIN' || user.role === 'TEACHER') && students.length > 0 && (
          <Button onClick={() => { loadAvailableStudents(); setShowAddStudentModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            إضافة طالب
          </Button>
        )}
      </div>

      {/* Class Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">عدد الطلاب</p>
                <p className="text-2xl font-bold text-gray-900">{students.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">المدرس المسؤول</p>
                <p className="font-medium text-gray-900">{classData.teacher?.user?.fullName || 'غير محدد'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Mail className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">بريد المدرس</p>
                <p className="font-medium text-gray-900 text-sm">{classData.teacher?.user?.email || 'غير متوفر'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4" aria-label="أقسام الصف">
          {[
            { id: 'students', label: 'الطلاب', icon: Users },
            { id: 'schedule', label: 'الجدول', icon: Building2 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'students' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-600" />
              قائمة الطلاب ({students.length})
            </CardTitle>
            <div className="relative max-w-xs">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="البحث عن طالب..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p>لا يوجد طلاب في هذا الصف</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredStudents.map((student) => (
                  <div key={student.id} className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar name={student.user?.fullName} src={student.user?.avatar} size="lg" />
                      <div>
                        <p className="font-medium text-gray-900">{student.user?.fullName}</p>
                        <p className="text-sm text-gray-500">{student.user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="gray" size="sm" className={cn(getRoleColor(student.user?.role))}>
                        {getRoleLabel(student.user?.role)}
                      </Badge>
                      {(user.role === 'ADMIN' || user.role === 'TEACHER') && (
                        <button onClick={() => handleRemoveStudent(student.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="إزالة من الصف">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'schedule' && (
        <Card>
          <CardContent className="p-5">
            <div className="text-center py-8 text-gray-500">
              <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p>سيتم عرض جدول الحصص هنا</p>
              <p className="text-sm">قيد التطوير</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Student Modal */}
      <Modal isOpen={showAddStudentModal} onClose={() => setShowAddStudentModal(false)} title="إضافة طالب للصف">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="اختر الطالب"
            name="studentId"
            value={values.studentId}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.studentId}
            placeholder="ابحث عن طالب..."
          >
            <select name="studentId" value={values.studentId} onChange={handleChange} onBlur={handleBlur} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white cursor-pointer">
              <option value="">اختر طالباً</option>
              {availableStudents.map(s => (
                <option key={s.id} value={s.id}>{s.fullName} ({s.email})</option>
              ))}
            </select>
          </Input>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowAddStudentModal(false)}>إلغاء</Button>
            <Button type="submit">إضافة</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}