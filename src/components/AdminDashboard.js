import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import AdminPanel from './AdminPanel';
import { motion } from 'framer-motion';
import { Settings, Mail, Lock, Save, Eye, EyeOff } from 'lucide-react';
import bcrypt from 'bcryptjs';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('teachers');

    // Estados para cambiar credenciales
    const [newEmail, setNewEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [savingCredentials, setSavingCredentials] = useState(false);
    const [credSuccess, setCredSuccess] = useState('');
    const [credError, setCredError] = useState('');

    const fetchTeachers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('teachers')
            .select('*')
            .order('name', { ascending: true });

        if (!error) setTeachers(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    const handleSaveCredentials = async () => {
        setCredError('');
        setCredSuccess('');

        // Validar contraseña actual
        if (!currentPassword) {
            setCredError('Debes ingresar tu contraseña actual para hacer cambios.');
            return;
        }

        // Verificar contraseña actual
        const { data: adminData } = await supabase
            .from('admins')
            .select('password')
            .eq('id', user.id)
            .single();

        if (!adminData || !bcrypt.compareSync(currentPassword, adminData.password)) {
            setCredError('La contraseña actual es incorrecta.');
            return;
        }

        // Validar nueva contraseña si se ingresó
        if (newPassword && newPassword !== confirmPassword) {
            setCredError('Las contraseñas nuevas no coinciden.');
            return;
        }

        if (newPassword && newPassword.length < 6) {
            setCredError('La nueva contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setSavingCredentials(true);
        try {
            const updates = {};

            if (newEmail.trim()) updates.email = newEmail.trim();
            if (newPassword) updates.password = bcrypt.hashSync(newPassword, 10);

            if (Object.keys(updates).length === 0) {
                setCredError('No hay cambios para guardar.');
                setSavingCredentials(false);
                return;
            }

            const { error } = await supabase
                .from('admins')
                .update(updates)
                .eq('id', user.id);

            if (error) throw error;

            setCredSuccess('Credenciales actualizadas con éxito. Vuelve a iniciar sesión si cambiaste el correo.');
            setNewEmail('');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setCredSuccess(''), 5000);
        } catch (err) {
            setCredError('Error al actualizar credenciales.');
        } finally {
            setSavingCredentials(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">

            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-2xl p-1 gap-1 w-fit">
                <button
                    onClick={() => setActiveTab('teachers')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl font-medium text-sm transition-all duration-300 ${
                        activeTab === 'teachers'
                            ? 'bg-white text-gray-900 shadow-md'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    Profesores
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl font-medium text-sm transition-all duration-300 ${
                        activeTab === 'settings'
                            ? 'bg-white text-gray-900 shadow-md'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    <Settings className="w-4 h-4" />
                    Mi Cuenta
                </button>
            </div>

            {/* Contenido */}
            {activeTab === 'teachers' ? (
                <AdminPanel
                    teachers={teachers}
                    onTeacherStatusChange={fetchTeachers}
                />
            ) : (
                <motion.div
                    className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-xl space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl">
                            <Settings className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Mi Cuenta</h2>
                            <p className="text-gray-500 text-sm">Cambia tu correo o contraseña</p>
                        </div>
                    </div>

                    {/* Email actual */}
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-sm text-gray-500">Correo actual</p>
                        <p className="font-semibold text-gray-800">{user.email}</p>
                    </div>

                    {/* Nuevo correo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Mail className="w-4 h-4" /> Nuevo correo <span className="text-gray-400">(dejar vacío para no cambiar)</span>
                        </label>
                        <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
                            placeholder="nuevo@correo.com"
                        />
                    </div>

                    {/* Contraseña actual */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Lock className="w-4 h-4" /> Contraseña actual <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showCurrent ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all pr-12"
                                placeholder="Tu contraseña actual"
                            />
                            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Nueva contraseña */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Lock className="w-4 h-4" /> Nueva contraseña <span className="text-gray-400">(dejar vacío para no cambiar)</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showNew ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all pr-12"
                                placeholder="Nueva contraseña"
                            />
                            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Confirmar contraseña */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Lock className="w-4 h-4" /> Confirmar nueva contraseña
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirm ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all pr-12"
                                placeholder="Repite la nueva contraseña"
                            />
                            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {credError && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                            {credError}
                        </div>
                    )}
                    {credSuccess && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
                            {credSuccess}
                        </div>
                    )}

                    <motion.button
                        onClick={handleSaveCredentials}
                        disabled={savingCredentials}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Save className="w-5 h-5" />
                        {savingCredentials ? 'Guardando...' : 'Guardar Cambios'}
                    </motion.button>
                </motion.div>
            )}
        </div>
    );
};

export default AdminDashboard;