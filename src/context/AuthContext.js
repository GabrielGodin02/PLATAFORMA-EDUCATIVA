// src/context/AuthContext.js
import React, { createContext, useState, useContext } from "react";
import { supabase } from "../utils/supabaseClient";
import bcrypt from "bcryptjs";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState(null);

  const handleError = (err) => {
    console.error("Auth operation failed:", err);
    setNetworkError(err.message);
  };

  // 🔹 LOGIN con bcrypt
  const login = async (emailOrUsername, password) => {
    setLoading(true);
    setNetworkError(null);

    try {
      let foundUser = null;
      let role = null;

      // Buscar Admin
      const { data: adminData } = await supabase
        .from("admins")
        .select("*")
        .eq("email", emailOrUsername)
        .single();

      if (adminData && (await bcrypt.compare(password, adminData.password))) {
        foundUser = adminData;
        role = "admin";
      } else {
        // Buscar Teacher
        const { data: teacherData } = await supabase
          .from("teachers")
          .select("*")
          .eq("email", emailOrUsername)
          .single();

        if (
          teacherData &&
          (await bcrypt.compare(password, teacherData.password))
        ) {
          if (!teacherData.is_active) {
            throw new Error(
              "Tu cuenta de profesor está desactivada. Contacta al administrador."
            );
          }
          foundUser = teacherData;
          role = "teacher";
        } else {
          // Buscar Student
          const { data: studentData } = await supabase
            .from("students")
            .select("*")
            .eq("username", emailOrUsername)
            .single();

          if (
            studentData &&
            (await bcrypt.compare(password, studentData.password))
          ) {
            foundUser = studentData;
            role = "student";
          }
        }
      }

      if (foundUser) {
        setUser({ ...foundUser, role });
        return { message: "Inicio de sesión exitoso." };
      } else {
        throw new Error("Credenciales incorrectas.");
      }
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 LOGOUT
  const logout = async () => {
    setUser(null);
  };

  // 🔹 REGISTRO ADMIN
  const registerAdmin = async (name, email, password) => {
    setLoading(true);
    setNetworkError(null);
    try {
      const newId = crypto.randomUUID();
      const hashedPassword = await bcrypt.hash(password, 10);

      const { data, error } = await supabase
        .from("admins")
        .insert([{ id: newId, name, email, password: hashedPassword }])
        .select()
        .single();

      if (error) throw error;

      return {
        message: "Registro de admin exitoso.",
        user: { ...data, role: "admin" },
      };
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 REGISTRO TEACHER
  const registerTeacher = async (name, email, password) => {
    setLoading(true);
    setNetworkError(null);
    try {
      const newId = crypto.randomUUID();
      const hashedPassword = await bcrypt.hash(password, 10);

      const { data, error } = await supabase
        .from("teachers")
        .insert([
          {
            id: newId,
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
        message: "Registro de profesor exitoso.",
        user: { ...data, role: "teacher" },
      };
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 REGISTRO STUDENT
  const registerStudent = async (username, password) => {
    setLoading(true);
    setNetworkError(null);
    try {
      const newId = crypto.randomUUID();
      const hashedPassword = await bcrypt.hash(password, 10);

      const { data, error } = await supabase
        .from("students")
        .insert([{ id: newId, username, password: hashedPassword }])
        .select()
        .single();

      if (error) throw error;

      return {
        message: "Registro de estudiante exitoso.",
        user: { ...data, role: "student" },
      };
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    login,
    logout,
    registerAdmin,
    registerTeacher,
    registerStudent,
    loading,
    networkError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
