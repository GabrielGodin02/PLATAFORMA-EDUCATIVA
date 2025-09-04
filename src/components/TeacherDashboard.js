import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Users, UserPlus, BookOpen, BarChart3, Shield } from 'lucide-react';
import StudentRegistration from './StudentRegistration';
import StudentList from './StudentList';
import GradeManagement from './GradeManagement';
import AdminPanel from './AdminPanel';
import AssignSubject from './AssignSubject';
import RemoveSubject from './RemoveSubject';
import StudentTransfer from './StudentTransfer';
import { PlusCircle, Trash2, MoveRight } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import EditStudentForm from '../components/EditStudentForm'; // <--- Importa el nuevo componente

const TeacherDashboard = () => {
    const { user, networkError, deleteStudent, updateStudent } = useAuth(); // Importa las nuevas funciones del contexto
    const [students, setStudents] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [editingStudent, setEditingStudent] = useState(null); // Nuevo estado para el estudiante a editar
    const [success, setSuccess] = useState(null); // Estado para mensajes de éxito
    const [error, setError] = useState(null); // Estado para mensajes de error

    const fetchStudents = async () => {
        setLoadingStudents(true);
        try {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('teacher_id', user.id);

            if (error) {
                throw error;
            } else {
                setStudents(data);
            }
        } catch (err) {
            console.error('Error fetching students:', err);
            setError(err.message || 'Error al cargar los estudiantes.');
        } finally {
            setLoadingStudents(false);
        }
    };

    const fetchTeachers = async () => {
        try {
            const { data, error } = await supabase
                .from('teachers')
                .select('*');
            if (error) {
                throw error;
            }
            setTeachers(data);
        } catch (err) {
            console.error('Error fetching teachers:', err);
        }
    };

    // --- Funciones para manejar la eliminación y edición ---
    const handleStudentDeleted = async (studentId) => {
        try {
            await deleteStudent(studentId);
            setSuccess('Estudiante eliminado con éxito.');
            fetchStudents(); // Recarga la lista para reflejar el cambio
            // Opcional: limpiar los estados de error y éxito después de un tiempo
            setTimeout(() => setSuccess(null), 5000);
        } catch (err) {
            setError(err.message || 'Error al eliminar estudiante.');
        }
    };

    const handleStudentUpdated = async (studentId, updatedData) => {
        try {
            await updateStudent(studentId, updatedData);
            setSuccess('Estudiante actualizado con éxito.');
            setEditingStudent(null); // Cierra el modal de edición
            fetchStudents(); // Recarga la lista para reflejar el cambio
            setTimeout(() => setSuccess(null), 5000);
        } catch (err) {
            setError(err.message || 'Error al actualizar estudiante.');
        }
    };

    useEffect(() => {
        if (user?.id) {
            if (user.role === 'teacher') {
                fetchStudents();
            } else if (user.role === 'admin') {
                fetchTeachers();
            }
        }
    }, [user, activeTab]);

    const tabs = [
        { id: 'overview', label: 'Resumen', icon: BarChart3, roles: ['teacher'] },
        { id: 'students', label: 'Estudiantes', icon: Users, roles: ['teacher'] },
        { id: 'register', label: 'Registrar', icon: UserPlus, roles: ['teacher'] },
        { id: 'grades', label: 'Calificaciones', icon: BookOpen, roles: ['teacher'] },
        { id: 'assign-subject', label: 'Asignar Materia', icon: PlusCircle, roles: ['teacher'] },
        { id: 'remove-subject', label: 'Eliminar Materia', icon: Trash2, roles: ['teacher'] },
        { id: 'transfer-student', label: 'Transferir', icon: MoveRight, roles: ['teacher'] },
        { id: 'admin', label: 'Admin', icon: Shield, roles: ['admin'] }
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
                                <div className="p-3 bg-purple-100 rounded-xl">
                                    <BarChart3 className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        0
                                    </h3>
                                    <p className="text-gray-600">Con Calificaciones</p>
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
                        onStudentUpdated={(student) => setEditingStudent(student)} // Esto establece el estado de edición
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
                        <p className="text-gray-600 text-lg">
                            Panel de Control
                        </p>
                    </div>
                    
                    <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
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

            {/* Mensajes de feedback */}
            <AnimatePresence>
                {networkError && (
                    <motion.div 
                        className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {networkError}
                    </motion.div>
                )}
                {error && (
                    <motion.div 
                        className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {error}
                    </motion.div>
                )}
                {success && (
                    <motion.div 
                        className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-600"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {success}
                    </motion.div>
                )}
            </AnimatePresence>
            
            {renderTabContent()}

            {/* Formulario de edición (modal) */}
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