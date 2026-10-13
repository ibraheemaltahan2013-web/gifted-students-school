import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { examAPI } from '../services/api';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Plus, Trash2, Save, Loader2, Check, Award, Minus } from 'lucide-react';
import { cn } from '../utils/helpers';

const semesters = [
  {
    id: 'first',
    label: 'النصف الأول',
    types: [
      { id: 'first-month1', label: 'الشهر الأول' },
      { id: 'first-month2', label: 'الشهر الثاني' },
      { id: 'mid-year', label: 'نصف السنة' },
    ]
  },
  {
    id: 'second',
    label: 'النصف الثاني',
    types: [
      { id: 'second-month1', label: 'الشهر الأول' },
      { id: 'second-month2', label: 'الشهر الثاني' },
      { id: 'end-year', label: 'نهاية السنة' },
    ]
  }
];

const defaultClasses = [
  { id: 'first-intermediate', name: 'الأول متوسط' },
  { id: 'second-intermediate', name: 'الثاني متوسط' },
  { id: 'third-intermediate', name: 'الثالث متوسط' },
  { id: 'fourth-prep', name: 'الرابع إعدادي' },
  { id: 'fifth-prep', name: 'الخامس إعدادي' },
  { id: 'sixth-prep', name: 'السادس إعدادي' },
];

const getClassById = (id) => defaultClasses.find(c => c.id === id) || { id, name: id };

const emptyExam = () => ({ subject: '', date: '', time: '', examId: '' });

