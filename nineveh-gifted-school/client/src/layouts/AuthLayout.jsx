import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-2 border-primary-200 mb-4 overflow-hidden">
            <img src="/school-logo.jpg" alt="شعار مدرسة موهوبين نينوى" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">مدرسة موهوبين نينوى</h1>
          <p className="text-gray-500 mt-1">منصة التواصل التعليمي</p>
        </div>
        <div className="card">
          <div className="p-6">
            <Outlet />
          </div>
        </div>
        <p className="text-center text-sm text-gray-500 mt-4">
          جميع الحقوق محفوظة © 2026-2027 مدرسة موهوبين نينوى
        </p>
      </div>
    </div>
  );
}