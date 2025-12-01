export const formatNumber = (value) => {
  if (Number.isNaN(value) || value === undefined || value === null) {
    return '0';
  }
  return new Intl.NumberFormat('es-CL').format(value);
};

export const formatDateTime = (value) => {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

export const translateSessionStatus = (status) => {
  const statusMap = {
    scheduled: 'Programada',
    in_progress: 'En progreso',
    completed: 'Completada',
    cancelled: 'Cancelada',
    pending: 'Pendiente',
    active: 'Activa',
    inactive: 'Inactiva',
  };
  return statusMap[status?.toLowerCase()] || status || 'Programada';
};

