import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { useForm } from '../../hooks/useForm';
import { 
  Users, Search, Plus, Edit, Trash2, MoreVertical, 
  Loader2, Shield, GraduationCap, User, Mail, Phone
} from 'lucide-react';
import { formatDate, relativeTime, getRoleLabel, getRoleColor, cn } from '../../utils/helpers';

const roles = ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'];

export default function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  const { values, errors, handleChange, handleBlur, handleSubmit, resetForm, setFieldError, setValues } = useForm({
    initialValues: { fullName: '', email: '', password: '', role: 'STUDENT', gender: '', phone: '' },
    validate: (values) => {
      const errs = {};
      if (!values.fullName.trim()) errs.fullName = 'الاسم الكامل مطلوب';
      if (!values.email) errs.email = 'البريد الإلكتروني مطلوب';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errs.email = 'بريد إلكتروني غير صالح';
      if (!editingUser && !values.password) errs.password = 'كلمة المرور مطلوبة';
      else if (values.password && values.password.length < 8) errs.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
      return errs;
    },
    onSubmit: async (formValues) => {
      if (editingUser) {
        await handleUpdateUser(formValues);
      } else {
        await handleCreateUser(formValues);
      }
    }
  });

  useEffect(() => {
    loadUsers();
  }, [page, search, roleFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await userAPI.getAll(params);
      setUsers(res.data.users || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (formValues) => {
    try {
      setCreating(true);
      await userAPI.create(formValues);
      setShowCreateModal(false);
      resetForm();
      loadUsers();
    } catch (err) {
      if (err.response?.data?.details) {
        err.response.data.details.forEach(d => setFieldError(d.field, d.message));
      }
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateUser = async (formValues) => {
    try {
      setUpdating(true);
      const { password, ...data } = formValues;
      if (!password) delete data.password;
      await userAPI.update(editingUser.id, data);
      setShowEditModal(false);
      resetForm();
      loadUsers();
    } catch (err) {
      if (err.response?.data?.details) {
        err.response.data.details.forEach(d => setFieldError(d.field, d.message));
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    try {
      await userAPI.delete(id);
      loadUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setValues({
      fullName: u.fullName,
      email: u.email,
      password: '',
      role: u.role,
      gender: u.gender || '',
      phone: u.phone || ''
    });
    setShowEditModal(true);
  };

  const filteredUsers = users.filter(u => u.id !== user.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة المستخدمين</h1>
          <p className="text-gray-500 mt-1">إضافة وتعديل وحذف حسابات المستخدمين</p>
        </div>
        <Button onClick={() => { resetForm(); setEditingUser(null); setShowCreateModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          مستخدم جديد
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="البحث بالاسم أو البريد..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-w-[180px]"
            >
              <option value="">جميع الأدوار</option>
              {roles.map(r => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-20 p-4" />
            </Card>
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">لا يوجد مستخدمين</h3>
            <p className="text-gray-500 mb-4">
              {search || roleFilter ? 'جرب تغيير معايير البحث' : 'ابدأ بإضافة مستخدم جديد'}
            </p>
            {!search && !roleFilter && (
              <Button onClick={() => { resetForm(); setEditingUser(null); setShowCreateModal(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                إضافة أول مستخدم
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {filteredUsers.map((u) => (
              <Card key={u.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar name={u.fullName} src={u.avatar} size="md" />
                      <div>
                        <p className="font-medium text-gray-900">{u.fullName}</p>
                        <p className="text-sm text-gray-500">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="gray" size="sm" className={cn(getRoleColor(u.role))}>
                        {getRoleLabel(u.role)}
                      </Badge>
                      <span className="text-xs text-gray-400 hidden sm:block">{relativeTime(u.createdAt)}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditModal(u)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="تعديل">
                          <Edit className="w-5 h-5" />
                        </button>
                        {u.id !== user.id && (
                          <button onClick={() => handleDelete(u.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="حذف">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                السابق
              </Button>
              <span className="text-sm text-gray-600">صفحة {page} من {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                التالي
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create User Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="إضافة مستخدم جديد" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="الاسم الكامل"
            name="fullName"
            value={values.fullName}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.fullName}
            placeholder="أحمد محمد علي"
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
            leftIcon={<Mail className="w-5 h-5 text-gray-400" />}
          />
          {!editingUser && (
            <div className="relative">
              <Input
                label="كلمة المرور"
                type="password"
                name="password"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.password}
                placeholder="••••••••"
                leftIcon={<Shield className="w-5 h-5 text-gray-400" />}
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="الدور"
              name="role"
              value={values.role}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="اختر"
            >
              <select name="role" value={values.role} onChange={handleChange} onBlur={handleBlur} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white cursor-pointer">
                {roles.map(r => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
              </select>
            </Input>
            <Input
              label="الجنس"
              name="gender"
              value={values.gender}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="اختر"
            >
              <select name="gender" value={values.gender} onChange={handleChange} onBlur={handleBlur} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white cursor-pointer">
                <option value="">اختر الجنس</option>
                <option value="MALE">ذكر</option>
                <option value="FEMALE">أنثى</option>
              </select>
            </Input>
          </div>
          <Input
            label="رقم الهاتف"
            type="tel"
            name="phone"
            value={values.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="07XXXXXXXX"
            leftIcon={<Phone className="w-5 h-5 text-gray-400" />}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>إلغاء</Button>
            <Button type="submit" loading={creating}>{editingUser ? 'تحديث' : 'حفظ'}</Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditingUser(null); }} title="تعديل المستخدم" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="الاسم الكامل"
            name="fullName"
            value={values.fullName}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.fullName}
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
            leftIcon={<Mail className="w-5 h-5 text-gray-400" />}
          />
          <div className="relative">
            <Input
              label="كلمة المرور الجديدة (اتركها فارغة لعدم التغيير)"
              type="password"
              name="password"
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.password}
              placeholder="••••••••"
              leftIcon={<Shield className="w-5 h-5 text-gray-400" />}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="الدور"
              name="role"
              value={values.role}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="اختر"
            >
              <select name="role" value={values.role} onChange={handleChange} onBlur={handleBlur} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white cursor-pointer">
                {roles.map(r => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
              </select>
            </Input>
            <Input
              label="الجنس"
              name="gender"
              value={values.gender}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="اختر"
            >
              <select name="gender" value={values.gender} onChange={handleChange} onBlur={handleBlur} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white cursor-pointer">
                <option value="">اختر الجنس</option>
                <option value="MALE">ذكر</option>
                <option value="FEMALE">أنثى</option>
              </select>
            </Input>
          </div>
          <Input
            label="رقم الهاتف"
            type="tel"
            name="phone"
            value={values.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="07XXXXXXXX"
            leftIcon={<Phone className="w-5 h-5 text-gray-400" />}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => { setShowEditModal(false); setEditingUser(null); }}>إلغاء</Button>
            <Button type="submit" loading={updating}>حفظ التغييرات</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}