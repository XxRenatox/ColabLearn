import React, { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { usersAPI } from '../../../../services/api';
// Assuming you have a way to show toasts here.
// Since SettingsPage uses useToast from '../components/ui/Toast', we'll try to use it too.
// Check import path relative to 'frontend/src/components/ui/dashboard/sections/SecuritySettings.jsx'
// Toast is at 'frontend/src/components/ui/Toast.jsx'.
// So path is '../../../ui/Toast'.
import { useToast } from '../../../ui/Toast';

export default function SecuritySettings() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    // Estados del formulario de contraseña
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [passwordErrors, setPasswordErrors] = useState({});

    const handlePasswordChange = (field, value) => {
        setPasswordData(prev => ({
            ...prev,
            [field]: value
        }));
        // Limpiar errores al escribir
        if (passwordErrors[field]) {
            setPasswordErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const validatePassword = () => {
        const errors = {};

        if (!passwordData.currentPassword) {
            errors.currentPassword = 'La contraseña actual es requerida';
        }

        if (!passwordData.newPassword) {
            errors.newPassword = 'La nueva contraseña es requerida';
        } else if (passwordData.newPassword.length < 6) {
            errors.newPassword = 'La contraseña debe tener al menos 6 caracteres';
        }

        if (!passwordData.confirmPassword) {
            errors.confirmPassword = 'Confirma tu nueva contraseña';
        } else if (passwordData.newPassword !== passwordData.confirmPassword) {
            errors.confirmPassword = 'Las contraseñas no coinciden';
        }

        if (passwordData.currentPassword === passwordData.newPassword) {
            errors.newPassword = 'La nueva contraseña debe ser diferente a la actual';
        }

        setPasswordErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChangePassword = async () => {
        if (!validatePassword()) {
            showToast('Por favor, corrige los errores en el formulario', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await usersAPI.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
                confirmPassword: passwordData.confirmPassword,
            });

            if (response.success) {
                showToast('Contraseña actualizada exitosamente', 'success');
                // Limpiar formulario
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                });
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error ||
                error.response?.data?.message ||
                error.message ||
                'Error al cambiar la contraseña';
            showToast(errorMessage, 'error');

            // Si el error es sobre la contraseña actual, marcarlo
            if (errorMessage.toLowerCase().includes('actual')) {
                setPasswordErrors(prev => ({
                    ...prev,
                    currentPassword: errorMessage
                }));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Contraseña actual */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña actual
                </label>
                <div className="relative">
                    <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 ${passwordErrors.currentPassword ? 'border-red-300' : 'border-gray-300'
                            }`}
                        placeholder="Ingresa tu contraseña actual"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                        {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                </div>
                {passwordErrors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {passwordErrors.currentPassword}
                    </p>
                )}
            </div>

            {/* Nueva contraseña */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva contraseña
                </label>
                <div className="relative">
                    <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 ${passwordErrors.newPassword ? 'border-red-300' : 'border-gray-300'
                            }`}
                        placeholder="Mínimo 6 caracteres"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                        {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                </div>
                {passwordErrors.newPassword && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {passwordErrors.newPassword}
                    </p>
                )}
            </div>

            {/* Confirmar contraseña */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar nueva contraseña
                </label>
                <div className="relative">
                    <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 ${passwordErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                            }`}
                        placeholder="Confirma tu nueva contraseña"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                        {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                </div>
                {passwordErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {passwordErrors.confirmPassword}
                    </p>
                )}
                {passwordData.confirmPassword &&
                    passwordData.newPassword === passwordData.confirmPassword &&
                    !passwordErrors.confirmPassword && (
                        <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Las contraseñas coinciden
                        </p>
                    )}
            </div>

            {/* Info de seguridad */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                    <strong>Consejo de seguridad:</strong> Usa una contraseña única y segura.
                    Evita usar información personal fácil de adivinar.
                </p>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                    onClick={handleChangePassword}
                    disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Lock className="w-4 h-4" />
                    {loading ? 'Cambiando...' : 'Cambiar contraseña'}
                </button>
            </div>
        </div>
    );
}
