import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Copy, Check } from 'lucide-react';
import { useToast } from '../../../ui/Toast';

const InviteCodeBanner = ({ group }) => {
  const { addToast } = useToast();
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = async () => {
    const groupCode = group?.invite_code || group?.id?.substring(0, 8).toUpperCase();
    try {
      await navigator.clipboard.writeText(groupCode);
      setCopiedCode(true);
      addToast('Código copiado al portapapeles', 'success');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      addToast('Error al copiar el código', 'error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, type: "spring" }}
      className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-[1.5px] shadow-md"
    >
      <div className="bg-white rounded-xl p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <div className="flex-shrink-0 p-1.5 sm:p-2 bg-blue-100 rounded-lg">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold text-gray-600 mb-0.5 sm:mb-1">
              Código de Invitación
            </p>
            <p className="text-lg sm:text-xl font-bold text-blue-600 font-mono tracking-wider truncate">
              {group?.invite_code || group?.id?.substring(0, 8).toUpperCase() || 'N/A'}
            </p>
          </div>
        </div>
        <button
          onClick={handleCopyCode}
          className={`w-full flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 ${
            copiedCode
              ? 'bg-emerald-500 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {copiedCode ? (
            <>
              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>¡Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Copiar Código</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default InviteCodeBanner;

