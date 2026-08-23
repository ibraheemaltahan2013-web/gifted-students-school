import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useForm } from '../../hooks/useForm';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const { values, errors, handleChange, handleBlur, handleSubmit, setFieldError } = useForm({
    initialValues: { email: '', password: '' },
    validate: (values) => {
      const errs = {};
      if (!values.email) errs.email = 'البريد الإلكتروني مطلوب';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errs.email = 'بريد إلكتروني غير صالح';
      if (!values.password) errs.password = 'كلمة المرور مطلوبة';
      return errs;
    },
    onSubmit: async (formValues) => {
      try {
        setError('');
        await login(formValues);
        navigate('/dashboard');
      } catch (err) {
        setError(err.response?.data?.error || 'فشل تسجيل الدخول');
        if (err.response?.data?.details) {
          err.response.data.details.forEach(d => setFieldError(d.field, d.message));
        }
      }
    }
  });

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
        <CardDescription>أدخل بياناتك للوصول إلى حسابك</CardDescription>
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
              autoComplete="current-password"
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

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              <span className="text-sm text-gray-600">تذكرني</span>
            </label>
            <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">
              نسيت كلمة المرور؟
            </Link>
          </div>

          <Button type="submit" className="w-full" size="lg">
            دخول
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            ليس لديك حساب؟{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              إنشاء حساب جديد
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}