import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, User, Calendar, Key, Search, BookOpen, Edit, Trash2, Trophy } from 'lucide-react';

const getRankingMedal = (ranking) => {
    if (ranking === 1) return { emoji: '🥇', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' };
    if (ranking === 2) return { emoji: '🥈', color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200' };
    if (ranking === 3) return { emoji: '🥉', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' };
    return { emoji: `#${ranking}`, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' };
};

const StudentList = ({ students = [], onStudentUpdated, onStudentDeleted, resultsPublished }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredStudents = students.filter(student =>
        (student.name && student.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (student.username && student.username.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (students.length === 0) {
        return (
            <motion.div
                className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-12 text-center shadow-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
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
                <div className="text-center py-12 text-gray-500">No se encontraron estudiantes.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStudents.map((student, index) => {
                        const medal = resultsPublished && student.ranking ? getRankingMedal(student.ranking) : null;
                        return (
                            <motion.div
                                key={student.id}
                                className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
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
                                    {/* Puesto */}
                                    {medal && (
                                        <div className={`flex items-center gap-1 px-3 py-1 rounded-full border text-sm font-bold ${medal.bg} ${medal.color}`}>
                                            <span>{medal.emoji}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Key className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-600">Usuario:</span>
                                        <span className="font-mono bg-gray-100 px-2 py-1 rounded text-gray-800">{student.username}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <BookOpen className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-600">Grado:</span>
                                        <span className="font-medium bg-gray-100 px-2 py-1 rounded text-gray-800">{student.grade_level || 'No especificado'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-600">Registrado:</span>
                                        <span className="text-gray-800">{new Date(student.created_at).toLocaleDateString()}</span>
                                    </div>
                                    {resultsPublished && student.ranking && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Trophy className="w-4 h-4 text-yellow-500" />
                                            <span className="text-gray-600">Puesto:</span>
                                            <span className="font-bold text-gray-800">{student.ranking}°</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium">Activo</span>
                                    <div className="flex gap-2">
                                        <motion.button
                                            onClick={() => onStudentDeleted(student.id)}
                                            className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </motion.button>
                                        <motion.button
                                            onClick={() => onStudentUpdated(student)}
                                            className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <Edit className="w-5 h-5" />
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
};

export default StudentList;