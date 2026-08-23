import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    const newSocket = io(SOCKET_URL || '/', {
      auth: { token: document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] },
      autoConnect: true,
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => setConnected(true));
    newSocket.on('disconnect', () => setConnected(false));
    newSocket.on('connect_error', (err) => console.error('Socket error:', err));

    setSocket(newSocket);
    return () => newSocket.close();
  }, [user]);

  const joinConversation = useCallback((otherUserId) => {
    socket?.emit('join:conversation', otherUserId);
  }, [socket]);

  const leaveConversation = useCallback((otherUserId) => {
    socket?.emit('leave:conversation', otherUserId);
  }, [socket]);

  const sendMessage = useCallback((receiverId, content) => {
    socket?.emit('message:send', { receiverId, content });
  }, [socket]);

  const markAsRead = useCallback((senderId) => {
    socket?.emit('message:read', { senderId });
  }, [socket]);

  const onNewMessage = useCallback((callback) => {
    socket?.on('message:new', callback);
    return () => socket?.off('message:new', callback);
  }, [socket]);

  const onMessageRead = useCallback((callback) => {
    socket?.on('message:read', callback);
    return () => socket?.off('message:read', callback);
  }, [socket]);

  const onTypingStart = useCallback((callback) => {
    socket?.on('typing:start', callback);
    return () => socket?.off('typing:start', callback);
  }, [socket]);

  const onTypingStop = useCallback((callback) => {
    socket?.on('typing:stop', callback);
    return () => socket?.off('typing:stop', callback);
  }, [socket]);

  const onNotification = useCallback((callback) => {
    socket?.on('notification:new', callback);
    return () => socket?.off('notification:new', callback);
  }, [socket]);

  const value = {
    socket,
    connected,
    joinConversation,
    leaveConversation,
    sendMessage,
    markAsRead,
    onNewMessage,
    onMessageRead,
    onTypingStart,
    onTypingStop,
    onNotification
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
}