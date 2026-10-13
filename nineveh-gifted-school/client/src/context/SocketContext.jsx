import { createContext, useContext, useCallback } from 'react';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const noop = useCallback(() => {}, []);
  const noopOff = useCallback(() => () => {}, []);

  const value = {
    socket: null,
    connected: false,
    joinConversation: noop,
    leaveConversation: noop,
    sendMessage: noop,
    markAsRead: noop,
    unreadCount: { announcements: 0, assignments: 0, messages: 0 },
    onNewMessage: noopOff,
    onMessageRead: noopOff,
    onTypingStart: noopOff,
    onTypingStop: noopOff,
    onNotification: noopOff
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
}
