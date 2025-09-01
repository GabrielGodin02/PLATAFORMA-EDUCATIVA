import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, User, Calendar, Key, Search, Trash2 } from 'lucide-react'; // <-- Se agrega Trash2
import { useAuth } from './AuthContext'; // <-- Se importa el hook de autenticación

const StudentList = ({ students = [], fetchStudents }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const { deleteStudent } = useAuth(); // <-- Se obtiene la función de deleteStudent

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (studentId) => {
        // Llama a la función de eliminación y espera a que termine
        const result = await deleteStudent(studentId);

        // Si la eliminación fue exitosa (no se canceló), se recarga la lista
        if (result && result.message === 'Estudiante eliminado exitosamente.') {
            if (fetchStudents) {
                fetchStudents();
            }
        }
    };

    if (students.length === 0) {
        return (
            <motion.div 
                className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-12 text-center shadow-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="w-12 h-12 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">No hay estudiantes registrados</h3>
                <p className="text-gray-500">Comienza registrando tu primer estudiante en la pestaña "Registrar"</p>
            </motion.div>
        );
    }

    return (
        <motion.div 
            className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
                    <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Lista de Estudiantes</h2>
                    <p className="text-gray-600">{students.length} estudiante{students.length !== 1 ? 's' : ''} registrado{students.length !== 1 ? 's' : ''}</p>
                </div>
            </div>

            <div className="mb-6">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Buscar estudiante por nombre o usuario..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-300"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
            </div>

            {filteredStudents.length === 0 ? (
                <motion.div 
                    className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-12 text-center shadow-xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Search className="w-12 h-12 text-red-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">No se encontraron estudiantes</h3>
                    <p className="text-gray-500">Intenta ajustar tu búsqueda o registra nuevos estudiantes.</p>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStudents.map((student, index) => (
                        <motion.div
                            key={student.id}
                            className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            whileHover={{ scale: 1.02 }}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-100 rounded-xl">
                                    <User className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">{student.name}</h3>
                                    <p className="text-sm text-gray-500">Estudiante</p>
                                </div>
                                
                                {/* <-- El botón para eliminar estudiante --> */}
                                <button
                                    onClick={() => handleDelete(student.id)}
                                    className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                    title="Eliminar estudiante"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <Key className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-600">Usuario:</span>
                                    <span className="font-mono bg-gray-100 px-2 py-1 rounded text-gray-800">
                                        {student.username}
                                    </span>
                                </div>

                               

                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-600">Registrado:</span>
                                    <span className="text-gray-800">
                                        {new Date(student.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Estado:</span>
                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                                        Activo
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

export default StudentList;