import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Users, Trash2, KeyRound, BookOpen } from "lucide-react";
import { supabase } from "../utils/supabaseClient";

const AdminPanel = ({ teachers, onTeacherStatusChange }) => {
  const [expandedTeacher, setExpandedTeacher] = useState(null);
  const [studentsByTeacher, setStudentsByTeacher] = useState({});
  const [loading, setLoading] = useState(null);

  // Expandir profesor y cargar sus estudiantes
  const toggleExpand = async (teacher) => {
    if (expandedTeacher === teacher.id) {
      setExpandedTeacher(null);
      return;
    }

    setExpandedTeacher(teacher.id);
    setLoading(teacher.id);

    // Traer estudiantes + materias/notas
    const { data: students, error } = await supabase
      .from("students")
      .select("id, name, grade_level, subjects(name, grades(score))") // <-- ajusta si tu relación es diferente
      .eq("teacher_id", teacher.id);

    if (!error) {
      setStudentsByTeacher((prev) => ({
        ...prev,
        [teacher.id]: students || [],
      }));
    }
    setLoading(null);
  };

  // Editar contraseña del profesor
  const updateTeacherPassword = async (teacherId) => {
    const newPassword = prompt("Ingrese la nueva contraseña:");
    if (!newPassword) return;

    const { error } = await supabase
      .from("teachers")
      .update({ password: newPassword })
      .eq("id", teacherId);

    if (error) {
      alert("Error al actualizar contraseña");
    } else {
      alert("Contraseña actualizada con éxito");
      onTeacherStatusChange();
    }
  };

  // Eliminar profesor y sus registros asociados
  const deleteTeacher = async (teacherId) => {
    if (!window.confirm("¿Seguro que deseas eliminar este profesor y todos sus estudiantes?")) return;

    // Borrar en cascada
    await supabase.from("students").delete().eq("teacher_id", teacherId);
    const { error } = await supabase.from("teachers").delete().eq("id", teacherId);

    if (error) {
      alert("Error al eliminar profesor");
    } else {
      alert("Profesor eliminado con éxito");
      onTeacherStatusChange();
    }
  };

  return (
    <motion.div
      className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-xl space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Users className="w-6 h-6 text-blue-600" />
        Panel de Administrador
      </h2>

      {teachers.length === 0 ? (
        <p className="text-gray-600">No hay profesores registrados.</p>
      ) : (
        <div className="space-y-4">
          {teachers.map((teacher) => (
            <motion.div
              key={teacher.id}
              className="border border-gray-200 rounded-xl p-4 bg-gray-50 shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Header del profesor */}
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => toggleExpand(teacher)}
              >
                <div>
                  <h3 className="font-semibold text-lg text-gray-800">{teacher.name}</h3>
                  <p className="text-sm text-gray-500">Usuario: {teacher.username}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateTeacherPassword(teacher.id);
                    }}
                    className="p-2 bg-yellow-100 hover:bg-yellow-200 rounded-lg text-yellow-700"
                  >
                    <KeyRound className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTeacher(teacher.id);
                    }}
                    className="p-2 bg-red-100 hover:bg-red-200 rounded-lg text-red-600"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  {expandedTeacher === teacher.id ? (
                    <ChevronUp className="w-6 h-6 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gray-600" />
                  )}
                </div>
              </div>

              {/* Estudiantes */}
              <AnimatePresence>
                {expandedTeacher === teacher.id && (
                  <motion.div
                    className="mt-4 pl-4 border-l-2 border-gray-200 space-y-3"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {loading === teacher.id ? (
                      <p className="text-gray-500">Cargando estudiantes...</p>
                    ) : studentsByTeacher[teacher.id]?.length > 0 ? (
                      studentsByTeacher[teacher.id].map((student) => (
                        <div
                          key={student.id}
                          className="p-3 bg-white rounded-lg shadow border border-gray-100"
                        >
                          <h4 className="font-semibold text-gray-800">
                            {student.name} ({student.grade_level})
                          </h4>
                          <ul className="mt-2 text-sm text-gray-600 space-y-1">
                            {student.subjects?.map((subj, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-blue-500" />
                                {subj.name} –{" "}
                                {subj.grades?.length > 0
                                  ? `${subj.grades[0].score}/5`
                                  : "Sin notas"}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">Este profesor no tiene estudiantes.</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default AdminPanel;
