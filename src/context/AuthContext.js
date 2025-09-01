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
    const fetchUser = async () => {
      setLoading(true);
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

  // --- LOGIN ---
  const login = async (emailOrUsername, password) => {
    setLoading(true);
    setNetworkError(null);

    try {
      let foundUser = null;
      let role = null;

      // Buscar en la tabla de profesores
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

      if (!foundUser) {
        // Buscar en la tabla de estudiantes
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
        // La autenticación es exitosa. Se establece el usuario en el estado de React.
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

  // --- REGISTRO PROFESOR ---
  const registerTeacher = async (name, email, password) => {
    setLoading(true);
    setNetworkError(null);
    try {
      const { data: existingTeacher, error: checkError } = await supabase
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
  const registerStudent = async (name, username, password, teacherId) => {
    setLoading(true);
    setNetworkError(null);
    try {
      if (username.includes('@')) {
        throw new Error('El nombre de usuario no puede ser un correo electrónico.');
      }

      // Se verifica si el nombre de usuario ya existe
      const { data: existingStudent, error: checkError } = await supabase
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

  // --- ELIMINAR ESTUDIANTE CON VALIDACIÓN ---
  const deleteStudent = async (studentId) => {
    setLoading(true);
    setNetworkError(null);
    try {
        // 1. Verificar si el estudiante tiene asignaturas
        const { data: subjects, error: subjectsError } = await supabase
            .from('subjects')
            .select('id')
            .eq('student_id', studentId);

        if (subjectsError) throw subjectsError;

        if (subjects.length > 0) {
            alert('El estudiante tiene asignaturas asignadas. Debes eliminarlas primero.');
            return { message: 'Operación cancelada.' };
        }

        // 2. Verificar si el estudiante tiene calificaciones
        const { data: grades, error: gradesError } = await supabase
            .from('grades')
            .select('id')
            .eq('student_id', studentId);

        if (gradesError) throw gradesError;

        if (grades.length > 0) {
            alert('El estudiante tiene calificaciones. Debes eliminarlas primero.');
            return { message: 'Operación cancelada.' };
        }

        // 3. Si no hay datos asociados, procede con la eliminación del estudiante
        const { error: deleteError } = await supabase
            .from('students')
            .delete()
            .eq('id', studentId);

        if (deleteError) throw deleteError;

        alert('Estudiante eliminado exitosamente.');
        return { message: 'Estudiante eliminado exitosamente.' };

    } catch (err) {
        handleError(err);
    } finally {
        setLoading(false);
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
    deleteStudent, // <--- Se agrega la nueva función aquí
    logout,
    loading,
    networkError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};