import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, X, Eye, EyeOff } from 'lucide-react';
import bcrypt from 'bcryptjs';

const EditStudentForm = ({ student, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: student.name,
        grade_level: student.grade_level || '',
        username: student.username,
        newPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSave = async () => {
        setLoading(true);
        setError(null);
        try {
            const updatedData = {
                name: formData.name,
                grade_level: formData.grade_level,
                username: formData.username,
            };

            // Si ingresó nueva contraseña, hashearla y guardar también temp_password
            if (formData.newPassword.trim()) {
                updatedData.password = bcrypt.hashSync(formData.newPassword, 10);
                updatedData.temp_password = formData.newPassword; // texto plano visible
            }

            await onSave(student.id, updatedData);
            onCancel();
        } catch (err) {
            setError('Error al actualizar el estudiante.');
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 backdrop-blur-sm p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="bg-white rounded-3xl p-8 shadow-xl max-w-lg w-full"
                    initial={{ scale: 0.9, y: 50 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 50 }}
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-800">Editar Estudiante</h3>
                        <button onClick={onCancel} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                placeholder="Nombre completo"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                placeholder="Nombre de usuario"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Grado</label>
                            <input
                                type="text"
                                name="grade_level"
                                value={formData.grade_level}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                placeholder="Ej: 5° Grado"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Contraseña actual
                            </label>
                            <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 font-mono text-sm">
                                {student.temp_password || 'No disponible'}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nueva contraseña <span className="text-gray-400">(dejar vacío para no cambiar)</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 pr-12"
                                    placeholder="Nueva contraseña"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

                    <div className="flex justify-end mt-6">
                        <motion.button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-all duration-300"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={loading}
                        >
                            {loading ? 'Guardando...' : <><Save size={20} /> Guardar</>}
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default EditStudentForm;