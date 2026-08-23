import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data)
};

export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getStats: () => api.get('/users/stats')
};

export const classAPI = {
  getAll: (params) => api.get('/classes', { params }),
  getMyClasses: () => api.get('/classes/my-classes'),
  getById: (id) => api.get(`/classes/${id}`),
  create: (data) => api.post('/classes', data),
  update: (id, data) => api.put(`/classes/${id}`, data),
  delete: (id) => api.delete(`/classes/${id}`),
  getStudents: (id) => api.get(`/classes/${id}/students`),
  assignStudent: (id, studentId) => api.post(`/classes/${id}/students`, { studentId }),
  removeStudent: (id, studentId) => api.delete(`/classes/${id}/students`, { data: { studentId } })
};

export const announcementAPI = {
  getAll: (params) => api.get('/announcements', { params }),
  getById: (id) => api.get(`/announcements/${id}`),
  create: (data) => api.post('/announcements', data),
  update: (id, data) => api.put(`/announcements/${id}`, data),
  delete: (id) => api.delete(`/announcements/${id}`)
};

export const assignmentAPI = {
  getAll: (params) => api.get('/assignments', { params }),
  getById: (id) => api.get(`/assignments/${id}`),
  create: (data) => api.post('/assignments', data),
  update: (id, data) => api.put(`/assignments/${id}`, data),
  delete: (id) => api.delete(`/assignments/${id}`),
  submit: (id, data) => api.post(`/assignments/${id}/submit`, data),
  getMySubmissions: () => api.get('/assignments/my-submissions'),
  grade: (id, data) => api.post(`/assignments/${id}/grade`, data)
};

export const messageAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (userId, params) => api.get(`/messages/${userId}`, { params }),
  send: (data) => api.post('/messages', data),
  markAsRead: (userId) => api.put(`/messages/${userId}/read`),
  getUnreadCount: () => api.get('/messages/unread-count'),
  getUsers: () => api.get('/messages/users')
};

export const attendanceAPI = {
  getAll: (params) => api.get('/attendance', { params }),
  getStats: (params) => api.get('/attendance/stats', { params }),
  getMy: () => api.get('/attendance/my'),
  record: (data) => api.post('/attendance', data),
  recordBulk: (data) => api.post('/attendance/bulk', data)
};

export const examAPI = {
  getAll: (params) => api.get('/exams', { params }),
  getById: (id) => api.get(`/exams/${id}`),
  create: (data) => api.post('/exams', data),
  update: (id, data) => api.put(`/exams/${id}`, data),
  delete: (id) => api.delete(`/exams/${id}`),
  recordGrade: (id, data) => api.post(`/exams/${id}/grades`, data)
};

export const scheduleAPI = {
  getAll: (params) => api.get('/schedules', { params }),
  getMy: () => api.get('/schedules/my'),
  getClass: (classId) => api.get(`/schedules/class/${classId}`),
  create: (data) => api.post('/schedules', data),
  update: (id, data) => api.put(`/schedules/${id}`, data),
  delete: (id) => api.delete(`/schedules/${id}`)
};

export default api;