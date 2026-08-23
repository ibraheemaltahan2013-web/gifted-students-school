import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import {
  LayoutDashboard, Users, BookOpen, Bell, MessageSquare,
  Calendar, Clock, FileText, CheckSquare, Award,
  Settings, LogOut, Menu, X, ChevronDown, Shield,
  GraduationCap, Building2, UserPlus
} from 'lucide-react';
import { getRoleLabel, getRoleColor } from '../utils/helpers';

const navigation = [
  { name: 'لوحة التحكم', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] },
  { name: 'الصفوف', href: '/classes', icon: GraduationCap, roles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] },
  { name: 'الإعلانات', href: '/announcements', icon: Bell, roles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'], badge: 'announcements' },
  { name: 'الواجبات', href: '/assignments', icon: FileText, roles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'], badge: 'assignments' },
  { name: 'الرسائل', href: '/messages', icon: MessageSquare, roles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'], badge: 'messages' },
  { name: 'الحضور', href: '/attendance', icon: CheckSquare, roles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] },
  { name: 'الامتحانات', href: '/exams', icon: Award, roles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] },
  { name: 'الجدول', href: '/schedule', icon: Calendar, roles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] },
];

const adminNavigation = [
  { name: 'إدارة المستخدمين', href: '/admin/users', icon: Users, roles: ['ADMIN'] },
  { name: 'إدارة الصفوف', href: '/admin/classes', icon: Building2, roles: ['ADMIN'] },
];

export default function MainLayout() {
  const { user, logout } = useAuth();
  const { unreadCount } = useSocket();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const filteredNav = navigation.filter(item => item.roles.includes(user?.role));
  const filteredAdminNav = adminNavigation.filter(item => item.roles.includes(user?.role));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 right-0 z-50 w-64 bg-white border-l border-gray-200 transform transition-transform duration-300 lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">موهوبين نينوى</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              aria-label="إغلاق القائمة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1" aria-label="القائمة الرئيسية">
            {filteredNav.map((item) => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive 
                      ? 'bg-primary-50 text-primary-700' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.name}</span>
                  {item.badge && unreadCount && unreadCount[item.badge] > 0 && (
                    <Badge variant="danger" size="sm">{unreadCount[item.badge]}</Badge>
                  )}
                </NavLink>
              );
            })}

            {filteredAdminNav.length > 0 && (
              <>
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    إدارة النظام
                  </h3>
                </div>
                {filteredAdminNav.map((item) => {
                  const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive 
                          ? 'bg-primary-50 text-primary-700' 
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.name}</span>
                    </NavLink>
                  );
                })}
              </>
            )}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <Avatar name={user?.fullName} src={user?.avatar} size="md" status="online" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.fullName}</p>
                <Badge variant="gray" size="sm" className={getRoleColor(user?.role)}>
                  {getRoleLabel(user?.role)}
                </Badge>
              </div>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                aria-label="قائمة المستخدم"
                aria-expanded={userMenuOpen}
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            {userMenuOpen && (
              <div className="mt-3 py-2 space-y-1" role="menu">
                <NavLink
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                  role="menuitem"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <UserPlus className="w-4 h-4" />
                  الملف الشخصي
                </NavLink>
                <NavLink
                  to="/settings"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                  role="menuitem"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Settings className="w-4 h-4" />
                  الإعدادات
                </NavLink>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                  role="menuitem"
                >
                  <LogOut className="w-4 h-4" />
                  تسجيل الخروج
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              aria-label="فتح القائمة"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1 lg:flex-none">
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {filteredNav.find(item => location.pathname === item.href || location.pathname.startsWith(item.href + '/'))?.name || 'لوحة التحكم'}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-sm text-gray-500">
                {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8" role="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}