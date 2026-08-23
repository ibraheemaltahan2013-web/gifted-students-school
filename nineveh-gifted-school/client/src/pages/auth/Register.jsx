import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useForm } from '../../hooks/useForm';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, Shield } from 'lucide-react';

const roles = [
  { value: 'STUDENT', label: 'طالب', icon: User },
  { value: 'TEACHER', label: 'مدرس', icon: Shield },
  { value: 'PARENT', label: 'ولي أمر', icon: User },
];

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const { values, errors, handleChange, handleBlur, handleSubmit, setFieldError } = useForm({
    initialValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'STUDENT',
      gender: '',
      phone: ''
    },
    validate: (values) => {
      const errs = {};
      if (!values.fullName.trim()) errs.fullName = 'الاسم الكامل مطلوب';
      else if (values.fullName.trim().length < 2) errs.fullName = 'الاسم يجب أن يكون حرفين على الأقل';
      
      if (!values.email) errs.email = 'البريد الإلكتروني مطلوب';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errs.email = 'بريد إلكتروني غير صالح';
      
      if (!values.password) errs.password = 'كلمة المرور مطلوبة';
      else if (values.password.length < 8) errs.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
      
      if (values.password !== values.confirmPassword) errs.confirmPassword = 'كلمة المرور غير متطابقة';
      
      return errs;
    },
    onSubmit: async (formValues) => {
      try {
        setError('');
        const { confirmPassword, ...data } = formValues;
        await register(data);
        navigate('/dashboard');
      } catch (err) {
        setError(err.response?.data?.error || 'فشل إنشاء الحساب');
        if (err.response?.data?.details) {
          err.response.data.details.forEach(d => setFieldError(d.field, d.message));
        }
      }
    }
  });

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-100 mb-3">
          <Shield className="w-6 h-6 text-primary-600" />
        </div>
        <CardTitle className="text-2xl">إنشاء حساب جديد</CardTitle>
        <CardDescription>انضم إلى مدرسة موهوبين نينوى</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm" role="alert">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="الاسم الكامل"
            type="text"
            name="fullName"
            value={values.fullName}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.fullName}
            placeholder="أحمد محمد علي"
            autoComplete="name"
            leftIcon={<User className="w-5 h-5 text-gray-400" />}
          />

          <Input
            label="البريد الإلكتروني"
            type="email"
            name="email"
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.email}
            placeholder="example@school.edu"
            autoComplete="email"
            leftIcon={<Mail className="w-5 h-5 text-gray-400" />}
          />

          <div className="relative">
            <Input
              label="كلمة المرور"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.password}
              placeholder="••••••••"
              autoComplete="new-password"
              leftIcon={<Lock className="w-5 h-5 text-gray-400" />}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-[38px] text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="تأكيد كلمة المرور"
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={values.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.confirmPassword}
              placeholder="••••••••"
              autoComplete="new-password"
              leftIcon={<Lock className="w-5 h-5 text-gray-400" />}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute left-3 top-[38px] text-gray-400 hover:text-gray-600"
              aria-label={showConfirmPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div>
            <label className="label">نوع الحساب</label>
            <div className="grid grid-cols-3 gap-3">
              {roles.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleChange({ target: { name: 'role', value } })}
                  className={`
                    relative p-4 rounded-xl border-2 text-center transition-all
                    ${values.role === value 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="role"
                    value={value}
                    checked={values.role === value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${values.role === value ? 'text-primary-600' : 'text-gray-400'}`} />
                  <span className={`block text-sm font-medium ${values.role === value ? 'text-primary-700' : 'text-gray-600'}`}>
                    {label}
                  </span>
                  {values.role === value && (
                    <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="الجنس"
              type="text"
              name="gender"
              value={values.gender}
              onChange={handleChange}
              placeholder="اختر"
              leftIcon={<User className="w-5 h-5 text-gray-400" />}
            >
              <select
                name="gender"
                value={values.gender}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white cursor-pointer"
              >
                <option value="">اختر الجنس</option>
                <option value="MALE">ذكر</option>
                <option value="FEMALE">أنثى</option>
              </select>
            </Input>

            <Input
              label="رقم الهاتف"
              type="tel"
              name="phone"
              value={values.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="07XXXXXXXX"
              autoComplete="tel"
              leftIcon={<User className="w-5 h-5 text-gray-400" />}
            />
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="terms"
              required
              className="mt-1 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="terms" className="text-sm text-gray-600">
              أوافق على <Link to="/terms" className="text-primary-600 hover:underline">الشروط والأحكام</Link> و
              <Link to="/privacy" className="text-primary-600 hover:underline">سياسة الخصوصية</Link>
            </label>
          </div>

          <Button type="submit" className="w-full" size="lg">
            إنشاء الحساب
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            لديك حساب بالفعل؟{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}