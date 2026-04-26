import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Save, X } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';

const PrioritySubjects = ({ students }) => {
    const { user } = useAuth();
    const [allSubjects, setAllSubjects] = useState([]);
    const [prioritySubjects, setPrioritySubjects] = useState([]);
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    // Cargar todas las materias únicas del profesor
    useEffect(() => {
        const fetchSubjects = async () => {
            const { data } = await supabase
                .from('subjects')
                .select('name')
                .in('student_id', students.map(s => s.id));

            if (data) {
                const unique = [...new Set(data.map(s => s.name))];
                setAllSubjects(unique);
            }
        };

        // Cargar materias prioritarias guardadas
        const fetchPriority = async () => {
            const { data } = await supabase
                .from('teachers')
                .select('priority_subjects')
                .eq('id', user.id)
                .single();

            if (data?.priority_subjects) {
                setPrioritySubjects(data.priority_subjects);
            }
        };

        if (students.length > 0) {
            fetchSubjects();
            fetchPriority();
        }
    }, [students]);

    const toggleSubject = (subject) => {
        setPrioritySubjects(prev =>
            prev.includes(subject)
                ? prev.filter(s => s !== subject)
                : [...prev, subject]
        );
    };

    const handleSave = async () => {
        setLoading(true);
        const { error } = await supabase
            .from('teachers')
            .update({ priority_subjects: prioritySubjects })
            .eq('id', user.id);

        if (!error) {
            setSuccess('Materias prioritarias guardadas.');
            setTimeout(() => setSuccess(''), 3000);
        }
        setLoading(false);
    };

    return (
        <motion.div
            className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl">
                    <Star className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Materias Prioritarias</h2>
                    <p className="text-gray-600">Selecciona las materias que desempatan el ranking</p>
                </div>
            </div>

            {allSubjects.length === 0 ? (
                <p className="text-gray-500">No hay materias registradas aún.</p>
            ) : (
                <div className="flex flex-wrap gap-3 mb-6">
                    {allSubjects.map(subject => (
                        <motion.button
                            key={subject}
                            onClick={() => toggleSubject(subject)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium border transition-all duration-300 ${
                                prioritySubjects.includes(subject)
                                    ? 'bg-yellow-400 border-yellow-500 text-white shadow-md'
                                    : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Star className={`w-4 h-4 ${prioritySubjects.includes(subject) ? 'fill-white' : ''}`} />
                            {subject}
                            {prioritySubjects.includes(subject) && (
                                <X className="w-3 h-3" />
                            )}
                        </motion.button>
                    ))}
                </div>
            )}

            {prioritySubjects.length > 0 && (
                <p className="text-sm text-gray-500 mb-4">
                    Prioritarias seleccionadas: <span className="font-semibold text-yellow-600">{prioritySubjects.join(', ')}</span>
                </p>
            )}

            {success && (
                <p className="text-green-600 text-sm mb-4">{success}</p>
            )}

            <motion.button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <Save className="w-5 h-5" />
                {loading ? 'Guardando...' : 'Guardar Materias Prioritarias'}
            </motion.button>
        </motion.div>
    );
};

export default PrioritySubjects;