export function needsPreferences(user) {
  if (!user) return true;

  const noPreferences =
    !user.preferences || Object.keys(user.preferences).length === 0;

  const missingAcademic =
    !user.university || !user.career || !user.semester;

  return noPreferences || missingAcademic;
}

// Validaciones y sanitización de inputs de autenticación

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const NAME_ALLOWED_REGEX = /[^a-zA-ZÀ-ÿ\u00f1\u00d1'`\-\s]/g; // letras, acentos, ñ, apóstrofe, guion y espacios

export function normalizeEmail(email) {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
}

export function sanitizeName(name) {
  if (typeof name !== "string") return "";
  // colapsar espacios, remover caracteres no permitidos
  return name.replace(NAME_ALLOWED_REGEX, "").replace(/\s+/g, " ").trim();
}

export function isStrongPassword(password) {
  if (typeof password !== "string") return false;
  // 8+ chars, al menos una minúscula, una mayúscula, un número y un símbolo
  const lengthOk = password.length >= 8 && password.length <= 128;
  const lowerOk = /[a-z]/.test(password);
  const upperOk = /[A-Z]/.test(password);
  const digitOk = /\d/.test(password);
  const specialOk = /[^A-Za-z0-9]/.test(password);
  const noSpaces = !/\s/.test(password);
  return lengthOk && lowerOk && upperOk && digitOk && specialOk && noSpaces;
}

export function validateEmail(email) {
  const cleaned = normalizeEmail(email);
  if (!cleaned) return { valid: false, value: cleaned, error: "El correo es obligatorio" };
  if (cleaned.length > 254) return { valid: false, value: cleaned, error: "El correo es demasiado largo" };
  if (!EMAIL_REGEX.test(cleaned)) return { valid: false, value: cleaned, error: "El correo no tiene un formato válido" };
  return { valid: true, value: cleaned };
}

export function validatePassword(password) {
  if (!password) return { valid: false, error: "La contraseña es obligatoria" };
  if (!isStrongPassword(password)) {
    return {
      valid: false,
      error:
        "La contraseña debe tener 8+ caracteres, mayúscula, minúscula, número y símbolo, sin espacios",
    };
  }
  return { valid: true };
}

export function validateNameFields(firstName, lastName) {
  const first = sanitizeName(firstName);
  const last = sanitizeName(lastName);

  if (!first || !last) {
    return { valid: false, first, last, error: "Nombre y apellido son obligatorios" };
  }
  if (first.length < 2 || last.length < 2) {
    return { valid: false, first, last, error: "Nombre y apellido deben tener al menos 2 caracteres" };
  }
  if (first.length > 60 || last.length > 60) {
    return { valid: false, first, last, error: "Nombre o apellido demasiado largo" };
  }
  return { valid: true, first, last };
}

export function validateLoginInput({ email, password }) {
  const errors = [];
  const emailRes = validateEmail(email);
  if (!emailRes.valid) errors.push(emailRes.error);
  if (!password) {
    errors.push("La contraseña es obligatoria");
  } else if (password.length > 128) {
    errors.push("La contraseña es demasiado larga");
  }

  return {
    valid: errors.length === 0,
    errors,
    data: {
      email: emailRes.value || "",
      password,
    },
  };
}

export function validateRegisterInput({ email, password, confirmPassword, firstName, lastName, agreeToTerms }) {
  const errors = [];

  const emailRes = validateEmail(email);
  if (!emailRes.valid) errors.push(emailRes.error);

  // Contraseña y confirmación
  const passRes = validatePassword(password);
  if (!passRes.valid) errors.push(passRes.error);
  if (!confirmPassword) errors.push("Debes confirmar tu contraseña");
  if (password && confirmPassword && password !== confirmPassword) {
    errors.push("Las contraseñas no coinciden");
  }

  // Nombres
  const namesRes = validateNameFields(firstName, lastName);
  if (!namesRes.valid) errors.push(namesRes.error);

  // Términos
  if (!agreeToTerms) errors.push("Debes aceptar los términos y condiciones");

  // Comunes: negar contraseñas muy comunes
  const tooCommon = [
    "password",
    "12345678",
    "qwerty123",
    "contraseña",
    "colablearn",
  ];
  if (typeof password === "string" && tooCommon.includes(password.toLowerCase())) {
    errors.push("La contraseña es demasiado común");
  }

  return {
    valid: errors.length === 0,
    errors,
    data: {
      email: emailRes.value || "",
      password,
      name: `${namesRes.first || ""} ${namesRes.last || ""}`.trim(),
      avatar: "👤",
    },
  };
}