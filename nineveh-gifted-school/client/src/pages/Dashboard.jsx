import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { assignmentAPI, examAPI, scheduleAPI } from '../services/api';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { 
  FileText, 
  Award, Calendar, TrendingUp, ArrowRight, BookOpen, Clock
} from 'lucide-react';
import { formatDate, getRoleLabel, getRoleColor, cn } from '../utils/helpers';

const statCards = [
  { name: 'الواجبات', href: '/assignments', icon: FileText, color: 'bg-green-500', countKey: 'pendingAssignments' },
  { name: 'الامتحانات', href: '/exams', icon: Award, color: 'bg-red-500', countKey: 'totalExams' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [upcomingAssignments, setUpcomingAssignments] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const params = { limit: 1000 };
      if (user.role === 'STUDENT' && user.classId) {
        params.classId = user.classId;
      }

      const examParams = { limit: 5 };
      if (user.role === 'STUDENT' && user.classId) {
        examParams.classId = user.classId;
      }

      const [assignmentsRes, examsRes, scheduleRes] = await Promise.all([
        assignmentAPI.getAll(params).catch(() => ({ data: { assignments: [] } })),
        examAPI.getAll(examParams).catch(() => ({ data: { exams: [] } })),
        scheduleAPI.getMy().catch(() => ({ data: { schedules: [] } }))
      ]);

      // واجبات صفك فقط: للطالب صفك، لولي الأمر صفوف أبنائه، والمعلم واجباته
      let classAssignments = assignmentsRes?.data?.assignments || [];
      if (user.role === 'PARENT' && Array.isArray(user.childrenClassIds)) {
        classAssignments = classAssignments.filter(a => user.childrenClassIds.includes(a.classId));
      }

      setStats({
        pendingAssignments: classAssignments.length,
        totalExams: examsRes?.data?.exams?.length || 0,
      });

      setUpcomingAssignments(classAssignments);
      setUpcomingExams(examsRes?.data?.exams || []);
      
      const today = new Date().getDay();
      const todaySchedules = (scheduleRes?.data?.schedules || []).filter(s => s.dayOfWeek === today);
      setTodaySchedule(todaySchedules);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-24" />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="animate-pulse"><CardContent className="h-64" /></Card>
          <Card className="animate-pulse"><CardContent className="h-64" /></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 sm:p-8 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">مرحباً، {user?.fullName}!</h1>
            <p className="text-primary-100 mt-1">إليك ملخص نشاطك اليوم في مدرسة موهوبين نينوى</p>
          </div>
          <Badge variant="primary" size="lg" className={cn(getRoleColor(user?.role), 'bg-white/20 text-white border border-white/30')}>
            {getRoleLabel(user?.role)}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {statCards.map((card) => (
          <Link key={card.name} to={card.href} className="block">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', card.color)}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{card.name}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats[card.countKey] ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                الواجبات القادمة
              </CardTitle>
              <Link to="/assignments" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                عرض الكل <ArrowRight className="w-4 h-4" />
              </Link>
            </CardHeader>
            <CardContent className="pt-0">
              {upcomingAssignments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p>لا توجد واجبات حالياً</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingAssignments.slice(0, 5).map((assignment) => (
                    <Link key={assignment.id} to={`/assignments/${assignment.id}`} className="block">
                      <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 line-clamp-1">{assignment.title}</h4>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5" />
                              {assignment.class?.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {formatDate(assignment.dueDate, { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                        <Badge 
                          variant={
                            new Date(assignment.dueDate) < new Date() ? 'danger' : 
                            assignment._count?.submissions > 0 ? 'success' : 'warning'
                          }
                          size="sm"
                        >
                          {new Date(assignment.dueDate) < new Date() ? 'متأخر' : 
                           assignment._count?.submissions > 0 ? 'مُسلم' : 'في الانتظار'}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-red-600" />
                الامتحانات القادمة
              </CardTitle>
              <Link to="/exams" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                عرض الكل <ArrowRight className="w-4 h-4" />
              </Link>
            </CardHeader>
            <CardContent className="pt-0">
              {upcomingExams.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Award className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p>لا توجد امتحانات مجدولة</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingExams.slice(0, 5).map((exam) => (
                    <Link key={exam.id} to="/exams" className="block p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{exam.title}</h4>
                          <p className="text-sm text-gray-500">{exam.subject} - {exam.class?.name}</p>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">{formatDate(exam.examDate)}</p>
                          <p className="text-xs text-gray-400">{exam.duration} دقيقة</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                جدول اليوم
              </CardTitle>
              <Link to="/schedule" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                عرض الجدول <ArrowRight className="w-4 h-4" />
              </Link>
            </CardHeader>
            <CardContent className="pt-0">
              {todaySchedule.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p>لا توجد حصص اليوم</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todaySchedule.map((schedule) => (
                    <div key={schedule.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-6 h-6 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900">{schedule.subject}</h4>
                        <p className="text-sm text-gray-500">{schedule.class?.name} • {schedule.room || 'غير محدد'}</p>
                      </div>
                      <div className="text-left text-sm text-gray-500">
                        <p className="font-medium">{schedule.startTime} - {schedule.endTime}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

      </div>
    </div>
  );
}
