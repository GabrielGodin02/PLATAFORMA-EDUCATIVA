import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser usado dentro de AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [networkError, setNetworkError] = useState(null);

    const handleError = (err) => {
        console.error('Auth operation failed:', err);
        if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
            setNetworkError('Problemas de conexión a la red. Por favor, verifica tu internet.');
        } else {
            setNetworkError(null);
        }
        throw err;
    };

    useEffect(() => {
        const fetchUser = async () => {
            setLoading(true);
            setNetworkError(null);
            try {
                setUser(null);
            } catch (err) {
                handleError(err);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    const login = async (emailOrUsername, password) => {
        setLoading(true);
        setNetworkError(null);
        try {
            let foundUser = null;
            let role = null;

            // 1. Intentar buscar como Admin
            const { data: adminData } = await supabase
                .from('admins')
                .select('*')
                .eq('email', emailOrUsername)
                .eq('password', password)
                .single();

            if (adminData) {
                foundUser = adminData;
                role = 'admin';
            } else {
                // 2. Intentar buscar como profesor
                const { data: teacherData } = await supabase
                    .from('teachers')
                    .select('*')
                    .eq('email', emailOrUsername)
                    .eq('password', password)
                    .single();

                if (teacherData) {
                    if (!teacherData.is_active) {
                        throw new Error('Tu cuenta de profesor está desactivada. Contacta al administrador.');
                    }
                    foundUser = teacherData;
                    role = 'teacher';
                } else {
                    // 3. Si no es profesor, intentar buscar como estudiante
                    const { data: studentData } = await supabase
                        .from('students')
                        .select('*')
                        .eq('username', emailOrUsername)
                        .eq('password', password)
                        .single();
                    
                    if (studentData) {
                        foundUser = studentData;
                        role = 'student';
                    }
                }
            }

            if (foundUser) {
                setUser({ ...foundUser, role });
                return { message: 'Inicio de sesión exitoso.' };
            } else {
                throw new Error('Credenciales incorrectas.');
            }
        } catch (err) {
            handleError(err);
        } finally {
            setLoading(false);
        }
    };

    const registerTeacher = async (name, email, password) => {
        setLoading(true);
        setNetworkError(null);
        try {
            const newId = crypto.randomUUID();
            const { data, error } = await supabase
                .from('teachers')
                .insert([{ id: newId, name, email, password, is_active: true }])
                .select()
                .single();

            if (error) {
                throw error;
            }
            return { message: 'Registro de profesor exitoso.', user: { ...data, role: 'teacher' } };
        } catch (err) {
            handleError(err);
        } finally {
            setLoading(false);
        }
    };

    const registerStudent = async (name, username, password, teacherId) => {
        setLoading(true);
        setNetworkError(null);
        try {
            // Validación: Asegurarse de que el nombre de usuario no es un email
            if (username.includes('@')) {
                throw new Error('El nombre de usuario no puede ser una dirección de correo electrónico.');
            }
            const newId = crypto.randomUUID();
            const { data, error } = await supabase
                .from('students')
                .insert([{ id: newId, name, username, password, teacher_id: teacherId }])
                .select()
                .single();

            if (error) {
                throw error;
            }
            return { message: 'Registro de estudiante exitoso.', user: { ...data, role: 'student' } };
        } catch (err) {
            handleError(err);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        setNetworkError(null);
        return new Promise((resolve) => {
            setTimeout(() => {
                setUser(null);
                setLoading(false);
                resolve({ message: 'Cierre de sesión exitoso.' });
            }, 300);
        });
    };

    const value = {
        user,
        login,
        registerTeacher,
        registerStudent,
        logout,
        loading,
        networkError
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};