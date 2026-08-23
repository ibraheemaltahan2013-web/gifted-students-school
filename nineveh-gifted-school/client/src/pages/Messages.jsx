import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { messageAPI } from '../../services/api';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { useForm } from '../../hooks/useForm';
import { 
  MessageSquare, Search, Plus, X, Loader2, 
  Bell, UserPlus, ChevronRight, Check, Clock
} from 'lucide-react';
import { formatDate, relativeTime, getInitials, cn } from '../../utils/helpers';

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { conversations, unreadCount, onNewMessage, onMessageRead, joinConversation, leaveConversation } = useSocket();
  const [localConversations, setLocalConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');

  useEffect(() => {
    loadConversations();
    loadAvailableUsers();
  }, []);

  useEffect(() => {
    const unsubNew = onNewMessage((message) => {
      setLocalConversations(prev => {
        const existing = prev.find(c => c.user.id === message.senderId || c.user.id === message.receiverId);
        const otherId = message.senderId === user.id ? message.receiverId : message.senderId;
        const otherUser = message.senderId === user.id ? message.receiver : message.sender;
        
        if (existing) {
          return prev.map(c => 
            c.user.id === otherId 
              ? { ...c, lastMessage: message, unreadCount: c.user.id === message.senderId ? c.unreadCount + 1 : c.unreadCount }
              : c
          );
        } else {
          return [{
            user: otherUser,
            lastMessage: message,
            unreadCount: 1
          }, ...prev];
        }
      });
    });

    const unsubRead = onMessageRead(({ readerId }) => {
      setLocalConversations(prev => prev.map(c => 
        c.user.id === readerId ? { ...c, unreadCount: 0 } : c
      ));
    });

    return () => { unsubNew(); unsubRead(); };
  }, [onNewMessage, onMessageRead, user.id]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const res = await messageAPI.getConversations();
      setLocalConversations(res.data.conversations || []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const res = await messageAPI.getUsers();
      setAvailableUsers(res.data.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleStartChat = (userId) => {
    if (userId) {
      setShowNewChatModal(false);
      setSelectedUserId('');
      navigate(`/messages/${userId}`);
    }
  };

  const filteredConversations = localConversations.filter(c => 
    c.user.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const sortedConversations = [...filteredConversations].sort((a, b) => 
    new Date(b.lastMessage?.createdAt) - new Date(a.lastMessage?.createdAt)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الرسائل</h1>
          <p className="text-gray-500 mt-1">محادثاتك مع الطلاب والمدرسين</p>
        </div>
        <Button onClick={() => { loadAvailableUsers(); setShowNewChatModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          محادثة جديدة
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="البحث في المحادثات..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Conversations List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-16 p-4" />
            </Card>
          ))}
        </div>
      ) : sortedConversations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">لا توجد محادثات</h3>
            <p className="text-gray-500 mb-4">ابدأ محادثة جديدة مع زملائك أو مدرسيك</p>
            <Button onClick={() => { loadAvailableUsers(); setShowNewChatModal(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              بدء محادثة جديدة
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sortedConversations.map((conv) => (
            <Link key={conv.user.id} to={`/messages/${conv.user.id}`} className="block">
              <Card className="hover:shadow-md transition-shadow p-4">
                <div className="flex items-center gap-4">
                  <Avatar name={conv.user.fullName} src={conv.user.avatar} size="lg" status="online" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 truncate">{conv.user.fullName}</h4>
                      <span className="text-xs text-gray-400 shrink-0">
                        {conv.lastMessage ? relativeTime(conv.lastMessage.createdAt) : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-500 truncate flex-1">
                        {conv.lastMessage?.content || 'لا توجد رسائل بعد'}
                      </p>
                      {conv.unreadCount > 0 && (
                        <Badge variant="danger" size="xs">{conv.unreadCount}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      <Badge variant="gray" size="xs" className={cn('bg-' + (conv.user.role === 'TEACHER' ? 'blue' : conv.user.role === 'STUDENT' ? 'green' : 'orange') + '-100 text-' + (conv.user.role === 'TEACHER' ? 'blue' : conv.user.role === 'STUDENT' ? 'green' : 'orange') + '-800')}>
                        {conv.user.role === 'TEACHER' ? 'مدرس' : conv.user.role === 'STUDENT' ? 'طالب' : 'ولي أمر'}
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* New Chat Modal */}
      <Modal isOpen={showNewChatModal} onClose={() => setShowNewChatModal(false)} title="محادثة جديدة">
        <div className="space-y-4">
          <Input
            label="البحث عن مستخدم"
            type="text"
            placeholder="اكتب الاسم للبحث..."
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="max-h-64 overflow-y-auto space-y-2">
            {availableUsers.filter(u => u.id !== user.id).map((u) => (
              <button
                key={u.id}
                onClick={() => handleStartChat(u.id)}
                className="w-full flex items-center gap-3 p-3 text-right hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-200"
              >
                <Avatar name={u.fullName} src={u.avatar} size="sm" />
                <div className="flex-1 text-right">
                  <p className="font-medium text-gray-900">{u.fullName}</p>
                  <p className="text-xs text-gray-500">{u.role === 'TEACHER' ? 'مدرس' : u.role === 'STUDENT' ? 'طالب' : 'ولي أمر'}</p>
                </div>
                <Check className="w-5 h-5 text-primary-600" />
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}