import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import {
  LayoutDashboard, MessageSquare,
  Calendar, FileText, Award,
  Settings, LogOut, Menu, X, ChevronDown,
  Building2, Users, Bell, Download
} from 'lucide-react';
import { getRoleLabel, getRoleColor, cn } from '../utils/helpers';
import { initServiceWorker, requestNotificationPermission, showBrowserNotification } from '../utils/notify';

const navigation = [
  { name: 'لوحة التحكم', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'ASSISTANT', 'TEACHER', 'STUDENT', 'PARENT'] },
  { name: 'الرسائل', href: '/messages', icon: MessageSquare, roles: ['ADMIN', 'MANAGER', 'ASSISTANT', 'TEACHER', 'STUDENT', 'PARENT'] },
  { name: 'الواجبات', href: '/assignments', icon: FileText, roles: ['ADMIN', 'MANAGER', 'ASSISTANT', 'TEACHER', 'STUDENT', 'PARENT'] },
  { name: 'الامتحانات', href: '/exams', icon: Award, roles: ['ADMIN', 'MANAGER', 'ASSISTANT', 'TEACHER', 'STUDENT', 'PARENT'] },
  { name: 'الجدول', href: '/schedule', icon: Calendar, roles: ['ADMIN', 'MANAGER', 'ASSISTANT', 'TEACHER', 'STUDENT', 'PARENT'] },
  { name: 'الاشعارات', href: '/notifications', icon: Bell, roles: ['ADMIN', 'MANAGER', 'ASSISTANT', 'TEACHER', 'STUDENT', 'PARENT'] },
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
  const [notifCount, setNotifCount] = useState(0);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [notifPermission, setNotifPermission] = useState(() => {
    if (!('Notification' in window)) return 'unavailable';
    return Notification.permission;
  });
  const lastCountRef = useRef(0);
  const loadTimeRef = useRef(Date.now());

  useEffect(() => {
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    setIsStandalone(isPWA);

    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  useEffect(() => {
    let mounted = true;
    const start = async () => {
      await initServiceWorker();
      await requestNotificationPermission();
    };
    start();

    const fetchCount = async () => {
      try {
        const res = await fetch('https://nineveh-api.vercel.app/api/notifications', { credentials: 'include' });
        const data = await res.json();
        const list = data.notifications || [];
        const prev = lastCountRef.current;
        if (prev > 0 && list.length > prev) {
          const newItems = list.slice(0, list.length - prev);
          for (const n of newItems) {
            showBrowserNotification('موهوبين نينوى', n.content, n.id);
          }
        }
        lastCountRef.current = list.length;
        setNotifCount(list.length);
      } catch {}
    };
    lastCountRef.current = 0;
    fetchCount();
    const interval = setInterval(fetchCount, 10000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const filteredNav = navigation.filter(item => item.roles.includes(user?.role));
  const filteredAdminNav = adminNavigation.filter(item => item.roles.includes(user?.role));

  return (
    <div className="min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 right-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : 'translate-x-full'
      )}>
        <div className="flex h-full flex-col">
          {/* Logo Header */}
          <div className="flex flex-col items-center py-6 px-4 border-b border-gray-100">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary-200 mb-3">
              <img src="/school-logo.jpg" alt="شعار مدرسة موهوبين نينوى" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 text-center">موهوبين نينوى</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3" aria-label="القائمة الرئيسية">
            <div className="space-y-1">
              {filteredNav.map((item) => {
                const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                      isActive 
                        ? 'bg-primary-50 text-primary-700 shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className={cn('w-5 h-5 shrink-0', isActive ? 'text-primary-600' : 'text-gray-400')} />
                    <span>{item.name}</span>
                    {item.badge && unreadCount && unreadCount[item.badge] > 0 && (
                      <Badge variant="danger" size="sm" className="mr-auto">{unreadCount[item.badge]}</Badge>
                    )}
                  </NavLink>
                );
              })}
            </div>

            {filteredAdminNav.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="px-4 mb-2 text-xs font-semibold text-gray-400">إدارة النظام</p>
                <div className="space-y-1">
                  {filteredAdminNav.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                          isActive 
                            ? 'bg-primary-50 text-primary-700 shadow-sm' 
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        )}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <item.icon className={cn('w-5 h-5 shrink-0', isActive ? 'text-primary-600' : 'text-gray-400')} />
                        <span>{item.name}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            )}
          </nav>

          {!isStandalone && (
            <div className="px-3 pb-2">
              <button
                onClick={deferredPrompt ? handleInstall : () => { setSidebarOpen(false); window.location.href = '/profile'; }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-primary-600 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors"
              >
                <Download className="w-4 h-4" />
                تثبيت التطبيق
              </button>
            </div>
          )}

          {/* User Profile */}
          <div className="p-4 border-t border-gray-100">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Avatar name={user?.fullName} src={user?.avatar} size="md" status="online" />
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.fullName}</p>
                  <p className={cn('text-xs mt-0.5', getRoleColor(user?.role))}>
                    {getRoleLabel(user?.role)}
                  </p>
                </div>
                <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', userMenuOpen && 'rotate-180')} />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    <NavLink
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      الملف الشخصي
                    </NavLink>
                    <button
                      onClick={() => { logout(); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      تسجيل الخروج
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:mr-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
          <div className="flex items-center h-14 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1 flex items-center justify-between mr-2">
              <h1 className="text-base font-semibold text-gray-900">
                {filteredNav.find(item => location.pathname === item.href || location.pathname.startsWith(item.href + '/'))?.name || 'لوحة التحكم'}
              </h1>
              <div className="flex items-center gap-2">
                {!isStandalone && (
                  <button
                    onClick={deferredPrompt ? handleInstall : () => window.location.href = '/profile'}
                    className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    تثبيت التطبيق
                  </button>
                )}
                <NavLink to="/notifications" className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                  <Bell className="w-5 h-5" />
                  {notifCount > 0 && (
                    <span className="absolute -top-0.5 -left-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">{notifCount > 9 ? '9+' : notifCount}</span>
                  )}
                </NavLink>
                <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date().toLocaleDateString('ar-IQ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </div>
          </div>
        </header>

        {notifPermission !== 'granted' && notifPermission !== 'unavailable' && (
          <div className="bg-primary-50 border-b border-primary-100 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-primary-700">
              <Bell className="w-4 h-4" />
              <span>تفعيل الإشعارات لتلقي التنبيهات فور صدورها</span>
            </div>
            <button
              onClick={async () => {
                const result = await Notification.requestPermission();
                setNotifPermission(result);
                if (result === 'granted') {
                  const { initServiceWorker } = await import('../utils/notify');
                  await initServiceWorker();
                }
              }}
              className="px-4 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              تفعيل
            </button>
          </div>
        )}

        {/* Page Content */}
        <main className="p-4 sm:p-6" role="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

