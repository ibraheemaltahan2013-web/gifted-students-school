import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { messageAPI } from '../services/api';
import Card, { CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import { MessageSquare, Search, Loader2 } from 'lucide-react';
import { getRoleLabel, getRoleColor } from '../utils/helpers';

const STUDENT_ROLES = ['STUDENT', 'PARENT'];
const STAFF_ROLES = ['TEACHER', 'ASSISTANT', 'MANAGER', 'ADMIN'];

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await messageAPI.getUsers();
      const allUsers = (res.data.users || []).filter(u => u.id !== user.id);
      if (STUDENT_ROLES.includes(user.role)) {
        setUsers(allUsers.filter(u => STAFF_ROLES.includes(u.role)));
      } else {
        setUsers(allUsers);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">الرسائل</h1>
        <p className="text-gray-500 mt-1">اختر شخصاً لبدء محادثة خاصة</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="البحث عن شخص..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-16 p-4" />
            </Card>
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {search ? 'لا توجد نتائج' : 'لا يوجد أشخاص متاحين'}
            </h3>
            <p className="text-gray-500">
              {search ? 'جرّب كلمات بحث أخرى' : 'لم يتم العثور على أشخاص للتواصل معهم'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredUsers.map((u) => (
            <button
              key={u.id}
              onClick={() => navigate(`/messages/${u.id}`)}
              className="w-full text-right"
            >
              <Card className="hover:shadow-md transition-shadow p-4">
                <div className="flex items-center gap-4">
                  <Avatar name={u.fullName} src={u.avatar} size="lg" status="online" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{u.fullName}</h4>
                    <Badge variant="gray" size="xs" className={`mt-1 ${getRoleColor(u.role)}`}>
                      {getRoleLabel(u.role)}
                    </Badge>
                  </div>
                  <MessageSquare className="w-5 h-5 text-gray-300" />
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
