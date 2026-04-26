import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { BookOpen, ChevronDown, ChevronUp, Trophy, Lock } from 'lucide-react';
import { calculateAverage, calculateFinalGrade, getGradeStatus } from '../utils/gradeCalculations';
import { supabase } from '../utils/supabaseClient';

const StudentDashboard = () => {
    const { user, networkError } = useAuth();
    const [studentSubjects, setStudentSubjects] = useState([]);
    const [loadingSubjects, setLoadingSubjects] = useState(true);
    const [expandedSubject, setExpandedSubject] = useState(null);
    const [expandedYear, setExpandedYear] = useState(null);
    const [resultsPublished, setResultsPublished] = useState(false);
    const [ranking, setRanking] = useState(null);

    useEffect(() => {
        const fetchStudentData = async () => {
            if (!user?.id) return;
            setLoadingSubjects(true);
            try {
                // Traer materias y notas
                const { data: subjectsData } = await supabase
                    .from('subjects')
                    .select(`id, name, grades(year, period, type, grade_index, value)`)
                    .eq('student_id', user.id);

                const transformedSubjects = (subjectsData || []).map(subject => {
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
                setStudentSubjects(transformedSubjects);

                // Traer estado de publicación del profesor y puesto del estudiante
                const { data: studentData } = await supabase
                    .from('students')
                    .select('ranking, teacher_id')
                    .eq('id', user.id)
                    .single();

                if (studentData) {
                    setRanking(studentData.ranking);

                    const { data: teacherData } = await supabase
                        .from('teachers')
                        .select('results_published')
                        .eq('id', studentData.teacher_id)
                        .single();

                    setResultsPublished(teacherData?.results_published || false);
                }
            } catch (err) {
                console.error('Error fetching student data:', err);
            } finally {
                setLoadingSubjects(false);
            }
        };

        fetchStudentData();
    }, [user]);

    const toggleSubject = (subjectName) => {
        setExpandedSubject(expandedSubject === subjectName ? null : subjectName);
        setExpandedYear(null);
    };

    const toggleYear = (year) => {
        setExpandedYear(expandedYear === year ? null : year);
    };

    const getRankingMedal = (r) => {
        if (r === 1) return '🥇';
        if (r === 2) return '🥈';
        if (r === 3) return '🥉';
        return `#${r}`;
    };

    if (loadingSubjects) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div
                className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-xl"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Hola, {user.name}</h1>
                        <p className="text-gray-600 text-lg">Bienvenido a tu panel de notas</p>
                    </div>

                    {/* Puesto */}
                    {resultsPublished && ranking ? (
                        <motion.div
                            className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Trophy className="w-8 h-8 text-yellow-500" />
                            <div>
                                <p className="text-sm text-gray-500">Tu puesto en el salón</p>
                                <p className="text-3xl font-bold text-gray-900">{getRankingMedal(ranking)}</p>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-400">
                            <Lock className="w-6 h-6" />
                            <p className="text-sm">Resultados pendientes</p>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Materias y notas — solo si está publicado */}
            {!resultsPublished ? (
                <motion.div
                    className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-12 text-center shadow-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <Lock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-700 mb-2">Resultados no publicados aún</h3>
                    <p className="text-gray-500">Tu profesor aún no ha publicado los resultados. Vuelve más tarde.</p>
                </motion.div>
            ) : studentSubjects.length === 0 ? (
                <motion.div
                    className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-12 text-center shadow-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <BookOpen className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">Aún no tienes materias asignadas</h3>
                    <p className="text-gray-500">Tu profesor debe asignarte materias.</p>
                </motion.div>
            ) : (
                <motion.div
                    className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Mis Materias y Notas</h2>
                    <div className="space-y-4">
                        {studentSubjects.map((subject) => (
                            <motion.div
                                key={subject.id}
                                className="border border-gray-200 rounded-2xl overflow-hidden"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <button
                                    onClick={() => toggleSubject(subject.name)}
                                    className="flex items-center justify-between w-full p-5 bg-gray-50 hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <BookOpen className="w-6 h-6 text-blue-600" />
                                        <span className="text-lg font-semibold text-gray-900">{subject.name}</span>
                                    </div>
                                    {expandedSubject === subject.name ? <ChevronUp className="w-5 h-5 text-gray-600" /> : <ChevronDown className="w-5 h-5 text-gray-600" />}
                                </button>

                                <AnimatePresence>
                                    {expandedSubject === subject.name && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="p-5 bg-white border-t border-gray-200"
                                        >
                                            <div className="space-y-3">
                                                {Object.keys(subject.years).length === 0 ? (
                                                    <p className="text-gray-500 text-sm">No hay períodos registrados.</p>
                                                ) : (
                                                    Object.keys(subject.years).map((year) => (
                                                        <div key={year} className="border border-gray-100 rounded-xl overflow-hidden">
                                                            <button
                                                                onClick={() => toggleYear(year)}
                                                                className="flex items-center justify-between w-full p-4 bg-blue-50 hover:bg-blue-100 transition-colors"
                                                            >
                                                                <span className="font-medium text-blue-800">Año {year}</span>
                                                                {expandedYear === year ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />}
                                                            </button>

                                                            <AnimatePresence>
                                                                {expandedYear === year && (
                                                                    <motion.div
                                                                        initial={{ height: 0, opacity: 0 }}
                                                                        animate={{ height: 'auto', opacity: 1 }}
                                                                        exit={{ height: 0, opacity: 0 }}
                                                                        className="p-4 bg-white border-t border-gray-100"
                                                                    >
                                                                        <div className="space-y-3">
                                                                            {Object.keys(subject.years[year]).map((period) => {
                                                                                const grades = subject.years[year][period];
                                                                                const taskAvg = calculateAverage(grades.tasks);
                                                                                const examAvg = calculateAverage(grades.exams);
                                                                                const presentationAvg = calculateAverage(grades.presentations);
                                                                                const finalGrade = calculateFinalGrade(taskAvg, examAvg, presentationAvg);
                                                                                const gradeStatus = getGradeStatus(finalGrade);

                                                                                return (
                                                                                    <div key={period} className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                                                                                        <div className="flex items-center justify-between mb-3">
                                                                                            <h5 className="font-semibold text-gray-800">{period}</h5>
                                                                                            <div className="flex items-center gap-2">
                                                                                                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${gradeStatus.bg} ${gradeStatus.color}`}>
                                                                                                    {gradeStatus.status}
                                                                                                </span>
                                                                                                <span className="text-xl font-bold text-gray-900">{finalGrade}</span>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="overflow-x-auto">
                                                                                            <table className="w-full text-sm">
                                                                                                <thead>
                                                                                                    <tr className="border-b border-gray-200">
                                                                                                        <th className="text-left py-2 px-2 font-medium text-gray-600">Categoría</th>
                                                                                                        <th className="text-center py-2 px-2 font-medium text-gray-600">N1</th>
                                                                                                        <th className="text-center py-2 px-2 font-medium text-gray-600">N2</th>
                                                                                                        <th className="text-center py-2 px-2 font-medium text-gray-600">N3</th>
                                                                                                        <th className="text-center py-2 px-2 font-medium text-gray-600">N4</th>
                                                                                                        <th className="text-center py-2 px-2 font-medium text-gray-600">Prom.</th>
                                                                                                    </tr>
                                                                                                </thead>
                                                                                                <tbody>
                                                                                                    <tr>
                                                                                                        <td className="py-2 px-2">Tareas</td>
                                                                                                        <td className="text-center py-2 px-2">{grades.tasks[0] || '-'}</td>
                                                                                                        <td className="text-center py-2 px-2">{grades.tasks[1] || '-'}</td>
                                                                                                        <td className="text-center py-2 px-2">{grades.tasks[2] || '-'}</td>
                                                                                                        <td className="text-center py-2 px-2">{grades.tasks[3] || '-'}</td>
                                                                                                        <td className="text-center py-2 px-2 font-semibold">{taskAvg}</td>
                                                                                                    </tr>
                                                                                                    <tr>
                                                                                                        <td className="py-2 px-2">Evaluaciones</td>
                                                                                                        <td className="text-center py-2 px-2">{grades.exams[0] || '-'}</td>
                                                                                                        <td className="text-center py-2 px-2">{grades.exams[1] || '-'}</td>
                                                                                                        <td className="text-center py-2 px-2">{grades.exams[2] || '-'}</td>
                                                                                                        <td className="text-center py-2 px-2">-</td>
                                                                                                        <td className="text-center py-2 px-2 font-semibold">{examAvg}</td>
                                                                                                    </tr>
                                                                                                    <tr>
                                                                                                        <td className="py-2 px-2">Exposiciones</td>
                                                                                                        <td className="text-center py-2 px-2">{grades.presentations[0] || '-'}</td>
                                                                                                        <td className="text-center py-2 px-2">{grades.presentations[1] || '-'}</td>
                                                                                                        <td className="text-center py-2 px-2">{grades.presentations[2] || '-'}</td>
                                                                                                        <td className="text-center py-2 px-2">-</td>
                                                                                                        <td className="text-center py-2 px-2 font-semibold">{presentationAvg}</td>
                                                                                                    </tr>
                                                                                                </tbody>
                                                                                            </table>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default StudentDashboard;