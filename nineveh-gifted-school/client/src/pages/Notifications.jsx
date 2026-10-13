import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Card, { CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import { Bell, Plus, Trash2, Loader2 } from 'lucide-react';
import { formatDate, cn } from '../utils/helpers';

const CLASS_LIST = [
  { id: 'first-intermediate', name: 'الأول متوسط' },
  { id: 'second-intermediate', name: 'الثاني متوسط' },
  { id: 'third-intermediate', name: 'الثالث متوسط' },
  { id: 'fourth-prep', name: 'الرابع إعدادي' },
  { id: 'fifth-prep', name: 'الخامس إعدادي' },
  { id: 'sixth-prep', name: 'السادس إعدادي' },
];

export default function Notifications() {
  const { user } = useAuth();
  const canCreate = ['ADMIN', 'MANAGER', 'ASSISTANT'].includes(user?.role);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [sending, setSending] = useState(false);
  const lastCountRef = useRef(0);
  const pollingRef = useRef(null);

  useEffect(() => {
    loadNotifications();
    pollingRef.current = setInterval(loadNotifications, 15000);
    return () => clearInterval(pollingRef.current);
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/notifications`, {
        credentials: 'include'
      });
      const data = await res.json();
      const list = data.notifications || [];
      lastCountRef.current = list.length;
      setNotifications(list);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      setSending(true);
      await fetch(`${import.meta.env.VITE_API_URL || '/api'}/notifications`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), classId: selectedClass || null })
      });
      setContent('');
      setSelectedClass('');
      setShowForm(false);
      loadNotifications();
    } catch (error) {
      console.error('Failed to create notification:', error);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الاشعار؟')) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL || '/api'}/notifications/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      loadNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الاشعارات</h1>
          <p className="text-gray-500 mt-1">تابع آخر المستجدات</p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" />
            اشعار جديد
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleCreate} className="space-y-3">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
                placeholder="اكتب الاشعار هنا..."
                autoFocus
              />
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              >
                <option value="">جميع الصفوف</option>
                {CLASS_LIST.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setContent(''); setSelectedClass(''); }}>إلغاء</Button>
                <Button type="submit" loading={sending} disabled={!content.trim()}>ارسال</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">لا توجد اشعارات</h3>
            <p className="text-gray-500">ستظهر هنا الاشعارات الجديدة</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <Card key={notif.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <p className="text-gray-800 whitespace-pre-wrap flex-1">{notif.content}</p>
                  {notif.classId && (
                    <span className="shrink-0 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                      {CLASS_LIST.find(c => c.id === notif.classId)?.name || notif.classId}
                    </span>
                  )}
                  {!notif.classId && canCreate && (
                    <span className="shrink-0 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      للجميع
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Avatar name={notif.author?.fullName} src={notif.author?.avatar} size="sm" />
                    <span className="text-xs text-gray-500">{notif.author?.fullName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{formatDate(notif.createdAt)}</span>
                    {(user?.role === 'ADMIN' || notif.authorId === user?.id) && (
                      <button onClick={() => handleDelete(notif.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="حذف">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
