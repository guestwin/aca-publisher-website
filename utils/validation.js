import validator from 'validator';
import DOMPurify from 'isomorphic-dompurify';

// Email validation
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, message: 'Email harus berupa string yang valid' };
  }
  
  if (!validator.isEmail(email)) {
    return { isValid: false, message: 'Format email tidak valid' };
  }
  
  return { isValid: true, sanitized: validator.normalizeEmail(email) };
};

// Password validation
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, message: 'Password harus berupa string' };
  }
  
  if (password.length < 8) {
    return { isValid: false, message: 'Password minimal 8 karakter' };
  }
  
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return { isValid: false, message: 'Password harus mengandung huruf besar, huruf kecil, dan angka' };
  }
  
  return { isValid: true };
};

// Name validation
export const validateName = (name) => {
  if (!name || typeof name !== 'string') {
    return { isValid: false, message: 'Nama harus berupa string' };
  }
  
  const sanitized = DOMPurify.sanitize(name.trim());
  
  if (sanitized.length < 2 || sanitized.length > 50) {
    return { isValid: false, message: 'Nama harus antara 2-50 karakter' };
  }
  
  if (!/^[a-zA-Z\s]+$/.test(sanitized)) {
    return { isValid: false, message: 'Nama hanya boleh mengandung huruf dan spasi' };
  }
  
  return { isValid: true, sanitized };
};

// Phone validation
export const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, message: 'Nomor telepon harus berupa string' };
  }
  
  const sanitized = phone.replace(/\D/g, ''); // Remove non-digits
  
  if (sanitized.length < 10 || sanitized.length > 15) {
    return { isValid: false, message: 'Nomor telepon harus antara 10-15 digit' };
  }
  
  return { isValid: true, sanitized };
};

// Price validation
export const validatePrice = (price) => {
  const numPrice = parseFloat(price);
  
  if (isNaN(numPrice) || numPrice < 0) {
    return { isValid: false, message: 'Harga harus berupa angka positif' };
  }
  
  if (numPrice > 999999999) {
    return { isValid: false, message: 'Harga terlalu besar' };
  }
  
  return { isValid: true, sanitized: numPrice };
};

// Text content validation (for descriptions, etc.)
export const validateTextContent = (text, minLength = 1, maxLength = 1000) => {
  if (!text || typeof text !== 'string') {
    return { isValid: false, message: 'Teks harus berupa string' };
  }
  
  const sanitized = DOMPurify.sanitize(text.trim());
  
  if (sanitized.length < minLength || sanitized.length > maxLength) {
    return { isValid: false, message: `Teks harus antara ${minLength}-${maxLength} karakter` };
  }
  
  return { isValid: true, sanitized };
};

// MongoDB ObjectId validation
export const validateObjectId = (id) => {
  if (!id || typeof id !== 'string') {
    return { isValid: false, message: 'ID harus berupa string' };
  }
  
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    return { isValid: false, message: 'Format ID tidak valid' };
  }
  
  return { isValid: true, sanitized: id };
};

// URL validation
export const validateURL = (url) => {
  if (!url || typeof url !== 'string') {
    return { isValid: false, message: 'URL harus berupa string' };
  }
  
  if (!validator.isURL(url, { protocols: ['http', 'https'] })) {
    return { isValid: false, message: 'Format URL tidak valid' };
  }
  
  return { isValid: true, sanitized: url };
};

// General sanitization for HTML content
export const sanitizeHTML = (html) => {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: []
  });
};

// Validate and sanitize user input object
export const validateUserInput = (userData) => {
  const errors = [];
  const sanitized = {};
  
  // Validate name
  if (userData.name !== undefined) {
    const nameResult = validateName(userData.name);
    if (!nameResult.isValid) {
      errors.push(nameResult.message);
    } else {
      sanitized.name = nameResult.sanitized;
    }
  }
  
  // Validate email
  if (userData.email !== undefined) {
    const emailResult = validateEmail(userData.email);
    if (!emailResult.isValid) {
      errors.push(emailResult.message);
    } else {
      sanitized.email = emailResult.sanitized;
    }
  }
  
  // Validate phone
  if (userData.phone !== undefined) {
    const phoneResult = validatePhone(userData.phone);
    if (!phoneResult.isValid) {
      errors.push(phoneResult.message);
    } else {
      sanitized.phone = phoneResult.sanitized;
    }
  }
  
  // Validate password
  if (userData.password !== undefined) {
    const passwordResult = validatePassword(userData.password);
    if (!passwordResult.isValid) {
      errors.push(passwordResult.message);
    } else {
      sanitized.password = userData.password; // Don't sanitize password
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
};

// Validate product input
export const validateProductInput = (productData) => {
  const errors = [];
  const sanitized = {};
  
  // Validate title
  if (productData.title !== undefined) {
    const titleResult = validateTextContent(productData.title, 2, 100);
    if (!titleResult.isValid) {
      errors.push(titleResult.message);
    } else {
      sanitized.title = titleResult.sanitized;
    }
  }
  
  // Validate description
  if (productData.description !== undefined) {
    const descResult = validateTextContent(productData.description, 10, 2000);
    if (!descResult.isValid) {
      errors.push(descResult.message);
    } else {
      sanitized.description = descResult.sanitized;
    }
  }
  
  // Validate price
  if (productData.price !== undefined) {
    const priceResult = validatePrice(productData.price);
    if (!priceResult.isValid) {
      errors.push(priceResult.message);
    } else {
      sanitized.price = priceResult.sanitized;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
};