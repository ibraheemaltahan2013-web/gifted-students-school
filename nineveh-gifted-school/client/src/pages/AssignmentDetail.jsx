import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { assignmentAPI } from '../services/api';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { useForm } from '../hooks/useForm';
import { 
  ArrowLeft, FileText, Clock, Calendar, User, CheckCircle, 
  AlertCircle, Upload, Download, Edit, Trash2, Eye, 
  Loader2, Paperclip, MessageSquare, Star
} from 'lucide-react';
import { formatDate, relativeTime, getAssignmentStatusLabel, getAssignmentStatusColor, cn } from '../utils/helpers';

export default function AssignmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [grading, setGrading] = useState(false);

  const { values, errors, handleChange, handleBlur, handleSubmit, resetForm, setFieldError, setValues } = useForm({
    initialValues: { content: '', attachments: [], score: '', feedback: '' },
    validate: (values) => {
      const errs = {};
      if (showSubmitModal && !values.content.trim() && values.attachments.length === 0) {
        errs.content = 'يجب إضافة محتوى أو مرفقات';
      }
      if (showGradeModal && (values.score === '' || values.score < 0)) {
        errs.score = 'الدرجة مطلوبة';
      }
      if (showGradeModal && values.score > assignment?.maxScore) {
        errs.score = `الدرجة يجب ألا تتجاوز ${assignment?.maxScore}`;
      }
      return errs;
    },
    onSubmit: async (formValues) => {
      if (showSubmitModal) {
        await handleSubmitAssignment(formValues);
      } else if (showGradeModal) {
        await handleGradeSubmission(formValues);
      }
    }
  });

  useEffect(() => {
    loadAssignment();
  }, [id]);

  const loadAssignment = async () => {
    try {
      setLoading(true);
      const res = await assignmentAPI.getById(id);
      setAssignment(res.data.assignment);
    } catch (error) {
      console.error('Failed to load assignment:', error);
      navigate('/assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAssignment = async (formValues) => {
    try {
      setSubmitting(true);
      await assignmentAPI.submit(id, formValues);
      setShowSubmitModal(false);
      resetForm();
      loadAssignment();
    } catch (err) {
      if (err.response?.data?.details) {
        err.response.data.details.forEach(d => setFieldError(d.field, d.message));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGradeSubmission = async (formValues) => {
    try {
      setGrading(true);
      await assignmentAPI.grade(showGradeModal, { score: Number(formValues.score), feedback: formValues.feedback });
      setShowGradeModal(null);
      resetForm();
      loadAssignment();
    } catch (err) {
      if (err.response?.data?.details) {
        err.response.data.details.forEach(d => setFieldError(d.field, d.message));
      }
    } finally {
      setGrading(false);
    }
  };

  const canManage = user.role === 'TEACHER' || user.role === 'ADMIN';
  const isStudent = user.role === 'STUDENT';
  const mySubmission = assignment?.submissions?.find(s => s.student?.userId === user?.id);
  const isSubmitted = mySubmission && ['SUBMITTED', 'GRADED'].includes(mySubmission.status);
  const isOverdue = new Date(assignment?.dueDate) < new Date();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
        <Card className="animate-pulse"><CardContent className="h-64" /></Card>
      </div>
    );
  }

  if (!assignment) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/assignments')} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <Badge variant="gray" size="sm" className="mb-2">{assignment.class?.name}</Badge>
            <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <>
              <button className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="تعديل">
                <Edit className="w-5 h-5" />
              </button>
              <button onClick={() => { if(window.confirm('حذف الواجب؟')) assignmentAPI.delete(id).then(() => navigate('/assignments')) }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="حذف">
                <Trash2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Assignment Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">تاريخ التسليم</p>
                <p className="font-medium text-gray-900">{formatDate(assignment.dueDate, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                <p className="text-sm text-gray-500">{relativeTime(assignment.dueDate)}</p>
              </div>
            </div>
            {isOverdue && !isSubmitted && (
              <Badge variant="danger" size="sm" className="mt-2">متأخر</Badge>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Star className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">الدرجة العظمى</p>
                <p className="font-medium text-gray-900">{assignment.maxScore} درجة</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">التسليمات</p>
                <p className="font-medium text-gray-900">{assignment._count?.submissions || 0} من إجمالي الطلاب</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4" aria-label="أقسام الواجب">
          <button
            onClick={() => setActiveTab('details')}
            className={cn(
              'flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === 'details'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            <FileText className="w-4 h-4" />
            التفاصيل
          </button>
          {canManage && (
            <button
              onClick={() => setActiveTab('submissions')}
              className={cn(
                'flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === 'submissions'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <MessageSquare className="w-4 h-4" />
              التسليمات ({assignment._count?.submissions || 0})
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <Card>
          <CardHeader>
            <CardTitle>وصف الواجب</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-ar max-w-none text-gray-700 whitespace-pre-wrap">
              {assignment.description}
            </div>
            
            {assignment.attachments && assignment.attachments.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Paperclip className="w-5 h-5" />
                  المرفقات
                </h4>
                <div className="space-y-2">
                  {assignment.attachments.map((url, i) => (
                    <Link key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <Paperclip className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-700">مرفق {i + 1}</span>
                      <Download className="w-4 h-4 text-gray-400 ml-auto" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Student Actions */}
            {isStudent && !isSubmitted && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <Button onClick={() => setShowSubmitModal(true)} className="w-full" size="lg">
                  <Upload className="w-5 h-5 mr-2" />
                  تسليم الواجب
                </Button>
                {isOverdue && (
                  <p className="text-center text-sm text-red-600 mt-2">تنبيه: انتهى موعد التسليم</p>
                )}
              </div>
            )}

            {isStudent && isSubmitted && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-800">تم تسليم الواجب</p>
                    <p className="text-sm text-green-700">بتاريخ: {formatDate(mySubmission.submittedAt)}</p>
                  </div>
                  {mySubmission.status === 'GRADED' && mySubmission.grade && (
                    <div className="ml-auto text-right">
                      <p className="text-2xl font-bold text-green-600">{mySubmission.grade.score} / {mySubmission.grade.maxScore}</p>
                      <p className="text-sm text-green-700">درجة الواجب</p>
                    </div>
                  )}
                </div>
                {mySubmission.grade?.feedback && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-1">ملاحظات المدرس:</h5>
                    <p className="text-gray-700">{mySubmission.grade.feedback}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'submissions' && canManage && (
        <Card>
          <CardHeader>
            <CardTitle>جميع التسليمات</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {assignment.submissions?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p>لا توجد تسليمات بعد</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {assignment.submissions?.map((submission) => (
                  <div key={submission.id} className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar name={submission.student?.user?.fullName} src={submission.student?.user?.avatar} size="md" />
                      <div>
                        <p className="font-medium text-gray-900">{submission.student?.user?.fullName}</p>
                        <p className="text-sm text-gray-500">تسليم: {formatDate(submission.submittedAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="gray" size="sm" className={cn(getAssignmentStatusColor(submission.status))}>
                        {getAssignmentStatusLabel(submission.status)}
                      </Badge>
                      {submission.status === 'SUBMITTED' && (
                        <Button size="sm" onClick={() => { setShowGradeModal(submission.id); setValues({ score: '', feedback: '' }); }}>
                          تصحيح
                        </Button>
                      )}
                      {submission.status === 'GRADED' && submission.grade && (
                        <span className="font-medium text-green-600">{submission.grade.score}/{submission.grade.maxScore}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submit Modal */}
      <Modal isOpen={showSubmitModal} onClose={() => setShowSubmitModal(false)} title="تسليم الواجب" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">الإجابة / المحتوى</label>
            <textarea
              name="content"
              value={values.content}
              onChange={handleChange}
              onBlur={handleBlur}
              rows={6}
              className={cn('input min-h-[150px] resize-y', errors.content && 'border-red-500 focus:ring-red-500')}
              placeholder="اكتب إجابتك هنا أو أرفق ملفات..."
            />
            {errors.content && <p className="mt-1 text-sm text-red-600" role="alert">{errors.content}</p>}
          </div>
          <div>
            <label className="label">المرفقات (روابط)</label>
            <div className="space-y-2">
              {values.attachments.map((url, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => {
                      const newAttachments = [...values.attachments];
                      newAttachments[i] = e.target.value;
                      handleChange({ target: { name: 'attachments', value: newAttachments } });
                    }}
                    className="input flex-1"
                    placeholder="رابط المرفق"
                  />
                  <button type="button" onClick={() => {
                    const newAttachments = values.attachments.filter((_, idx) => idx !== i);
                    handleChange({ target: { name: 'attachments', value: newAttachments } });
                  }} className="p-2 text-gray-400 hover:text-red-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => handleChange({ target: { name: 'attachments', value: [...values.attachments, ''] } })} className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1">
                <Plus className="w-4 h-4" />
                إضافة مرفق
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowSubmitModal(false)}>إلغاء</Button>
            <Button type="submit" loading={submitting}>تسليم</Button>
          </div>
        </form>
      </Modal>

      {/* Grade Modal */}
      <Modal isOpen={!!showGradeModal} onClose={() => setShowGradeModal(null)} title="تصحيح التسليم" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="الدرجة"
            type="number"
            name="score"
            value={values.score}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.score}
            placeholder={`من 0 إلى ${assignment?.maxScore}`}
            min={0}
            max={assignment?.maxScore}
          />
          <div>
            <label className="label">ملاحظات (اختياري)</label>
            <textarea
              name="feedback"
              value={values.feedback}
              onChange={handleChange}
              onBlur={handleBlur}
              rows={4}
              className="input min-h-[100px] resize-y"
              placeholder="ملاحظات للطالب..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowGradeModal(null)}>إلغاء</Button>
            <Button type="submit" loading={grading} variant="primary">حفظ الدرجة</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}