const normalizeText = (value = '') =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const messagePatterns = [
  {
    test: ({ status }) => status === 0,
    message:
      'No pudimos conectarnos con el servidor. Revisa tu conexión a internet e inténtalo nuevamente.',
  },
  {
    test: ({ status }) => status === 401,
    message:
      'Tu sesión expiró o las credenciales no son válidas. Vuelve a iniciar sesión para continuar.',
  },
  {
    test: ({ status }) => status === 403,
    message:
      'No tienes permisos para realizar esta acción. Si crees que es un error, contáctanos.',
  },
  {
    test: ({ status }) => status === 404,
    message:
      'No encontramos la información que buscabas. Es posible que haya sido movida o eliminada.',
  },
  {
    test: ({ status }) => status >= 500 && status < 600,
    message:
      'Estamos experimentando dificultades en nuestros servidores. Intenta de nuevo en unos minutos.',
  },
  {
    test: ({ message }) =>
      normalizeText(message).includes('credenciales inválidas') ||
      normalizeText(message).includes('contraseña incorrecta'),
    message:
      'El correo o la contraseña no coinciden con nuestros registros. Revisa los datos e inténtalo otra vez.',
  },
  {
    test: ({ message }) =>
      normalizeText(message).includes('usuario ya existe') ||
      normalizeText(message).includes('ya existe una cuenta'),
    message:
      'Ya existe una cuenta registrada con este correo. Prueba iniciar sesión o recuperar tu contraseña.',
  },
  {
    test: ({ message }) =>
      normalizeText(message).includes('backend no esta funcionando') ||
      normalizeText(message).includes('backend no está funcionando'),
    message:
      'No pudimos procesar tu solicitud en este momento. Intenta nuevamente en un momento.',
  },
  {
    test: ({ message }) =>
      normalizeText(message).includes('cuenta desactivada'),
    message:
      'Tu cuenta está desactivada temporalmente. Ponte en contacto con el equipo de soporte para reactivarla.',
  },
  {
    test: ({ message }) =>
      normalizeText(message).includes('token inválido') ||
      normalizeText(message).includes('token invalido'),
    message:
      'Hubo un problema con tu sesión. Vuelve a iniciar sesión para continuar.',
  },
];

export const getFriendlyErrorMessage = (error = {}) => {
  const status = error.status ?? error.code ?? 0;
  const message =
    error.message ||
    error.error ||
    error.description ||
    error.title ||
    '';

  const matchedPattern = messagePatterns.find((pattern) =>
    pattern.test({ status, message })
  );

  if (matchedPattern) {
    return matchedPattern.message;
  }

  if (status === 400) {
    return (
      message ||
      'Hay información pendiente o incorrecta. Revisa los datos ingresados e inténtalo nuevamente.'
    );
  }

  return (
    message ||
    'Ocurrió un problema inesperado. Estamos trabajando para resolverlo, por favor intenta más tarde.'
  );
};

export const buildError = (error = {}) => {
  const friendlyMessage = getFriendlyErrorMessage(error);
  const enhancedError = new Error(friendlyMessage);

  if (error.status) {
    enhancedError.status = error.status;
  }

  if (error.errors) {
    enhancedError.details = error.errors;
  }

  enhancedError.original = error;

  return enhancedError;
};

