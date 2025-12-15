import React, { useState, useEffect } from 'react';
import { Save, MapPin, GraduationCap, Calendar, User, AlertCircle } from 'lucide-react';
import { usersAPI } from '../../../../services/api';
import { useApp } from '../../../../contexts/AppContext';
import { useToast } from '../../../ui/Toast';

export default function ProfileEditSettings() {
    const { user, updateUser } = useApp();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    const [profileData, setProfileData] = useState({
        name: '',
        university: '',
        career: '',
        semester: '',
    });

    useEffect(() => {
        if (user) {
            setProfileData({
                name: user.name || '',
                university: user.university || '',
                career: user.career || '',
                semester: user.semester || '',
            });
        }
    }, [user]);

    const handleProfileChange = (field, value) => {
        setProfileData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            const updatePayload = {
                ...(profileData.name && { name: profileData.name.trim() }),
                ...(profileData.university && { university: profileData.university.trim() }),
                ...(profileData.career && { career: profileData.career.trim() }),
                ...(profileData.semester && { semester: profileData.semester.trim() }),
            };

            const response = await usersAPI.updateProfile(updatePayload);

            if (response.success) {
                showToast('Perfil actualizado exitosamente', 'success');
                if (updateUser) {
                    await updateUser();
                }
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error ||
                error.response?.data?.message ||
                error.message ||
                'Error al actualizar el perfil';
            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Nombre */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Nombre completo
                </label>
                <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Tu nombre"
                />
            </div>

            {/* Universidad */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Universidad
                </label>
                <input
                    type="text"
                    value={profileData.university}
                    onChange={(e) => handleProfileChange('university', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Nombre de tu universidad"
                />
            </div>

            {/* Carrera */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    Carrera
                </label>
                <input
                    type="text"
                    value={profileData.career}
                    onChange={(e) => handleProfileChange('career', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Tu carrera o programa de estudios"
                />
            </div>

            {/* Semestre */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Semestre
                </label>
                <input
                    type="text"
                    value={profileData.semester}
                    onChange={(e) => handleProfileChange('semester', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Ej: 5, 6to, 3er"
                />
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Save className="w-4 h-4" />
                    {loading ? 'Guardando...' : 'Guardar Información'}
                </button>
            </div>
        </div>
    );
}
