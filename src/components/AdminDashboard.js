import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import AdminPanel from './AdminPanel';

const AdminDashboard = () => {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTeachers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('teachers')
            .select('*')
            .order('name', { ascending: true });

        if (!error) {
            setTeachers(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <AdminPanel
                teachers={teachers}
                onTeacherStatusChange={fetchTeachers}
            />
        </div>
    );
};

export default AdminDashboard;