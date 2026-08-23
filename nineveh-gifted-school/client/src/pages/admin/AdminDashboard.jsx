import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userAPI, classAPI, assignmentAPI, examAPI, attendanceAPI } from '../../services/api';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { 
  Users, GraduationCap, FileText, CheckSquare, 
  Award, Calendar, Bell, TrendingUp, Activity,
  UserPlus, Building2, BookOpen, Clock
} from 'lucide-react';
import { formatDate, relativeTime, getRoleLabel, getRoleColor, cn } from '../../utils/helpers';

const statCards = [
  { name: 'إجمالي المستخدمين', icon: Users, color: 'bg-blue-500', key: 'totalUsers', href: '/admin/users' },
  { name: 'الطلاب', icon: GraduationCap, color: 'bg-green-500', key: 'totalStudents', href: '/admin/users?role=STUDENT' },
  { name: 'المدرسون', icon: UserPlus, color: 'bg-purple-500', key: 'totalTeachers', href: '/admin/users?role=TEACHER' },
  { name: 'الصفوف', icon: Building2, color: 'bg-orange-500', key: 'totalClasses', href: '/admin/classes' },
];

const activityCards = [
  { name: 'الواجبات', icon: FileText, color: 'bg-green-500', key: 'totalAssignments' },
  { name: 'الامتحانات', icon: Award, color: 'bg-red-500', key: 'totalExams' },
  { name: 'الإعلانات', icon: Bell, color: 'bg-yellow-500', key: 'totalAnnouncements' },
  { name: 'سجلات الحضور', icon: CheckSquare, color: 'bg-blue-500', key: 'totalAttendance' },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentClasses, setRecentClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [
        usersRes, 
        classesRes, 
        assignmentsRes, 
        examsRes,
        announcementsRes,
        attendanceRes
      ] = await Promise.all([
        userAPI.getStats(),
        classAPI.getAll({ limit: 5 }),
        assignmentAPI.getAll({ limit: 5 }),
        examAPI.getAll({ limit: 5 }),
        userAPI.getAll({ limit: 100 }), // Using as proxy for announcements count
        attendanceAPI.getAll({ limit: 100 })
      ]);

      // Get recent users
      const allUsersRes = await userAPI.getAll({ limit: 5, sortOrder: 'desc' });
      
      setStats({
        totalUsers: usersRes.data.stats?.totalUsers || 0,
        totalStudents: usersRes.data.stats?.totalStudents || 0,
        totalTeachers: usersRes.data.stats?.totalTeachers || 0,
        totalClasses: usersRes.data.stats?.totalClasses || 0,
        totalAssignments: assignmentsRes.data.total || 0,
        totalExams: examsRes.data.total || 0,
        totalAnnouncements: 0, // Would need announcements API
        totalAttendance: attendanceRes.data.total || 0,
      });

      setRecentUsers(allUsersRes.data.users || []);
      setRecentClasses(classesRes.data.classes || []);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 sm:p-8 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">لوحة تحكم الإدارة</h1>
            <p className="text-primary-100 mt-1">مرحباً {user?.fullName}، إليك نظرة شاملة على النظام</p>
          </div>
          <Badge variant="primary" size="lg" className={cn('bg-white/20 text-white border border-white/30')}>
            مدير النظام
          </Badge>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <a key={card.key} href={card.href} className="block">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{card.name}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats[card.key] || 0}
                    </p>
                  </div>
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', card.color)}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {activityCards.map((card) => (
          <Card key={card.key}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats[card.key] || 0}
                  </p>
                </div>
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', card.color)}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary-600" />
              أحدث المستخدمين
            </CardTitle>
            <a href="/admin/users" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              عرض الكل <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </a>
          </CardHeader>
          <CardContent className="pt-0">
            {recentUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p>لا يوجد مستخدمين</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentUsers.slice(0, 5).map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.fullName} src={u.avatar} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900">{u.fullName}</p>
                        <p className="text-sm text-gray-500">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="gray" size="xs" className={cn(getRoleColor(u.role))}>
                        {getRoleLabel(u.role)}
                      </Badge>
                      <span className="text-xs text-gray-400">{relativeTime(u.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Classes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-green-600" />
              أحدث الصفوف
            </CardTitle>
            <a href="/admin/classes" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              عرض الكل <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </a>
          </CardHeader>
          <CardContent className="pt-0">
            {recentClasses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p>لا يوجد صفوف</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentClasses.slice(0, 5).map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{cls.name}</p>
                        <p className="text-sm text-gray-500">الصف {cls.grade} - شعبة {cls.section}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{cls._count?.students || 0} طالب</span>
                      {cls.teacher && (
                        <span className="text-xs text-gray-400">{cls.teacher.user?.fullName}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            إجراءات سريعة
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <a href="/admin/users" className="p-4 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-colors text-center">
              <UserPlus className="w-8 h-8 mx-auto text-primary-600 mb-2" />
              <p className="text-sm font-medium text-gray-700">إضافة مستخدم</p>
            </a>
            <a href="/admin/classes" className="p-4 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-colors text-center">
              <Building2 className="w-8 h-8 mx-auto text-green-600 mb-2" />
              <p className="text-sm font-medium text-gray-700">إنشاء صف</p>
            </a>
            <a href="/announcements" className="p-4 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-colors text-center">
              <Bell className="w-8 h-8 mx-auto text-yellow-600 mb-2" />
              <p className="text-sm font-medium text-gray-700">إعلان جديد</p>
            </a>
            <a href="/assignments" className="p-4 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-colors text-center">
              <FileText className="w-8 h-8 mx-auto text-blue-600 mb-2" />
              <p className="text-sm font-medium text-gray-700">واجب جديد</p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}