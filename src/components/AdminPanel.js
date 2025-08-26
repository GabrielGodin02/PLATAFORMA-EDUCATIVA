import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

const AdminPanel = () => {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updating, setUpdating] = useState(null); // Para saber qué profesor se está actualizando

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('teachers')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error("Error fetching teachers:", error);
            setError("No se pudieron cargar los profesores.");
        } else {
            setTeachers(data);
        }
        setLoading(false);
    };

    const toggleTeacherStatus = async (teacherId, currentStatus) => {
        setUpdating(teacherId);
        const newStatus = !currentStatus;

        const { error } = await supabase
            .from('teachers')
            .update({ is_active: newStatus })
            .eq('id', teacherId);

        if (error) {
            console.error("Error updating teacher status:", error);
            setError("Error al actualizar el estado del profesor.");
        } else {
            // Actualiza el estado localmente para evitar otra llamada a la base de datos
            setTeachers(teachers.map(t =>
                t.id === teacherId ? { ...t, is_active: newStatus } : t
            ));
        }
        setUpdating(null);
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mr-2" /> Cargando...
        </div>;
    }

    if (error) {
        return <div className="p-4 bg-red-100 text-red-700 rounded-md">Error: {error}</div>;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-8 bg-white/90 backdrop-blur-lg border border-gray-200/50 rounded-3xl shadow-xl"
        >
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
                    <User className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Panel de Administración</h2>
                    <p className="text-gray-600">Gestiona la activación de las cuentas de los profesores.</p>
                </div>
            </div>

            <ul className="space-y-4">
                {teachers.length === 0 ? (
                    <p className="text-gray-500 text-center">No hay profesores registrados.</p>
                ) : (
                    teachers.map(teacher => (
                        <motion.li
                            key={teacher.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl shadow-sm"
                            whileHover={{ scale: 1.01, backgroundColor: '#f9fafb' }}
                        >
                            <div className="flex items-center gap-4">
                                <span className="p-2 bg-gray-200 rounded-full">
                                    <User className="w-5 h-5 text-gray-600" />
                                </span>
                                <div>
                                    <h3 className="font-semibold text-gray-800">{teacher.name}</h3>
                                    <p className="text-sm text-gray-500">{teacher.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`font-semibold ${teacher.is_active ? 'text-green-600' : 'text-red-600'}`}>
                                    {teacher.is_active ? 'Activo' : 'Inactivo'}
                                </span>
                                <button
                                    onClick={() => toggleTeacherStatus(teacher.id, teacher.is_active)}
                                    disabled={updating === teacher.id}
                                    className="p-2 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
                                >
                                    {updating === teacher.id ? (
                                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                    ) : teacher.is_active ? (
                                        <ToggleRight className="w-6 h-6 text-green-500" />
                                    ) : (
                                        <ToggleLeft className="w-6 h-6 text-red-500" />
                                    )}
                                </button>
                            </div>
                        </motion.li>
                    ))
                )}
            </ul>
        </motion.div>
    );
};

export default AdminPanel;