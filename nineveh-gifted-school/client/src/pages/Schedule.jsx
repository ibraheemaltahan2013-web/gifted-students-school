import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { scheduleAPI, classAPI } from '../services/api';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { useForm } from '../hooks/useForm';
import { 
  Calendar, Clock, BookOpen, Building2, User, Plus, 
  Edit, Trash2, Eye, Loader2, Search, ChevronRight
} from 'lucide-react';
import { cn } from '../utils/helpers';

const daysOfWeek = [
  { value: 0, label: 'الأحد', short: 'أحد' },
  { value: 1, label: 'الإثنين', short: 'اثنين' },
  { value: 2, label: 'الثلاثاء', short: 'ثلاثاء' },
  { value: 3, label: 'الأربعاء', short: 'أربعاء' },
  { value: 4, label: 'الخميس', short: 'خميس' },
  { value: 5, label: 'الجمعة', short: 'جمعة' },
  { value: 6, label: 'السبت', short: 'سبت' },
];

const workingDays = daysOfWeek.slice(0, 5);

export default function Schedule() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('week'); // week, list
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const { values, errors, handleChange, handleBlur, handleSubmit, resetForm, setFieldError } = useForm({
    initialValues: { classId: '', subject: '', teacherId: '', dayOfWeek: 0, startTime: '', endTime: '', room: '' },
    validate: (values) => {
      const errs = {};
      if (!values.classId) errs.classId = 'الصف مطلوب';
      if (!values.subject.trim()) errs.subject = 'المادة مطلوبة';
      if (!values.teacherId) errs.teacherId = 'المدرس مطلوب';
      if (!values.startTime) errs.startTime = 'وقت البداية مطلوب';
      if (!values.endTime) errs.endTime = 'وقت النهاية مطلوب';
      if (values.startTime && values.endTime && values.startTime >= values.endTime) {
        errs.endTime = 'وقت النهاية يجب أن يكون بعد وقت البداية';
      }
      return errs;
    },
    onSubmit: async (formValues) => {
      try {
        setCreating(true);
        await scheduleAPI.create({ ...formValues, dayOfWeek: Number(formValues.dayOfWeek) });
        setShowCreateModal(false);
        resetForm();
        loadSchedules();
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
    loadSchedules();
    loadClasses();
    loadTeachers();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const res = await scheduleAPI.getMy();
      setSchedules(res.data.schedules || []);
    } catch (error) {
      console.error('Failed to load schedules:', error);
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

  const loadTeachers = async () => {
    try {
      const res = await scheduleAPI.getAll({});
      // Extract unique teachers from schedules
      const uniqueTeachers = [...new Map((res.data.schedules || []).map(s => [s.teacher?.id, s.teacher])).values()];
      setTeachers(uniqueTeachers.filter(t => t));
    } catch (error) {
      console.error('Failed to load teachers:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الحصة؟')) return;
    try {
      await scheduleAPI.delete(id);
      loadSchedules();
    } catch (error) {
      console.error('Failed to delete schedule:', error);
    }
  };

  const canManage = user.role === 'TEACHER' || user.role === 'ADMIN';

  // Group schedules by day for week view
  const schedulesByDay = workingDays.map(day => ({
    day,
    schedules: schedules
      .filter(s => s.dayOfWeek === day.value)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }));

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الجدول الدراسي</h1>
          <p className="text-gray-500 mt-1">مواعيد الحصص والصفوف</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-gray-100 p-1">
            {['week', 'list'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded transition-colors',
                  view === v ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                )}
              >
                {v === 'week' ? 'أسبوع' : 'قائمة'}
              </button>
            ))}
          </div>
          {canManage && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              حصة جديدة
            </Button>
          )}
        </div>
      </div>

      {view === 'week' ? (
        // Week View
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <div className="min-w-[900px]">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-24 px-3 py-2 text-right font-medium text-gray-500">الوقت</th>
                    {workingDays.map(({ day, short }) => (
                      <th key={day.value} className="px-2 py-2 text-center font-medium text-gray-700 border-r border-gray-100">
                        <div className="flex flex-col items-center gap-1">
                          <span>{short}</span>
                          <span className="text-xs text-gray-400">{day.label}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((time, timeIndex) => (
                    <tr key={time} className={timeIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="w-24 px-3 py-1 text-right text-sm text-gray-500 font-medium border-b border-gray-100">
                        {time}
                      </td>
                      {workingDays.map(({ day }) => (
                        <td key={day.value} className="px-1 py-1 border-r border-gray-100 border-b border-gray-100 min-h-[80px] relative">
                          {schedulesByDay.find(d => d.day.value === day.value)?.schedules
                            .filter(s => s.startTime <= time && s.endTime > time)
                            .map(schedule => (
                              <Link
                                key={schedule.id}
                                to={`/classes/${schedule.class?.id}`}
                                className="absolute inset-x-0.5 top-0.5 bottom-0.5 m-0.5 bg-primary-100 border border-primary-200 rounded-lg p-1.5 text-xs hover:bg-primary-200 transition-colors z-10"
                                onClick={(e) => e.preventDefault()}
                              >
                                <div className="font-medium text-primary-800 truncate">{schedule.subject}</div>
                                <div className="text-primary-700 truncate">{schedule.class?.name}</div>
                                <div className="text-primary-600">{schedule.room || ''}</div>
                              </Link>
                            ))}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        // List View
        <>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-20 p-4" />
                </Card>
              ))}
            </div>
          ) : schedules.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">لا توجد حصص مجدولة</h3>
                <p className="text-gray-500 mb-4">أضف حصصاً جديدة للجدول</p>
                {canManage && (
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    إضافة أول حصة
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-3">
                {workingDays.map(({ day }) => {
                  const daySchedules = schedules.filter(s => s.dayOfWeek === day.value).sort((a, b) => a.startTime.localeCompare(b.startTime));
                  if (daySchedules.length === 0) return null;
                  return (
                    <Card key={day.value}>
                      <CardHeader className="bg-gray-50">
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-primary-600" />
                          {day.label}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {daySchedules.map(schedule => (
                            <div key={schedule.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                                  <BookOpen className="w-5 h-5 text-primary-600" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">{schedule.subject}</h4>
                                  <p className="text-sm text-gray-500">{schedule.class?.name} • {schedule.teacher?.user?.fullName}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-left">
                                  <p className="font-medium text-gray-900">{schedule.startTime} - {schedule.endTime}</p>
                                  {schedule.room && <p className="text-sm text-gray-500">{schedule.room}</p>}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Link to={`/classes/${schedule.class?.id}`} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="عرض الصف">
                                    <Eye className="w-5 h-5" />
                                  </Link>
                                  {canManage && (
                                    <>
                                      <button className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="تعديل">
                                        <Edit className="w-5 h-5" />
                                      </button>
                                      <button onClick={() => handleDelete(schedule.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="حذف">
                                        <Trash2 className="w-5 h-5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* Create Schedule Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="إضافة حصة جديدة" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="المدرس"
              name="teacherId"
              value={values.teacherId}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.teacherId}
              placeholder="اختر المدرس"
            >
              <select name="teacherId" value={values.teacherId} onChange={handleChange} onBlur={handleBlur} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white cursor-pointer">
                <option value="">اختر المدرس</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.user?.fullName}</option>)}
              </select>
            </Input>
            <Input
              label="اليوم"
              name="dayOfWeek"
              value={values.dayOfWeek}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="اختر اليوم"
            >
              <select name="dayOfWeek" value={values.dayOfWeek} onChange={handleChange} onBlur={handleBlur} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white cursor-pointer">
                {workingDays.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </Input>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="وقت البداية"
              type="time"
              name="startTime"
              value={values.startTime}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.startTime}
            />
            <Input
              label="وقت النهاية"
              type="time"
              name="endTime"
              value={values.endTime}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.endTime}
            />
            <Input
              label="القاعة (اختياري)"
              name="room"
              value={values.room}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="مثال: قاعة 1، مختبر علوم"
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