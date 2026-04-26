import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Users, UserPlus, BookOpen, BarChart3, Shield, Star, Trophy } from 'lucide-react';
import StudentRegistration from './StudentRegistration';
import StudentList from './StudentList';
import GradeManagement from './GradeManagement';
import AdminPanel from './AdminPanel';
import AssignSubject from './AssignSubject';
import RemoveSubject from './RemoveSubject';
import StudentTransfer from './StudentTransfer';
import PrioritySubjects from './PrioritySubjects';
import { PlusCircle, Trash2, MoveRight } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import EditStudentForm from '../components/EditStudentForm';
import { calculateRanking } from '../utils/rankingUtils';
import { calculateAverage, calculateFinalGrade } from '../utils/gradeCalculations';

const TeacherDashboard = () => {
    const { user, networkError, deleteStudent, updateStudent } = useAuth();
    const [students, setStudents] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [editingStudent, setEditingStudent] = useState(null);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);
    const [publishing, setPublishing] = useState(false);
    const [resultsPublished, setResultsPublished] = useState(false);
    const [rankedStudents, setRankedStudents] = useState([]);

    const fetchStudents = async () => {
        setLoadingStudents(true);
        try {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('teacher_id', user.id);

            if (error) throw error;
            setStudents(data);
        } catch (err) {
            setError(err.message || 'Error al cargar los estudiantes.');
        } finally {
            setLoadingStudents(false);
        }
    };

    const fetchTeacherInfo = async () => {
        const { data } = await supabase
            .from('teachers')
            .select('results_published, priority_subjects')
            .eq('id', user.id)
            .single();

        if (data) {
            setResultsPublished(data.results_published || false);
        }
    };

    const fetchTeachers = async () => {
        try {
            const { data, error } = await supabase.from('teachers').select('*');
            if (error) throw error;
            setTeachers(data);
        } catch (err) {
            console.error('Error fetching teachers:', err);
        }
    };

    // Calcular ranking de estudiantes con sus materias y notas
    const calculateAndSaveRanking = async () => {
        try {
            const { data: teacherData } = await supabase
                .from('teachers')
                .select('priority_subjects')
                .eq('id', user.id)
                .single();

            const prioritySubjects = teacherData?.priority_subjects || [];

            // Traer estudiantes con sus materias y notas
            const studentsWithSubjects = await Promise.all(
                students.map(async (student) => {
                    const { data: subjectsData } = await supabase
                        .from('subjects')
                        .select(`id, name, grades(year, period, type, grade_index, value)`)
                        .eq('student_id', student.id);

                    const subjects = (subjectsData || []).map(subject => {
                        const years = {};
                        subject.grades.forEach(grade => {
                            if (!years[grade.year]) years[grade.year] = {};
                            if (!years[grade.year][grade.period]) {
                                years[grade.year][grade.period] = {
                                    tasks: ['', '', '', ''],
                                    exams: ['', '', ''],
                                    presentations: ['', '', '']
                                };
                            }
                            years[grade.year][grade.period][grade.type][grade.grade_index] = grade.value;
                        });
                        return { ...subject, years };
                    });

                    return { ...student, subjects };
                })
            );

            const ranked = calculateRanking(studentsWithSubjects, prioritySubjects);
            setRankedStudents(ranked);

            // Guardar ranking en Supabase
            await Promise.all(
                ranked.map(student =>
                    supabase
                        .from('students')
                        .update({ ranking: student.ranking })
                        .eq('id', student.id)
                )
            );

            return ranked;
        } catch (err) {
            console.error('Error calculando ranking:', err);
            return [];
        }
    };

    const handlePublishResults = async () => {
        setPublishing(true);
        try {
            await calculateAndSaveRanking();

            const { error } = await supabase
                .from('teachers')
                .update({ results_published: true })
                .eq('id', user.id);

            if (!error) {
                setResultsPublished(true);
                setSuccess('¡Resultados publicados! Los estudiantes ya pueden ver sus notas y puestos.');
                setTimeout(() => setSuccess(null), 5000);
            }
        } catch (err) {
            setError('Error al publicar resultados.');
        } finally {
            setPublishing(false);
        }
    };

    const handleUnpublishResults = async () => {
        const { error } = await supabase
            .from('teachers')
            .update({ results_published: false })
            .eq('id', user.id);

        if (!error) {
            setResultsPublished(false);
            setSuccess('Resultados ocultados.');
            setTimeout(() => setSuccess(null), 3000);
        }
    };

    const handleStudentDeleted = async (studentId) => {
        try {
            await deleteStudent(studentId);
            setSuccess('Estudiante eliminado con éxito.');
            fetchStudents();
            setTimeout(() => setSuccess(null), 5000);
        } catch (err) {
            setError(err.message || 'Error al eliminar estudiante.');
        }
    };

    const handleStudentUpdated = async (studentId, updatedData) => {
        try {
            await updateStudent(studentId, updatedData);
            setSuccess('Estudiante actualizado con éxito.');
            setEditingStudent(null);
            fetchStudents();
            setTimeout(() => setSuccess(null), 5000);
        } catch (err) {
            setError(err.message || 'Error al actualizar estudiante.');
        }
    };

    useEffect(() => {
        if (user?.id) {
            if (user.role === 'teacher') {
                fetchStudents();
                fetchTeacherInfo();
            } else if (user.role === 'admin') {
                fetchTeachers();
            }
        }
    }, [user]);

    const tabs = [
        { id: 'overview', label: 'Resumen', icon: BarChart3, roles: ['teacher'] },
        { id: 'students', label: 'Estudiantes', icon: Users, roles: ['teacher'] },
        { id: 'register', label: 'Registrar', icon: UserPlus, roles: ['teacher'] },
        { id: 'grades', label: 'Calificaciones', icon: BookOpen, roles: ['teacher'] },
        { id: 'assign-subject', label: 'Asignar Materia', icon: PlusCircle, roles: ['teacher'] },
        { id: 'remove-subject', label: 'Eliminar Materia', icon: Trash2, roles: ['teacher'] },
        { id: 'transfer-student', label: 'Transferir', icon: MoveRight, roles: ['teacher'] },
        { id: 'priority', label: 'Prioridades', icon: Star, roles: ['teacher'] },
        { id: 'admin', label: 'Admin', icon: Shield, roles: ['admin'] },
    ];

    const renderTabContent = () => {
        if (loadingStudents && user.role === 'teacher') {
            return (
                <div className="flex justify-center items-center h-64">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            );
        }
        switch (activeTab) {
            case 'overview':
                return (
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-6 shadow-lg">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 rounded-xl">
                                    <Users className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">{students.length}</h3>
                                    <p className="text-gray-600">Estudiantes Registrados</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-6 shadow-lg">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-100 rounded-xl">
                                    <BookOpen className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">N/A</h3>
                                    <p className="text-gray-600">Materia Principal</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-6 shadow-lg">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${resultsPublished ? 'bg-green-100' : 'bg-gray-100'}`}>
                                    <Trophy className={`w-6 h-6 ${resultsPublished ? 'text-green-600' : 'text-gray-400'}`} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        {resultsPublished ? 'Publicado' : 'No publicado'}
                                    </h3>
                                    <p className="text-gray-600">Estado del Ranking</p>
                                </div>
                            </div>
                        </div>

                        {/* Botón publicar */}
                        <div className="md:col-span-3">
                            <div className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-6 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">
                                        {resultsPublished ? '✅ Resultados publicados' : '📋 Resultados pendientes'}
                                    </h3>
                                    <p className="text-gray-500 text-sm">
                                        {resultsPublished
                                            ? 'Los estudiantes pueden ver sus notas y puesto.'
                                            : 'Cuando termines de cargar todas las notas, publica los resultados.'}
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    {resultsPublished && (
                                        <motion.button
                                            onClick={handleUnpublishResults}
                                            className="px-5 py-2 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            Ocultar
                                        </motion.button>
                                    )}
                                    <motion.button
                                        onClick={handlePublishResults}
                                        disabled={publishing}
                                        className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow hover:shadow-lg transition-all"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {publishing ? 'Publicando...' : resultsPublished ? '🔄 Recalcular y Publicar' : '🚀 Publicar Resultados'}
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            case 'students':
                return (
                    <StudentList
                        students={students}
                        onStudentDeleted={handleStudentDeleted}
                        onStudentUpdated={(student) => setEditingStudent(student)}
                        resultsPublished={resultsPublished}
                    />
                );
            case 'register':
                return <StudentRegistration onStudentAdded={fetchStudents} />;
            case 'grades':
                return <GradeManagement students={students} />;
            case 'admin':
                return <AdminPanel teachers={teachers} onTeacherStatusChange={fetchTeachers} />;
            case 'assign-subject':
                return <AssignSubject students={students} onSubjectAssigned={fetchStudents} />;
            case 'remove-subject':
                return <RemoveSubject students={students} onSubjectRemoved={fetchStudents} />;
            case 'transfer-student':
                return <StudentTransfer students={students} onTransferSuccess={fetchStudents} />;
            case 'priority':
                return <PrioritySubjects students={students} />;
            default:
                return null;
        }
    };

    const visibleTabs = tabs.filter(tab => tab.roles.includes(user.role));

    useEffect(() => {
        if (user && !visibleTabs.some(tab => tab.id === activeTab)) {
            setActiveTab(visibleTabs[0]?.id || 'overview');
        }
    }, [user, visibleTabs, activeTab]);

    return (
        <div className="space-y-8">
            <motion.div
                className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-xl"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Bienvenido, {user.name}
                        </h1>
                        <p className="text-gray-600 text-lg">Panel de Control</p>
                    </div>

                    <div className="flex flex-wrap bg-gray-100 rounded-2xl p-1 gap-1">
                        {visibleTabs.map((tab, index) => {
                            const Icon = tab.icon;
                            return (
                                <motion.button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-300 ${
                                        activeTab === tab.id
                                            ? 'bg-white text-gray-900 shadow-md'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                                    }`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="hidden sm:block">{tab.label}</span>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                {networkError && (
                    <motion.div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {networkError}
                    </motion.div>
                )}
                {error && (
                    <motion.div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {error}
                    </motion.div>
                )}
                {success && (
                    <motion.div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-600" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {success}
                    </motion.div>
                )}
            </AnimatePresence>

            {renderTabContent()}

            <AnimatePresence>
                {editingStudent && (
                    <EditStudentForm
                        student={editingStudent}
                        onSave={handleStudentUpdated}
                        onCancel={() => setEditingStudent(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default TeacherDashboard;