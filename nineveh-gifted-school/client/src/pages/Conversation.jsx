import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { messageAPI } from '../services/api';
import Card, { CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import Input from '../components/ui/Input';
import { 
  ArrowLeft, Send, Paperclip, Smile, MoreVertical,
  Check, CheckCheck, Clock, Loader2, Image, FileText
} from 'lucide-react';
import { formatTime, getInitials, cn } from '../utils/helpers';

export default function Conversation() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    socket, 
    connected, 
    sendMessage, 
    markAsRead,
    joinConversation,
    leaveConversation,
    onNewMessage,
    onMessageRead,
    onTypingStart,
    onTypingStop
  } = useSocket();
  
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (!userId) return;
    joinConversation(userId);
    loadMessages();
    loadOtherUser();
    
    return () => {
      leaveConversation(userId);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [userId, joinConversation, leaveConversation]);

  useEffect(() => {
    const unsubNew = onNewMessage((message) => {
      if ((message.senderId === userId && message.receiverId === user?.id) ||
          (message.senderId === user?.id && message.receiverId === userId)) {
        setMessages(prev => [...prev, message]);
        markAsRead(userId);
      }
    });

    const unsubRead = onMessageRead(({ readerId }) => {
      if (readerId === userId) {
        setMessages(prev => prev.map(m => 
          m.senderId === userId && !m.read ? { ...m, read: true } : m
        ));
      }
    });

    const unsubTypingStart = onTypingStart(({ userId: typingUserId }) => {
      if (typingUserId === userId) setTyping(true);
    });

    const unsubTypingStop = onTypingStop(({ userId: typingUserId }) => {
      if (typingUserId === userId) setTyping(false);
    });

    return () => { unsubNew(); unsubRead(); unsubTypingStart(); unsubTypingStop(); };
  }, [userId, user?.id, onNewMessage, onMessageRead, onTypingStart, onTypingStop, markAsRead]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const res = await messageAPI.getMessages(userId);
      setMessages(res.data.messages || []);
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
    setTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    try {
      sendMessage(userId, content);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!typing) {
      socket?.emit('typing:start', { receiverId: userId });
      setTyping(true);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit('typing:stop', { receiverId: userId });
      setTyping(false);
    }, 1000);
  };

  const formatMessageTime = (date) => {
    return new Date(date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  };

  const isOwnMessage = (message) => message.senderId === user?.id;

  if (loading) {
    return (
      <div className="h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col bg-white">
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <button onClick={() => navigate('/messages')} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors lg:hidden">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Avatar name={otherUser?.fullName} src={otherUser?.avatar} size="md" status="online" />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{otherUser?.fullName || 'جاري التحميل...'}</h3>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            {connected ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                متصل الآن
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                غير متصل
              </>
            )}
          </p>
        </div>
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" role="log" aria-live="polite">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageSquare className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-center">لا توجد رسائل بعد</p>
            <p className="text-sm">ابدأ المحادثة بإرسال رسالة أدناه</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = isOwnMessage(message);
            const showTime = index === 0 || 
              new Date(message.createdAt).toDateString() !== new Date(messages[index - 1]?.createdAt).toDateString();
            
            return (
              <div key={message.id} className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[70%]', isOwn ? 'flex flex-col items-end' : 'flex flex-col items-start')}>
                  {!isOwn && (
                    <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-xs font-medium text-primary-700 mb-1">
                      {getInitials(otherUser?.fullName || '')}
                    </div>
                  )}
                  <div className={cn(
                    'relative rounded-2xl px-4 py-2',
                    isOwn 
                      ? 'bg-primary-600 text-white rounded-br-md' 
                      : 'bg-gray-100 text-gray-900 rounded-bl-md'
                  )}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <div className={cn('flex items-center gap-1 mt-1 text-xs', isOwn ? 'text-primary-100' : 'text-gray-400')}>
                      <span>{formatMessageTime(message.createdAt)}</span>
                      {isOwn && (
                        message.read ? (
                          <CheckCheck className="w-3.5 h-3.5" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
        {typing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-2">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce" style={{animationDelay: '0.1s'}}>.</span>
                <span className="animate-bounce" style={{animationDelay: '0.2s'}}>.</span>
                <span className="ml-1">يكتب...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-100 p-4">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              value={newMessage}
              onChange={handleTyping}
              placeholder="اكتب رسالة..."
              rows={1}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none max-h-32"
              style={{ minHeight: '44px' }}
            />
          </div>
          <Button 
            type="submit" 
            disabled={!newMessage.trim() || sending}
            className="p-2 rounded-xl"
            aria-label="إرسال الرسالة"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}