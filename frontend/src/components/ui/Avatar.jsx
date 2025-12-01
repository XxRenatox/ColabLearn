import React, { useState } from 'react';
import { User } from 'lucide-react';

/**
 * Genera un gradiente de color único basado en un string (userId, nombre, etc.)
 */
const generateGradient = (seed) => {
  // Convertir el string a un número para generar colores consistentes
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generar colores HSL para gradientes más vibrantes
  const hue1 = Math.abs(hash % 360);
  const hue2 = (hue1 + 60) % 360; // Color complementario
  
  // Saturación y luminosidad para colores agradables
  const saturation = 65 + (Math.abs(hash) % 20); // 65-85%
  const lightness1 = 45 + (Math.abs(hash >> 8) % 15); // 45-60%
  const lightness2 = 55 + (Math.abs(hash >> 16) % 15); // 55-70%

  return `linear-gradient(135deg, hsl(${hue1}, ${saturation}%, ${lightness1}%), hsl(${hue2}, ${saturation}%, ${lightness2}%))`;
};

/**
 * Extrae las iniciales de un nombre
 */
const getInitials = (name) => {
  if (!name) return 'U';
  
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  return name.charAt(0).toUpperCase();
};

/**
 * Componente Avatar con DiceBear API y fallback a iniciales con gradiente
 * 
 * @param {Object} props
 * @param {string} props.userId - ID del usuario (para generar avatar único)
 * @param {string} props.name - Nombre del usuario (para iniciales)
 * @param {string} props.avatar - Avatar personalizado del usuario (opcional, si existe en DB)
 * @param {string} props.size - Tamaño: 'xs', 'sm', 'md', 'lg', 'xl' o número en px
 * @param {string} props.style - Estilo de DiceBear (deprecated, usar avatarStyle)
 * @param {string} props.avatarStyle - Estilo de DiceBear guardado en DB: 'adventurer', 'avataaars', 'big-smile', 'bottts', 'fun-emoji', 'icons', 'identicon', 'lorelei', 'micah', 'miniavs', 'open-peeps', 'personas', 'pixel-art', 'shapes', 'thumbs', o null para usar iniciales
 * @param {string} props.className - Clases CSS adicionales
 * @param {boolean} props.showBorder - Mostrar borde
 */
const Avatar = ({ 
  userId, 
  name = 'Usuario', 
  avatar = null, // Avatar personalizado de la DB (opcional)
  size = 'md',
  style = 'adventurer', // Estilo por defecto de DiceBear (deprecated)
  avatarStyle = null, // Estilo guardado en DB (prioridad sobre style)
  className = '',
  showBorder = false
}) => {
  const [imageError, setImageError] = useState(false);
  const [dicebearError, setDicebearError] = useState(false);

  // Tamaños predefinidos
  const sizeMap = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
  };

  const sizeClass = typeof size === 'number' 
    ? `w-${size} h-${size}` 
    : sizeMap[size] || sizeMap.md;

  const initials = getInitials(name);
  const gradient = generateGradient(userId || name);

  // Si hay avatar personalizado en la DB, usarlo primero
  const avatarUrl = avatar || null;

  // Determinar el estilo a usar: avatarStyle (de DB) tiene prioridad sobre style (deprecated)
  // Si avatarStyle es null explícitamente, usar iniciales (no mostrar DiceBear)
  // Si avatarStyle es undefined, usar el estilo por defecto (style)
  const effectiveStyle = avatarStyle !== null && avatarStyle !== undefined ? avatarStyle : style;
  
  // Solo usar DiceBear si avatarStyle no es null explícitamente
  // Si es undefined, también usar DiceBear con el estilo por defecto
  const shouldUseDicebear = avatarStyle !== null;

  // URL de DiceBear (solo si no hay avatar personalizado, hay estilo definido, y no hubo error)
  const dicebearUrl = !avatarUrl && !dicebearError && userId && shouldUseDicebear
    ? `https://api.dicebear.com/7.x/${effectiveStyle}/svg?seed=${encodeURIComponent(userId)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
    : null;

  // Determinar qué mostrar
  const showDicebear = dicebearUrl && !imageError && shouldUseDicebear;
  const showInitials = !showDicebear || dicebearError || !shouldUseDicebear;

  return (
    <div 
      className={`
        ${sizeClass}
        rounded-full
        flex items-center justify-center
        flex-shrink-0
        overflow-hidden
        ${showBorder ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-50' : ''}
        ${className}
      `}
      style={showInitials ? { background: gradient } : {}}
      title={name}
    >
      {showDicebear ? (
        <img
          src={dicebearUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => {
            setDicebearError(true);
            setImageError(true);
          }}
          onLoad={() => setImageError(false)}
        />
      ) : showInitials ? (
        <span className="font-semibold text-white select-none">
          {initials}
        </span>
      ) : (
        <User className="w-1/2 h-1/2 text-white opacity-80" />
      )}
    </div>
  );
};

export default Avatar;

