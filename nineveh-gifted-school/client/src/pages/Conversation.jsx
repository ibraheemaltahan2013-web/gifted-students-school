import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { messageAPI } from '../services/api';
import Card, { CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { cn } from '../utils/helpers';

export default function Conversation() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const [newMessage, setNewMessage] = useState('');
  const pollRef = useRef(null);

  useEffect(() => {
    if (!userId) return;
    loadMessages();
    loadOtherUser();
    messageAPI.markAsRead(userId).catch(() => {});

    pollRef.current = setInterval(() => {
      loadMessages(true);
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await messageAPI.getMessages(userId);
      setMessages(res.data.messages || []);
      messageAPI.markAsRead(userId).catch(() => {});
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOtherUser = async () => {
    try {
      const res = await messageAPI.getUsers();
      const found = res.data.users?.find(u => u.id === userId);
      setOtherUser(found);
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const res = await messageAPI.send({ receiverId: userId, content });
      if (res.data.message) {
        setMessages(prev => [...prev, res.data.message]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-white">
          <Button variant="ghost" size="sm" onClick={() => navigate('/messages')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Avatar name={otherUser?.fullName} size="md" />
          <div>
            <h2 className="font-bold text-gray-900">{otherUser?.fullName || '...'}</h2>
            <p className="text-sm text-gray-500">{otherUser?.role === 'TEACHER' ? 'مدرس' : otherUser?.role === 'STUDENT' ? 'طالب' : otherUser?.role}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>لا توجد رسائل بعد</p>
              <p className="text-sm mt-1">ابدأ المحادثة الآن</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === user?.id;
              return (
                <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                  <div className={cn(
                    'max-w-[75%] px-4 py-2 rounded-2xl',
                    isMine
                      ? 'bg-primary-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                  )}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className={cn(
                      'text-xs mt-1',
                      isMine ? 'text-primary-100' : 'text-gray-400'
                    )}>
                      {formatTime(msg.createdAt)}
                      {isMine && msg.read && <span className="mr-1">✓✓</span>}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="اكتب رسالة..."
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={sending}
            />
            <Button type="submit" disabled={!newMessage.trim() || sending} className="rounded-full px-4">
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
