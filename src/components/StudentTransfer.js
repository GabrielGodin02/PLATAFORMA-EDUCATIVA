import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Mail, MoveRight } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

const StudentTransfer = ({ students = [], onTransferSuccess }) => {
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [recipientEmail, setRecipientEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [recipientTeacher, setRecipientTeacher] = useState(null);

    const handleRecipientEmailChange = async (e) => {
        const email = e.target.value;
        setRecipientEmail(email);
        setRecipientTeacher(null);
        setError('');

        if (email.trim().length > 3) {
            const { data, error: fetchError } = await supabase
                .from('teachers')
                .select('id, name')
                .eq('email', email)
                .eq('is_active', true) // Solo profesores activos
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                setError('Error al buscar el profesor.');
            } else if (data) {
                setRecipientTeacher(data);
            }
        }
    };

    const handleTransfer = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (!selectedStudentId || !recipientTeacher) {
            setError('Por favor, selecciona un estudiante y un profesor válido.');
            setLoading(false);
            return;
        }

        try {
            // Obtener el ID del estudiante para confirmar
            const studentToTransfer = students.find(s => s.id === selectedStudentId);

            // Actualizar el `teacher_id` en la tabla `students`
            const { error: studentUpdateError } = await supabase
                .from('students')
                .update({ teacher_id: recipientTeacher.id })
                .eq('id', selectedStudentId);

            if (studentUpdateError) throw studentUpdateError;

            // Actualizar el `teacher_id` en la tabla `subjects` del estudiante
            const { error: subjectUpdateError } = await supabase
                .from('subjects')
                .update({ teacher_id: recipientTeacher.id })
                .eq('student_id', selectedStudentId);
            
            if (subjectUpdateError) throw subjectUpdateError;

            setSuccess(`Estudiante ${studentToTransfer.name} transferido exitosamente a ${recipientTeacher.name}.`);
            setSelectedStudentId('');
            setRecipientEmail('');
            setRecipientTeacher(null);
            if (onTransferSuccess) {
                onTransferSuccess(); // Refrescar la lista de estudiantes en el componente padre
            }
        } catch (err) {
            console.error('Error al transferir estudiante:', err);
            setError(err.message || 'Ocurrió un error al transferir al estudiante.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div 
            className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-cyan-600 rounded-2xl">
                    <MoveRight className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Transferir Estudiante</h2>
                    <p className="text-gray-600">Transfiere un estudiante a otro profesor</p>
                </div>
            </div>

            <form onSubmit={handleTransfer} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Seleccionar Estudiante a Transferir
                    </label>
                    <select
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-300"
                    >
                        <option value="">Selecciona un estudiante...</option>
                        {students.map(student => (
                            <option key={student.id} value={student.id}>
                                {student.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email del Profesor Destino
                    </label>
                    <input
                        type="email"
                        value={recipientEmail}
                        onChange={handleRecipientEmailChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-300"
                        placeholder="ej: profesor@email.com"
                    />
                    {recipientTeacher && (
                        <p className="mt-2 text-sm text-green-600">
                            <span className="font-semibold">Profesor encontrado:</span> {recipientTeacher.name}
                        </p>
                    )}
                </div>

                {error && (
                    <motion.div 
                        className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        {error}
                    </motion.div>
                )}

                {success && (
                    <motion.div 
                        className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-600"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        {success}
                    </motion.div>
                )}

                <motion.button
                    type="submit"
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 w-full"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading || !selectedStudentId || !recipientTeacher}
                >
                    {loading ? (
                        <div className="flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span className="ml-2">Transfiriendo...</span>
                        </div>
                    ) : (
                        <>
                            <MoveRight className="w-5 h-5" />
                            Transferir Estudiante
                        </>
                    )}
                </motion.button>
            </form>
        </motion.div>
    );
};

export default StudentTransfer;