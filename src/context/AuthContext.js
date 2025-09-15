import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import bcrypt from 'bcryptjs';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [networkError, setNetworkError] = useState(null);

    // Manejo de errores global
    const handleError = (err) => {
        console.error('Auth operation failed:', err);
        if (
            err.message &&
            (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))
        ) {
            setNetworkError('Problemas de conexión a la red. Por favor, verifica tu internet.');
        } else {
            setNetworkError(null);
        }
        throw err;
    };

    // Inicialización
    useEffect(() => {
        setLoading(false);
    }, []);

    // --- LOGIN ---
    const login = async (emailOrUsername, password) => {
        setLoading(true);
        setNetworkError(null);

        try {
            let foundUser = null;
            let role = null;

            // 🔹 Admin login hardcodeado
            if (emailOrUsername === 'admin02@gmail.com' && password === 'admin0240') {
                foundUser = { id: 'admin-uuid', email: emailOrUsername, name: 'Administrador' };
                role = 'admin';
            }

            // 🔹 Buscar en la tabla de profesores
            if (!foundUser) {
                const { data: teacherData } = await supabase
                    .from('teachers')
                    .select('*')
                    .eq('email', emailOrUsername)
                    .maybeSingle();

                if (teacherData) {
                    if (bcrypt.compareSync(password, teacherData.password)) {
                        if (!teacherData.is_active) {
                            throw new Error(
                                'Tu cuenta de profesor está desactivada. Contacta al administrador.'
                            );
                        }
                        foundUser = teacherData;
                        role = 'teacher';
                    }
                }
            }

            // 🔹 Buscar en la tabla de estudiantes
            if (!foundUser) {
                const { data: studentData } = await supabase
                    .from('students')
                    .select('*')
                    .eq('username', emailOrUsername)
                    .maybeSingle();

                if (studentData) {
                    if (bcrypt.compareSync(password, studentData.password)) {
                        foundUser = studentData;
                        role = 'student';
                    }
                }
            }

            if (foundUser) {
                const loggedUser = { ...foundUser, role };
                setUser(loggedUser);
                return { message: 'Inicio de sesión exitoso.', ...loggedUser };
            } else {
                throw new Error('Credenciales incorrectas.');
            }
        } catch (err) {
            handleError(err);
        } finally {
            setLoading(false);
        }
    };

    // --- REGISTRO PROFESOR ---
    const registerTeacher = async (name, email, password) => {
        setLoading(true);
        setNetworkError(null);
        try {
            const { data: existingTeacher } = await supabase
                .from('teachers')
                .select('email')
                .eq('email', email)
                .maybeSingle();
            
            if (existingTeacher) {
                throw new Error('El correo electrónico ya está registrado como profesor.');
            }

            const hashedPassword = bcrypt.hashSync(password, 10);

            const { data, error } = await supabase
                .from('teachers')
                .insert([
                    {
                        id: crypto.randomUUID(),
                        name,
                        email,
                        password: hashedPassword,
                        is_active: true,
                    },
                ])
                .select()
                .single();

            if (error) throw error;

            return {
                message: 'Registro de profesor exitoso.',
                user: { ...data, role: 'teacher' },
            };
        } catch (err) {
            handleError(err);
        } finally {
            setLoading(false);
        }
    };

    // --- REGISTRO ESTUDIANTE ---
    const registerStudent = async (name, username, password, teacherId, grade_level) => {
        setLoading(true);
        setNetworkError(null);
        try {
            if (username.includes('@')) {
                throw new Error('El nombre de usuario no puede ser un correo electrónico.');
            }

            const { data: existingStudent } = await supabase
                .from('students')
                .select('username')
                .eq('username', username)
                .maybeSingle();

            if (existingStudent) {
                throw new Error('El nombre de usuario ya está en uso.');
            }

            const hashedPassword = bcrypt.hashSync(password, 10);

            const { data, error } = await supabase
                .from('students')
                .insert([
                    {
                        id: crypto.randomUUID(),
                        name,
                        username,
                        password: hashedPassword,
                        teacher_id: teacherId,
                        grade_level
                    },
                ])
                .select()
                .single();

            if (error) throw error;

            return {
                message: 'Registro de estudiante exitoso.',
                user: { ...data, role: 'student' },
            };
        } catch (err) {
            handleError(err);
        } finally {
            setLoading(false);
        }
    };

    // --- NUEVAS FUNCIONES ---
    const deleteStudent = async (studentId) => {
        try {
            const { error } = await supabase
                .from('students')
                .delete()
                .eq('id', studentId);

            if (error) throw error;

            return { success: true };
        } catch (err) {
            handleError(err);
        }
    };

    const updateStudent = async (studentId, updatedData) => {
        try {
            const { data, error } = await supabase
                .from('students')
                .update(updatedData)
                .eq('id', studentId)
                .select();

            if (error) throw error;
            
            return data;
        } catch (err) {
            handleError(err);
        }
    };

    // --- LOGOUT ---
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
        networkError,
        deleteStudent,
        updateStudent,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
