import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { scheduleAPI, classAPI } from '../services/api';
import Card, { CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Plus, Trash2, Save, Loader2, Check, Coffee, BookOpen } from 'lucide-react';
import { cn } from '../utils/helpers';

const days = [
  { value: 0, label: 'الأحد' },
  { value: 1, label: 'الإثنين' },
  { value: 2, label: 'الثلاثاء' },
  { value: 3, label: 'الأربعاء' },
  { value: 4, label: 'الخميس' },
];

const defaultClasses = [
  { id: 'first-intermediate', name: 'الأول متوسط' },
  { id: 'second-intermediate', name: 'الثاني متوسط' },
  { id: 'third-intermediate', name: 'الثالث متوسط' },
  { id: 'fourth-prep', name: 'الرابع إعدادي' },
  { id: 'fifth-prep', name: 'الخامس إعدادي' },
  { id: 'sixth-prep', name: 'السادس إعدادي' },
];

const defaultEntry = () => ({
  id: Date.now().toString(),
  type: 'lesson',
  startTime: '08:00',
  endTime: '08:45',
  subject: '',
  room: '',
  isNew: true,
});

export default function Schedule() {
  const { user } = useAuth();
  const canEdit = ['TEACHER', 'ASSISTANT', 'MANAGER', 'ADMIN'].includes(user?.role);
  const isStudent = user?.role === 'STUDENT';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeDay, setActiveDay] = useState(0);
  const [selectedClass, setSelectedClass] = useState(isStudent ? (user?.classId || '') : '');

  const [weekSchedule, setWeekSchedule] = useState(() => {
    const schedule = {};
    days.forEach(d => { schedule[d.value] = []; });
    return schedule;
  });

  useEffect(() => { loadSchedules(); }, [selectedClass]);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedClass) params.classId = selectedClass;
      const res = await scheduleAPI.getAll(params);
      const list = res.data.schedules || [];
      const schedule = {};
      days.forEach(d => { schedule[d.value] = []; });

      list.forEach(s => {
        if (s.dayOfWeek >= 0 && s.dayOfWeek <= 4) {
          schedule[s.dayOfWeek].push({
            id: s.id,
            type: 'lesson',
            startTime: s.startTime,
            endTime: s.endTime,
            subject: s.subject || '',
            room: s.room || '',
            classId: s.classId,
            teacherId: s.teacherId,
            isNew: false,
          });
        }
      });

      days.forEach(d => {
        schedule[d.value].sort((a, b) => a.startTime.localeCompare(b.startTime));
      });

      setWeekSchedule(schedule);
    } catch (error) {
      console.error('Failed to load schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const addEntry = (type = 'lesson') => {
    const entries = weekSchedule[activeDay];
    const lastEntry = entries[entries.length - 1];
    const startTime = lastEntry ? lastEntry.endTime : '08:00';
    const defaultDuration = type === 'break' ? 15 : 45;
    const endTime = incrementTime(startTime, defaultDuration);

    setWeekSchedule(prev => ({
      ...prev,
      [activeDay]: [...prev[activeDay], { ...defaultEntry(), type, startTime, endTime }],
    }));
  };

  const updateEntry = (entryId, field, value) => {
    setWeekSchedule(prev => ({
      ...prev,
      [activeDay]: prev[activeDay].map(e =>
        e.id === entryId ? { ...e, [field]: value } : e
      ),
    }));
  };

  const removeEntry = (entryId) => {
    setWeekSchedule(prev => ({
      ...prev,
      [activeDay]: prev[activeDay].filter(e => e.id !== entryId),
    }));
  };

  const incrementTime = (time, minutes) => {
    if (!time || !time.includes(':')) return '00:00';
    const [h, m] = time.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return '00:00';
    const total = h * 60 + m + minutes;
    const hours = Math.floor(total / 60) % 24;
    const mins = total % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaved(false);

      for (const day of days) {
        const entries = weekSchedule[day.value];

        for (const entry of entries) {
          if (entry.type === 'lesson' && entry.subject.trim()) {
            if (entry.isNew) {
              await scheduleAPI.create({
                classId: entry.classId || selectedClass || 'first-intermediate',
                teacherId: entry.teacherId || user.id,
                subject: entry.subject.trim(),
                room: entry.room.trim() || null,
                dayOfWeek: day.value,
                startTime: entry.startTime,
                endTime: entry.endTime,
              });
            } else {
              await scheduleAPI.update(entry.id, {
                subject: entry.subject.trim(),
                room: entry.room.trim() || null,
                startTime: entry.startTime,
                endTime: entry.endTime,
              });
            }
          } else if (entry.type === 'lesson' && !entry.subject.trim() && !entry.isNew) {
            await scheduleAPI.delete(entry.id);
          }
        }
      }

      await loadSchedules();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save schedule:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const currentEntries = weekSchedule[activeDay];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الجدول الدراسي</h1>
          <p className="text-gray-500 mt-1">أضف الحصص والاستراحات بحرية</p>
        </div>
        {canEdit && (
          <Button onClick={handleSave} loading={saving} variant={saved ? 'success' : 'primary'}>
            {saved ? <Check className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {saved ? 'تم الحفظ' : 'حفظ الجدول'}
          </Button>
        )}
      </div>

      {/* Class Selector */}
      {!isStudent && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedClass('')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              selectedClass === ''
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            الكل
          </button>
          {defaultClasses.map(cls => (
            <button
              key={cls.id}
              onClick={() => setSelectedClass(cls.id)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                selectedClass === cls.id
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {cls.name}
            </button>
          ))}
        </div>
      )}

      {/* Day Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {days.map(d => (
          <button
            key={d.value}
            onClick={() => setActiveDay(d.value)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
              activeDay === d.value
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {d.label}
            {weekSchedule[d.value].length > 0 && (
              <span className={cn(
                'mr-2 px-1.5 py-0.5 text-xs rounded-full',
                activeDay === d.value ? 'bg-primary-500' : 'bg-gray-300 text-gray-600'
              )}>
                {weekSchedule[d.value].filter(e => e.type === 'lesson').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Schedule Entries */}
      <Card>
        <CardContent className="p-4">
          {currentEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>لا توجد حصص لهذا اليوم</p>
              <p className="text-sm mt-1">اضغط على الأزرار أدناه لإضافة حصة أو استراحة</p>
            </div>
          ) : (
            <div className="space-y-2">
              {currentEntries.map((entry, idx) => (
                <div
                  key={entry.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border-2 transition-all',
                    entry.type === 'break'
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-white border-gray-200 hover:border-primary-300'
                  )}
                >
                  {/* Number */}
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0',
                    entry.type === 'break' ? 'bg-amber-200 text-amber-700' : 'bg-primary-100 text-primary-700'
                  )}>
                    {idx + 1}
                  </div>

                  {/* Type Icon */}
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    entry.type === 'break' ? 'bg-amber-100' : 'bg-primary-100'
                  )}>
                    {entry.type === 'break'
                      ? <Coffee className="w-5 h-5 text-amber-600" />
                      : <BookOpen className="w-5 h-5 text-primary-600" />
                    }
                  </div>

                  {/* Time Inputs */}
                  {canEdit ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="text"
                        value={entry.startTime}
                        onChange={(e) => updateEntry(entry.id, 'startTime', e.target.value)}
                        placeholder="08:00"
                        className="w-20 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-400 bg-white text-center"
                      />
                      <span className="text-gray-400">-</span>
                      <input
                        type="text"
                        value={entry.endTime}
                        onChange={(e) => updateEntry(entry.id, 'endTime', e.target.value)}
                        placeholder="08:45"
                        className="w-20 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-400 bg-white text-center"
                      />
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-gray-700 shrink-0">
                      {entry.startTime} - {entry.endTime}
                    </span>
                  )}

                  {/* Duration Input */}
                  {canEdit ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="number"
                        min="5"
                        max="120"
                        value={calcDuration(entry.startTime, entry.endTime)}
                        onChange={(e) => {
                          const mins = parseInt(e.target.value) || 45;
                          const newEnd = incrementTime(entry.startTime, mins);
                          updateEntry(entry.id, 'endTime', newEnd);
                        }}
                        className="w-14 px-2 py-1.5 text-sm text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-400 bg-white"
                      />
                      <span className="text-xs text-gray-500">د</span>
                    </div>
                  ) : (
                    <span className={cn(
                      'text-xs px-2 py-1 rounded-full shrink-0',
                      entry.type === 'break' ? 'bg-amber-200 text-amber-700' : 'bg-gray-100 text-gray-600'
                    )}>
                      {calcDuration(entry.startTime, entry.endTime)} د
                    </span>
                  )}

                  {/* Subject Input */}
                  {canEdit ? (
                    <input
                      type="text"
                      value={entry.subject}
                      onChange={(e) => updateEntry(entry.id, 'subject', e.target.value)}
                      placeholder={entry.type === 'break' ? 'استراحة' : 'اسم المادة'}
                      className={cn(
                        'flex-1 px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-400',
                        entry.type === 'break'
                          ? 'bg-amber-50 border-amber-200 text-amber-700 placeholder-amber-400'
                          : 'bg-white border-gray-200'
                      )}
                    />
                  ) : (
                    <span className="flex-1 text-sm font-medium text-gray-900">
                      {entry.subject || (entry.type === 'break' ? 'استراحة' : '-')}
                    </span>
                  )}

                  {/* Room Input */}
                  {canEdit && entry.type === 'lesson' && (
                    <input
                      type="text"
                      value={entry.room}
                      onChange={(e) => updateEntry(entry.id, 'room', e.target.value)}
                      placeholder="القاعة"
                      className="w-24 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-400 bg-white"
                    />
                  )}

                  {/* Delete Button */}
                  {canEdit && (
                    <button
                      onClick={() => removeEntry(entry.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add Buttons */}
          {canEdit && (
            <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
              <Button variant="secondary" onClick={() => addEntry('lesson')} className="flex-1">
                <Plus className="w-4 h-4 mr-2" />
                إضافة حصة
              </Button>
              <Button variant="secondary" onClick={() => addEntry('break')} className="flex-1">
                <Coffee className="w-4 h-4 mr-2" />
                إضافة استراحة
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function calcDuration(start, end) {
  if (!start || !end || !start.includes(':') || !end.includes(':')) return 0;
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 0;
  return (h2 * 60 + m2) - (h1 * 60 + m1);
}