export default function Exams() {
  const { user } = useAuth();
  const canEdit = ['TEACHER', 'ASSISTANT', 'MANAGER', 'ADMIN'].includes(user?.role);
  const isStudent = user?.role === 'STUDENT';
  const isParent = user?.role === 'PARENT';
  const isTeacher = user?.role === 'TEACHER';
  const studentClassId = user?.classId;
  const visibleClasses = (isStudent || isTeacher) && studentClassId
    ? defaultClasses.filter(c => c.id === studentClassId)
    : isParent && user?.childrenClassIds?.length
    ? defaultClasses.filter(c => user.childrenClassIds.includes(c.id))
    : defaultClasses;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSemester, setActiveSemester] = useState('first');

  const [grid, setGrid] = useState(() => {
    const g = {};
    semesters.forEach(sem => {
      g[sem.id] = {};
      sem.types.forEach(t => {
        g[sem.id][t.id] = {};
        defaultClasses.forEach(cls => {
          g[sem.id][t.id][cls.id] = [emptyExam()];
        });
      });
    });
    return g;
  });

  useEffect(() => { loadExams(); }, [studentClassId]);

  const loadExams = async () => {
    try {
      setLoading(true);
      const res = await examAPI.getAll({});
      const list = res.data.exams || [];

      const g = {};
      semesters.forEach(sem => {
        g[sem.id] = {};
        sem.types.forEach(t => {
          g[sem.id][t.id] = {};
          defaultClasses.forEach(cls => {
            g[sem.id][t.id][cls.id] = [emptyExam()];
          });
        });
      });

      list.forEach(exam => {
        const semId = exam.semester;
        const typeId = exam.examType;
        const classId = exam.classId;
        if (semId && typeId && classId && g[semId]?.[typeId]?.[classId]) {
          const existing = g[semId][typeId][classId];
          const idx = existing.findIndex(e => !e.subject);
          const newExam = {
            subject: exam.subject || '',
            date: exam.examDate ? exam.examDate.split('T')[0] : '',
            time: exam.time || '',
            examId: exam.id,
          };
          if (idx >= 0) {
            existing[idx] = newExam;
          } else {
            existing.push(newExam);
          }
        }
      });

      setGrid(g);
    } catch (error) {
      console.error('Failed to load exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateExam = (semId, typeId, classId, examIdx, field, value) => {
    setGrid(prev => {
      const exams = [...prev[semId][typeId][classId]];
      exams[examIdx] = { ...exams[examIdx], [field]: value };
      return { ...prev, [semId]: { ...prev[semId], [typeId]: { ...prev[semId][typeId], [classId]: exams } } };
    });
  };

  const addExam = (semId, typeId, classId) => {
    setGrid(prev => {
      const exams = [...prev[semId][typeId][classId], emptyExam()];
      return { ...prev, [semId]: { ...prev[semId], [typeId]: { ...prev[semId][typeId], [classId]: exams } } };
    });
  };

  const removeExam = (semId, typeId, classId, examIdx) => {
    setGrid(prev => {
      const exams = prev[semId][typeId][classId].filter((_, i) => i !== examIdx);
      if (exams.length === 0) exams.push(emptyExam());
      return { ...prev, [semId]: { ...prev[semId], [typeId]: { ...prev[semId][typeId], [classId]: exams } } };
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaved(false);

      const sem = semesters.find(s => s.id === activeSemester);
      let savedCount = 0;

      for (const type of sem.types) {
        for (const cls of defaultClasses) {
          const exams = grid[sem.id][type.id][cls.id];

          for (let i = 0; i < exams.length; i++) {
            const exam = exams[i];
            try {
              if (exam.subject && exam.subject.trim()) {
                const data = {
                  classId: cls.id,
                  subject: exam.subject.trim(),
                  title: `${type.label} - ${exam.subject.trim()}`,
                  examDate: exam.date || null,
                  duration: 60,
                  maxScore: 100,
                  semester: sem.id,
                  examType: type.id,
                  time: exam.time || null,
                };

                if (exam.examId) {
                  await examAPI.update(exam.examId, data);
                  savedCount++;
                } else {
                  const res = await examAPI.create(data);
                  savedCount++;
                }
              } else if (exam.examId) {
                await examAPI.delete(exam.examId);
                savedCount++;
              }
            } catch (err) {
              console.error('Error saving exam:', cls.name, type.label, err.message);
            }
          }
        }
      }

      await loadExams();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save exams:', error);
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

  const currentSemester = semesters.find(s => s.id === activeSemester);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الامتحانات</h1>
          <p className="text-gray-500 mt-1">جدول امتحانات الفصلين الدراسيين</p>
        </div>
        {canEdit && (
          <Button onClick={handleSave} loading={saving} variant={saved ? 'success' : 'primary'}>
            {saved ? <Check className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {saved ? 'تم الحفظ' : 'حفظ'}
          </Button>
        )}
      </div>

      {/* Semester Tabs */}
      <div className="flex gap-2">
        {semesters.map(sem => (
          <button
            key={sem.id}
            onClick={() => setActiveSemester(sem.id)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeSemester === sem.id
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {sem.label}
          </button>
        ))}
      </div>

      {/* Exam Tables */}
      {currentSemester.types.map(type => (
        <Card key={type.id}>
          <CardHeader className="bg-gray-50">
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-red-600" />
              {type.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  {visibleClasses.map(cls => (
                    <th key={cls.id} className="px-3 py-3 text-center text-sm font-bold text-gray-700 bg-blue-50 border-l border-gray-200">
                      {cls.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {visibleClasses.map(cls => {
                    const exams = grid[activeSemester]?.[type.id]?.[cls.id] || [emptyExam()];
                    return (
                      <td key={cls.id} className="p-2 border-l border-b border-gray-200 align-top">
                        <div className="space-y-2">
                          {exams.map((exam, idx) => (
                            <div key={idx} className="bg-white rounded-lg border border-gray-200 p-2 space-y-1.5">
                              <input
                                type="text"
                                value={exam.subject}
                                onChange={(e) => updateExam(activeSemester, type.id, cls.id, idx, 'subject', e.target.value)}
                                placeholder="المادة"
                                className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-400"
                              />
                              <div className="flex gap-1">
                                <input
                                  type="date"
                                  value={exam.date}
                                  onChange={(e) => updateExam(activeSemester, type.id, cls.id, idx, 'date', e.target.value)}
                                  className="flex-1 px-1 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-400"
                                />
                                <input
                                  type="text"
                                  value={exam.time}
                                  onChange={(e) => updateExam(activeSemester, type.id, cls.id, idx, 'time', e.target.value)}
                                  placeholder="الوقت"
                                  className="w-14 px-1 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-400 text-center"
                                />
                              </div>
                              {canEdit && exams.length > 1 && (
                                <button
                                  onClick={() => removeExam(activeSemester, type.id, cls.id, idx)}
                                  className="w-full text-xs text-red-500 hover:text-red-700 py-0.5"
                                >
                                  <Minus className="w-3 h-3 inline" />
                                </button>
                              )}
                            </div>
                          ))}
                          {canEdit && (
                            <button
                              onClick={() => addExam(activeSemester, type.id, cls.id)}
                              className="w-full text-xs text-primary-600 hover:text-primary-800 py-1 border border-dashed border-primary-300 rounded-lg hover:bg-primary-50 transition-colors"
                            >
                              <Plus className="w-3 h-3 inline mr-1" />
                              امتحان
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
