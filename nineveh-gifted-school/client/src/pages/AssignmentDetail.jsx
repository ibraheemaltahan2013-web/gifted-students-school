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
  Loader2, Paperclip, MessageSquare, Star, Plus
} from 'lucide-react';
import { formatDate, relativeTime, getAssignmentStatusLabel, getAssignmentStatusColor, cn } from '../utils/helpers';

export default function AssignmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);

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
              </div>
            </div>
            {isOverdue && !isSubmitted && (
              <Badge variant="danger" size="sm" className="mt-2">متأخر</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs - removed */}

      {/* Tab Content */}

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