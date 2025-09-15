// src/context/AuthContext.jsx
import React, { createContext, useContext, useState } from "react";
import { supabase } from "../utils/supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [networkError, setNetworkError] = useState(null);

  // 🔹 Login unificado (admin / teacher / student)
  const login = async (emailOrUsername, password) => {
    setNetworkError(null);

    try {
      // 1️⃣ Primero buscar en TEACHERS
      const { data: teacher, error: teacherError } = await supabase
        .from("teachers")
        .select("*")
        .or(`email.eq.${emailOrUsername},name.eq.${emailOrUsername}`)
        .eq("password", password)
        .maybeSingle();

      if (teacherError) throw teacherError;

      if (teacher) {
        const role = teacher.role || "teacher"; // si tiene role admin → admin
        setUser({ ...teacher, role });
        return { message: `Bienvenido ${role === "admin" ? "Administrador" : "Profesor"}` };
      }

      // 2️⃣ Si no está en teachers, buscar en STUDENTS
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("*")
        .or(`email.eq.${emailOrUsername},username.eq.${emailOrUsername}`)
        .eq("password", password)
        .maybeSingle();

      if (studentError) throw studentError;

      if (student) {
        setUser({ ...student, role: "student" });
        return { message: "Bienvenido Estudiante" };
      }

      // 3️⃣ Si no se encontró en ningún lado
      throw new Error("Credenciales inválidas.");
    } catch (err) {
      console.error("Error en login:", err.message);
      setNetworkError("Error de conexión o credenciales inválidas.");
      throw err;
    }
  };

  // 🔹 Registro de profesores
  const registerTeacher = async (name, email, password) => {
    try {
      const { data, error } = await supabase.from("teachers").insert([
        {
          name,
          email,
          password,
          role: "teacher",
          is_active: true,
        },
      ]);

      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Error al registrar profesor:", err.message);
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        networkError,
        login,
        registerTeacher,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
