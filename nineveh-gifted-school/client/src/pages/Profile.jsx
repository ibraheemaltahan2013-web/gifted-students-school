import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Input from '../components/ui/Input';
import { useForm } from '../hooks/useForm';
import { 
  User, Mail, Phone, Lock, Shield, Settings, 
  Camera, Save, AlertCircle, CheckCircle, Eye, EyeOff, Trash2, Download
} from 'lucide-react';
import { getRoleLabel, getRoleColor, cn, generateAvatarColor, getInitials } from '../utils/helpers';

export default function Profile() {
  const { user, updateProfile, changePassword, deleteAccount, refreshUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [childClassId, setChildClassId] = useState(user?.childrenClassIds?.[0] || '');
  const [savingClass, setSavingClass] = useState(false);

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

  // Profile form
  const { 
    values: profileValues, 
    errors: profileErrors, 
    handleChange: handleProfileChange, 
    handleBlur: handleProfileBlur, 
    handleSubmit: handleProfileSubmit,
    setValues: setProfileValues
  } = useForm({
    initialValues: { fullName: user?.fullName || '', email: user?.email || '', phone: user?.phone || '' },
    validate: (values) => {
      const errs = {};
      if (!values.fullName.trim()) errs.fullName = 'الاسم الكامل مطلوب';
      else if (values.fullName.trim().length < 2) errs.fullName = 'الاسم يجب أن يكون حرفين على الأقل';
      if (!values.email) errs.email = 'البريد الإلكتروني مطلوب';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errs.email = 'بريد إلكتروني غير صالح';
      return errs;
    },
    onSubmit: async (formValues) => {
      try {
        setSaving(true);
        await updateProfile(formValues);
        refreshUser();
      } catch (err) {
        if (err.response?.data?.details) {
          err.response.data.details.forEach(d => setProfileError(d.field, d.message));
        }
      } finally {
        setSaving(false);
      }
    }
  });

  // Password form
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { 
    values: passwordValues, 
    errors: passwordErrors, 
    handleChange: handlePasswordChange, 
    handleBlur: handlePasswordBlur, 
    handleSubmit: handlePasswordSubmit,
    resetForm: resetPasswordForm
  } = useForm({
    initialValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    validate: (values) => {
      const errs = {};
      if (!values.currentPassword) errs.currentPassword = 'كلمة المرور الحالية مطلوبة';
      if (!values.newPassword) errs.newPassword = 'كلمة المرور الجديدة مطلوبة';
      else if (values.newPassword.length < 8) errs.newPassword = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
      if (values.newPassword !== values.confirmPassword) errs.confirmPassword = 'كلمة المرور غير متطابقة';
      return errs;
    },
    onSubmit: async (formValues) => {
      try {
        setSaving(true);
        await changePassword({ 
          currentPassword: formValues.currentPassword, 
          newPassword: formValues.newPassword 
        });
        resetPasswordForm();
      } catch (err) {
        setPasswordError('currentPassword', err.response?.data?.error || 'كلمة المرور الحالية غير صحيحة');
      } finally {
        setSaving(false);
      }
    }
  });

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500000) {
        alert('حجم الصورة يجب أن يكون أقل من 500 كيلوبايت');
        return;
      }
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target.result;
        setAvatarPreview(base64);
        try {
          await updateProfile({ avatar: base64 });
          refreshUser();
        } catch (err) {
          console.error('Failed to save avatar:', err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError('كلمة المرور مطلوبة');
      return;
    }
    try {
      setDeleting(true);
      setDeleteError('');
      await deleteAccount(deletePassword);
      logout();
    } catch (err) {
      setDeleteError(err.response?.data?.error || 'كلمة المرور غير صحيحة');
    } finally {
      setDeleting(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'الملف الشخصي', icon: User },
    { id: 'security', label: 'الأمان وكلمة المرور', icon: Shield },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="relative">
              <Avatar 
                name={user?.fullName} 
                src={avatarPreview || user?.avatar} 
                size="2xl" 
              />
              <label className="absolute bottom-0 left-0 p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 cursor-pointer transition-colors">
                <Camera className="w-5 h-5" />
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="sr-only" />
              </label>
            </div>
            <div className="flex-1 text-center sm:text-right">
              <h1 className="text-2xl font-bold text-gray-900">{user?.fullName}</h1>
              <Badge variant="gray" size="lg" className={cn(getRoleColor(user?.role), 'mt-2')}>
                {getRoleLabel(user?.role)}
              </Badge>
              <p className="text-gray-500 mt-2">{user?.email}</p>
              {user?.phone && (
                <p className="text-gray-500 mt-1 flex items-center justify-center sm:justify-end gap-1">
                  <Phone className="w-4 h-4" />
                  {user.phone}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4" aria-label="أقسام الملف الشخصي">
          {tabs.map((tab) => (
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
      {activeTab === 'profile' && (<>
        <Card>
          <CardHeader>
            <CardTitle>معلومات الحساب</CardTitle>
          </CardHeader>
          <form onSubmit={handleProfileSubmit} className="space-y-4 p-6">
            <Input
              label="الاسم الكامل"
              name="fullName"
              value={profileValues.fullName}
              onChange={handleProfileChange}
              onBlur={handleProfileBlur}
              error={profileErrors.fullName}
              leftIcon={<User className="w-5 h-5 text-gray-400" />}
            />
            <Input
              label="البريد الإلكتروني"
              type="email"
              name="email"
              value={profileValues.email}
              onChange={handleProfileChange}
              onBlur={handleProfileBlur}
              error={profileErrors.email}
              leftIcon={<Mail className="w-5 h-5 text-gray-400" />}
            />
            <Input
              label="رقم الهاتف"
              type="tel"
              name="phone"
              value={profileValues.phone}
              onChange={handleProfileChange}
              onBlur={handleProfileBlur}
              placeholder="07XXXXXXXX"
              leftIcon={<Phone className="w-5 h-5 text-gray-400" />}
            />
            <div className="pt-4 border-t border-gray-100">
              <Button type="submit" className="w-full sm:w-auto" loading={saving}>
                <Save className="w-4 h-4 mr-2" />
                حفظ التغييرات
              </Button>
            </div>
          </form>
        </Card>

        {user?.role === 'PARENT' && (
          <Card>
            <CardHeader>
              <CardTitle>صف ابنك</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">اختر الصف الدراسي لطفلك لرؤية الواجبات والإشعارات الخاصة به</p>
              <select
                value={childClassId}
                onChange={(e) => setChildClassId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-white cursor-pointer"
              >
                <option value="">اختر الصف</option>
                <option value="first-intermediate">الأول متوسط</option>
                <option value="second-intermediate">الثاني متوسط</option>
                <option value="third-intermediate">الثالث متوسط</option>
                <option value="fourth-prep">الرابع إعدادي</option>
                <option value="fifth-prep">الخامس إعدادي</option>
                <option value="sixth-prep">السادس إعدادي</option>
              </select>
              <Button
                onClick={async () => {
                  setSavingClass(true);
                  try {
                    const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
                    await fetch(`${API_BASE_URL}/auth/update-child-class`, {
                      method: 'PUT',
                      credentials: 'include',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ classId: childClassId || null })
                    });
                    if (refreshUser) await refreshUser();
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setSavingClass(false);
                  }
                }}
                loading={savingClass}
              >
                <Save className="w-4 h-4 mr-2" />
                حفظ الصف
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-red-600">حذف الحساب</h3>
                <p className="text-xs text-gray-500 mt-1">حذف حسابك وجميع بياناتك نهائياً</p>
              </div>
              <Button variant="danger" onClick={() => setShowDeleteModal(true)} size="sm">
                <Trash2 className="w-4 h-4 mr-1" />
                حذف
              </Button>
            </div>
          </CardContent>
        </Card>
      </>)}

      {activeTab === 'security' && (
        <Card>
          <CardHeader>
            <CardTitle>تغيير كلمة المرور</CardTitle>
          </CardHeader>
          <form onSubmit={handlePasswordSubmit} className="space-y-4 p-6">
            <div className="relative">
              <Input
                label="كلمة المرور الحالية"
                type={showCurrentPassword ? 'text' : 'password'}
                name="currentPassword"
                value={passwordValues.currentPassword}
                onChange={handlePasswordChange}
                onBlur={handlePasswordBlur}
                error={passwordErrors.currentPassword}
                leftIcon={<Lock className="w-5 h-5 text-gray-400" />}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute left-3 top-[38px] text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="relative">
              <Input
                label="كلمة المرور الجديدة"
                type={showNewPassword ? 'text' : 'password'}
                name="newPassword"
                value={passwordValues.newPassword}
                onChange={handlePasswordChange}
                onBlur={handlePasswordBlur}
                error={passwordErrors.newPassword}
                leftIcon={<Lock className="w-5 h-5 text-gray-400" />}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute left-3 top-[38px] text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="relative">
              <Input
                label="تأكيد كلمة المرور الجديدة"
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={passwordValues.confirmPassword}
                onChange={handlePasswordChange}
                onBlur={handlePasswordBlur}
                error={passwordErrors.confirmPassword}
                leftIcon={<Lock className="w-5 h-5 text-gray-400" />}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute left-3 top-[38px] text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <Button type="submit" className="w-full sm:w-auto" variant="primary" loading={saving}>
                <Save className="w-4 h-4 mr-2" />
                تغيير كلمة المرور
              </Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'security' && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              حذف الحساب
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700 text-sm font-medium">تنبيه: هذا الإجراء لا يمكن التراجع عنه</p>
              <p className="text-red-600 text-sm mt-1">
                سيتم حذف حسابك وجميع بياناتك نهائياً. يرجى التأكد قبل المتابعة.
              </p>
            </div>
            <Button
              variant="danger"
              onClick={() => setShowDeleteModal(true)}
              className="w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              حذف الحساب
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات الحساب</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-500">تاريخ الانضمام</p>
              <p className="font-medium text-gray-900">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-SA') : 'غير متوفر'}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-500">معرف المستخدم</p>
              <p className="font-medium text-gray-900 font-mono text-xs">{user?.id}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-500">الدور</p>
              <Badge variant="gray" className={cn(getRoleColor(user?.role))}>
                {getRoleLabel(user?.role)}
              </Badge>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-500">الحالة</p>
              <Badge variant="success">نشط</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">حذف الحساب</h3>
            </div>
            <p className="text-gray-600 mb-4">
              أدخل كلمة المرور للتأكيد. هذا الإجراء لا يمكن التراجع عنه.
            </p>
            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {deleteError}
              </div>
            )}
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="أدخل كلمة المرور"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
            />
            <div className="flex gap-3">
              <Button
                variant="danger"
                onClick={handleDeleteAccount}
                loading={deleting}
                className="flex-1"
              >
                نعم، حذف الحساب
              </Button>
              <Button
                variant="secondary"
                onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteError(''); }}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Install App Section - Web only */}
      {!isStandalone && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary-600" />
              تثبيت التطبيق
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {deferredPrompt ? (
              <Button onClick={handleInstall} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                تثبيت الآن
              </Button>
            ) : (
              <>
                <p className="text-gray-600 text-sm">ثبّت التطبيق على جهازك للوصول السريع والعمل بلا انترنت</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900 text-sm mb-2">Android / كمبيوتر</p>
                    <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                      <li>افتح الموقع في Chrome</li>
                      <li>اضغط ⋮ (النقاط الثلاث)</li>
                      <li>اختر "تثبيت" أو "تثبيت الصفحة كتطبيق"</li>
                    </ol>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900 text-sm mb-2">iPhone / iPad</p>
                    <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                      <li>افتح الموقع في Safari</li>
                      <li>اضغط زر المشاركة ↗️</li>
                      <li>اختر "إضافة إلى الشاشة الرئيسية"</li>
                    </ol>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}