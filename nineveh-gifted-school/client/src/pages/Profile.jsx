import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Input from '../../components/ui/Input';
import { useForm } from '../../hooks/useForm';
import { 
  User, Mail, Phone, Lock, Shield, Settings, 
  Camera, Save, AlertCircle, CheckCircle, Eye, EyeOff
} from 'lucide-react';
import { getRoleLabel, getRoleColor, cn, generateAvatarColor, getInitials } from '../../utils/helpers';

export default function Profile() {
  const { user, updateProfile, changePassword, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);

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
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { id: 'profile', label: 'الملف الشخصي', icon: User },
    { id: 'security', label: 'الأمان وكلمة المرور', icon: Shield },
    { id: 'preferences', label: 'التفضيلات', icon: Settings },
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
      {activeTab === 'profile' && (
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
      )}

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

      {activeTab === 'preferences' && (
        <Card>
          <CardHeader>
            <CardTitle>التفضيلات والإشعارات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-4">إعدادات الإشعارات</h4>
              <div className="space-y-4">
                {[
                  { id: 'emailNotifications', label: 'إشعارات البريد الإلكتروني', desc: 'استلام إشعارات عبر البريد الإلكتروني' },
                  { id: 'pushNotifications', label: 'إشعارات المتصفح', desc: 'إظهار إشعارات على سطح المكتب' },
                  { id: 'messageNotifications', label: 'إشعارات الرسائل', desc: 'تنبيه عند وصول رسالة جديدة' },
                  { id: 'assignmentNotifications', label: 'إشعارات الواجبات', desc: 'تنبيه عند إضافة واجب جديد أو موعد تسليم' },
                  { id: 'gradeNotifications', label: 'إشعارات الدرجات', desc: 'تنبيه عند نشر درجة جديدة' },
                ].map(pref => (
                  <label key={pref.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="font-medium text-gray-900">{pref.label}</p>
                      <p className="text-sm text-gray-500">{pref.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </label>
                ))}
              </div>
            </div>
            
            <div className="pt-6 border-t border-gray-100">
              <h4 className="font-medium text-gray-900 mb-4">اللغة والمنطقة</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="اللغة"
                  placeholder="العربية"
                >
                  <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white cursor-pointer" disabled>
                    <option value="ar">العربية</option>
                  </select>
                </Input>
                <Input
                  label="المنطقة الزمنية"
                  placeholder="Asia/Baghdad"
                >
                  <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white cursor-pointer" disabled>
                    <option value="Asia/Baghdad">بغداد (UTC+3)</option>
                  </select>
                </Input>
              </div>
            </div>
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
    </div>
  );
}