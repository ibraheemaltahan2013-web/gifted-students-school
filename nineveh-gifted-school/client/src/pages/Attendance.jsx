import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { attendanceAPI, classAPI } from '../../services/api';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { useForm } from '../../hooks/useForm';
import { 
  CheckSquare, Calendar, Filter, Plus, Search, 
  Loader2, Users, Download, Edit, Trash2, Eye, ChevronRight
} from 'lucide-react';
import { formatDate, getAttendanceStatusLabel, getAttendanceStatusColor, cn } from '../../utils/helpers';

const statusOptions = [
  { value: 'PRESENT', label: 'حاضر', color: 'success' },
  { value: 'ABSENT', label: 'غائب', color: 'danger' },
  { value: 'LATE', label: 'متأخر', color: 'warning' },
  { value: 'EXCUSED', label: 'معذور', color: 'info' },
];

export default function Attendance() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ classId: '', status: '', date: '', startDate: '', endDate: '' });
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [recording, setRecording] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { values, errors, handleChange, handleBlur, handleSubmit, resetForm, setFieldError } = useForm({
    initialValues: { studentId: '', classId: '', status: 'PRESENT', notes: '' },
    validate: (values) => {
      const errs = {};
      if (!values.studentId) errs.studentId = 'الطالب مطلوب';
      if (!values.classId) errs.classId = 'الصف مطلوب';
      return errs;
    },
    onSubmit: async (formValues) => {
      try {
        setRecording(true);
        await attendanceAPI.record(formValues);
        setShowRecordModal(false);
        resetForm();
        loadRecords();
      } catch (err) {
        if (err.response?.data?.details) {
          err.response.data.details.forEach(d => setFieldError(d.field, d.message));
        }
      } finally {
        setRecording(false);
      }
    }
  });

  useEffect(() => {
    loadRecords();
    loadClasses();
  }, [page, filters.classId, filters.status, filters.date]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20, ...filters };
      Object.keys(params).forEach(key => params[key] === '' && delete params[key]);
      const res = await attendanceAPI.getAll(params);
      setRecords(res.data.attendance || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error('Failed to load attendance:', error);
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

  const canManage = user.role === 'TEACHER' || user.role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الحضور والغياب</h1>
          <p className="text-gray-500 mt-1">تسجيل ومتابعة حضور الطلاب</p>
        </div>
        {canManage && (
          <Button onClick={() => setShowRecordModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            تسجيل حضور
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <select
              value={filters.classId}
              onChange={(e) => setFilters({ ...filters, classId: e.target.value })}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-w-[180px]"
            >
              <option value="">جميع الصفوف</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-w-[150px]"
            >
              <option value="">جميع الحالات</option>
              {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            {canManage && (
              <Button variant="outline" onClick={() => { setSelectedDate(new Date().toISOString().split('T')[0]); setShowRecordModal(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                تسجيل جديد
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Records */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-20 p-4" />
            </Card>
          ))}
        </div>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">لا توجد سجلات حضور</h3>
            <p className="text-gray-500 mb-4">سيظهر سجلات الحضور هنا</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {records.map((record) => (
              <Card key={record.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar name={record.student?.user?.fullName} src={record.student?.user?.avatar} size="md" />
                      <div>
                        <p className="font-medium text-gray-900">{record.student?.user?.fullName}</p>
                        <p className="text-sm text-gray-500">{record.class?.name} • {formatDate(record.date, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="gray" size="sm" className={cn(getAttendanceStatusColor(record.status))}>
                        {getAttendanceStatusLabel(record.status)}
                      </Badge>
                      {record.notes && (
                        <span className="text-sm text-gray-500">{record.notes}</span>
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

      {/* Record Attendance Modal */}
      <Modal isOpen={showRecordModal} onClose={() => setShowRecordModal(false)} title="تسجيل حضور">
        <form onSubmit={handleSubmit} className="space-y-4">
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
            label="الطالب"
            name="studentId"
            value={values.studentId}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.studentId}
            placeholder="اختر الطالب"
          >
            <select name="studentId" value={values.studentId} onChange={handleChange} onBlur={handleBlur} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white cursor-pointer">
              <option value="">اختر الطالب</option>
            </select>
          </Input>
          <fieldset>
            <legend className="label">الحالة</legend>
            <div className="grid grid-cols-4 gap-2">
              {statusOptions.map(opt => (
                <label key={opt.value} className={cn(
                  'flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors',
                  values.status === opt.value 
                    ? `border-${opt.color}-500 bg-${opt.color}-50` 
                    : 'border-gray-200 hover:border-gray-300'
                )}>
                  <input
                    type="radio"
                    name="status"
                    value={opt.value}
                    checked={values.status === opt.value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className="font-medium text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <Input
            label="ملاحظات (اختياري)"
            name="notes"
            value={values.notes}
            onChange={handleChange}
            placeholder="ملاحظات إضافية..."
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowRecordModal(false)}>إلغاء</Button>
            <Button type="submit" loading={recording}>حفظ</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}