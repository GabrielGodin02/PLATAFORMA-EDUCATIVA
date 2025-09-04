import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Save, RefreshCw, Book } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

const StudentRegistration = ({ onStudentAdded }) => {
    const { user, registerStudent, networkError } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        password: '',
        selectedSubjects: [],
        grade_level: ''
    });
    const [newSubject, setNewSubject] = useState('');
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const generateCredentials = () => {
        const username = `est_${Math.random().toString(36).slice(2, 8)}`;
        const password = Math.random().toString(36).slice(-8);
        setFormData({
            ...formData,
            username,
            password
        });
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
        setSuccess('');
    };

    const handleAddSubject = () => {
        if (newSubject.trim() && !formData.selectedSubjects.includes(newSubject.trim())) {
            setFormData(prev => ({
                ...prev,
                selectedSubjects: [...prev.selectedSubjects, newSubject.trim()]
            }));
            setNewSubject('');
        }
    };

    const handleRemoveSubject = (subjectToRemove) => {
        setFormData(prev => ({
            ...prev,
            selectedSubjects: prev.selectedSubjects.filter(s => s !== subjectToRemove)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        // Verifica que el usuario está disponible y tiene un ID antes de proceder
        if (!user || !user.id) {
            setError('Error: La sesión del profesor no está activa. Intenta iniciar sesión de nuevo.');
            setLoading(false);
            return;
        }

        if (!formData.name || !formData.username || !formData.password || formData.selectedSubjects.length === 0) {
            setError('Todos los campos son obligatorios y debe seleccionar al menos una materia.');
            setLoading(false);
            return;
        }

        try {
            const teacherId = user.id;

            // Llama a la función de registro para crear el estudiante en la tabla 'students'
            const newStudent = await registerStudent(
                formData.name,
                formData.username,
                formData.password,
                teacherId,
                formData.grade_level // <-- ¡Este es el campo agregado!
            );

            if (!newStudent || !newStudent.user) {
                throw new Error('No se pudo registrar al estudiante. Por favor, revisa la conexión y las credenciales.');
            }

            // Mapea las materias para crear los objetos de inserción
            const subjectInserts = formData.selectedSubjects.map(subjectName => ({
                student_id: newStudent.user.id,
                teacher_id: teacherId,
                name: subjectName
            }));

            // Inserta las materias en la tabla 'subjects'
            const { error: subjectsError } = await supabase
                .from('subjects')
                .insert(subjectInserts);

            if (subjectsError) {
                console.error('Error al agregar materias:', subjectsError);
                setError('Error al agregar materias al estudiante.');
                // Si falla la inserción de materias, se elimina al estudiante recién creado
                await supabase.from('students').delete().eq('id', newStudent.user.id);
                setLoading(false);
                return;
            }

            setSuccess(`Estudiante ${formData.name} registrado exitosamente. Usuario: ${formData.username}, Contraseña: ${formData.password}`);
            setFormData({ name: '', username: '', password: '', selectedSubjects: [], grade_level: '' });
            setNewSubject('');
            if (onStudentAdded) {
                onStudentAdded();
            }
        } catch (err) {
            setError(err.message || 'Error al registrar estudiante.');
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
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl">
                    <UserPlus className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Registrar Estudiante</h2>
                    <p className="text-gray-600">Agrega un nuevo estudiante y asigna materias</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre Completo del Estudiante
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-300"
                        placeholder="Nombre completo del estudiante"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre de Usuario
                        </label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-300"
                            placeholder="Usuario para el estudiante"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nivel de Grado
                        </label>
                        <input
                            type="text"
                            name="grade_level"
                            value={formData.grade_level}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-300"
                            placeholder="Ej: 5° Grado"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contraseña
                        </label>
                        <input
                            type="text"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-300"
                            placeholder="Contraseña para el estudiante"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Asignar Materias
                    </label>
                    <div className="flex gap-2 mb-3">
                        <input
                            type="text"
                            value={newSubject}
                            onChange={(e) => setNewSubject(e.target.value)}
                            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-300"
                            placeholder="Ej: Matemáticas, Castellano"
                        />
                        <motion.button
                            type="button"
                            onClick={handleAddSubject}
                            className="px-5 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-all duration-300"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Book className="w-5 h-5" />
                        </motion.button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {formData.selectedSubjects.map((subject, index) => (
                            <motion.span
                                key={index}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                            >
                                {subject}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveSubject(subject)}
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    &times;
                                </button>
                            </motion.span>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <motion.button
                        type="button"
                        onClick={generateCredentials}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-300"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                    >
                        <RefreshCw className="w-5 h-5" />
                        Generar Credenciales
                    </motion.button>

                    <motion.button
                        type="submit"
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex-1"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span className="ml-2">Registrando...</span>
                            </div>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Registrar Estudiante
                            </>
                        )}
                    </motion.button>
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

                {networkError && (
                    <motion.div 
                        className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        {networkError}
                    </motion.div>
                )}
            </form>
        </motion.div>
    );
};

export default StudentRegistration;