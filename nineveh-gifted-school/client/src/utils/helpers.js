export function formatDate(date, options = {}) {
  const defaultOptions = { year: 'numeric', month: 'long', day: 'numeric', ...options };
  return new Date(date).toLocaleDateString('ar-SA', defaultOptions);
}

export function formatTime(date) {
  return new Date(date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(date) {
  return new Date(date).toLocaleString('ar-SA', { 
    year: 'numeric', month: 'short', day: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  });
}

export function relativeTime(date) {
  const now = new Date();
  const then = new Date(date);
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'الآن';
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  if (days < 7) return `منذ ${days} يوم`;
  return formatDate(date);
}

export function getInitials(name) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function getRoleLabel(role) {
  const labels = {
    ADMIN: 'مدير',
    TEACHER: 'مدرس',
    STUDENT: 'طالب',
    PARENT: 'ولي أمر'
  };
  return labels[role] || role;
}

export function getRoleColor(role) {
  const colors = {
    ADMIN: 'bg-purple-100 text-purple-800',
    TEACHER: 'bg-blue-100 text-blue-800',
    STUDENT: 'bg-green-100 text-green-800',
    PARENT: 'bg-orange-100 text-orange-800'
  };
  return colors[role] || 'bg-gray-100 text-gray-800';
}

export function getAttendanceStatusLabel(status) {
  const labels = {
    PRESENT: 'حاضر',
    ABSENT: 'غائب',
    LATE: 'متأخر',
    EXCUSED: 'معذور'
  };
  return labels[status] || status;
}

export function getAttendanceStatusColor(status) {
  const colors = {
    PRESENT: 'bg-green-100 text-green-800',
    ABSENT: 'bg-red-100 text-red-800',
    LATE: 'bg-yellow-100 text-yellow-800',
    EXCUSED: 'bg-blue-100 text-blue-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getAssignmentStatusLabel(status) {
  const labels = {
    PENDING: 'في الانتظار',
    SUBMITTED: 'مُسلم',
    GRADED: 'مُصحح',
    LATE: 'متأخر'
  };
  return labels[status] || status;
}

export function getAssignmentStatusColor(status) {
  const colors = {
    PENDING: 'bg-gray-100 text-gray-800',
    SUBMITTED: 'bg-blue-100 text-blue-800',
    GRADED: 'bg-green-100 text-green-800',
    LATE: 'bg-red-100 text-red-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function truncate(text, length = 100) {
  if (!text) return '';
  return text.length > length ? text.slice(0, length) + '...' : text;
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function generateAvatarColor(name) {
  const colors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
    'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}