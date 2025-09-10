// Image optimization utilities

/**
 * Compress image file
 * @param {File} file - Image file to compress
 * @param {Object} options - Compression options
 * @returns {Promise<File>} Compressed image file
 */
export const compressImage = async (file, options = {}) => {
  const {
    quality = 0.8,
    maxWidth = 1920,
    maxHeight = 1080,
    format = 'webp'
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: `image/${format}`,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        `image/${format}`,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Convert image to WebP format
 * @param {File} file - Image file to convert
 * @param {number} quality - WebP quality (0-1)
 * @returns {Promise<File>} WebP image file
 */
export const convertToWebP = async (file, quality = 0.8) => {
  return compressImage(file, { format: 'webp', quality });
};

/**
 * Generate responsive image sizes
 * @param {File} file - Original image file
 * @param {Array} sizes - Array of width sizes
 * @returns {Promise<Array>} Array of resized images
 */
export const generateResponsiveSizes = async (file, sizes = [640, 828, 1200, 1920]) => {
  const promises = sizes.map(size => 
    compressImage(file, { maxWidth: size, maxHeight: size })
  );
  
  return Promise.all(promises);
};

/**
 * Create blur placeholder for image
 * @param {File} file - Image file
 * @returns {Promise<string>} Base64 blur placeholder
 */
export const createBlurPlaceholder = async (file) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Create small blurred version
      canvas.width = 10;
      canvas.height = 10;
      
      ctx.filter = 'blur(2px)';
      ctx.drawImage(img, 0, 0, 10, 10);
      
      const blurDataURL = canvas.toDataURL('image/jpeg', 0.1);
      resolve(blurDataURL);
    };

    img.onerror = () => reject(new Error('Failed to create blur placeholder'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Validate image file
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateImage = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
    minWidth = 100,
    minHeight = 100
  } = options;

  const errors = [];

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`);
  }

  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum ${(maxSize / 1024 / 1024).toFixed(2)}MB`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Get image dimensions
 * @param {File} file - Image file
 * @returns {Promise<Object>} Image dimensions
 */
export const getImageDimensions = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight
      });
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Batch process images
 * @param {FileList} files - List of image files
 * @param {Object} options - Processing options
 * @returns {Promise<Array>} Processed images
 */
export const batchProcessImages = async (files, options = {}) => {
  const fileArray = Array.from(files);
  const results = [];

  for (const file of fileArray) {
    try {
      // Validate
      const validation = validateImage(file, options);
      if (!validation.isValid) {
        results.push({
          original: file,
          error: validation.errors.join(', '),
          success: false
        });
        continue;
      }

      // Get dimensions
      const dimensions = await getImageDimensions(file);
      
      // Compress
      const compressed = await compressImage(file, options);
      
      // Create blur placeholder
      const blurPlaceholder = await createBlurPlaceholder(file);

      results.push({
        original: file,
        compressed,
        dimensions,
        blurPlaceholder,
        success: true,
        compressionRatio: ((file.size - compressed.size) / file.size * 100).toFixed(2)
      });
    } catch (error) {
      results.push({
        original: file,
        error: error.message,
        success: false
      });
    }
  }

  return results;
};

/**
 * Progressive image loading utility
 * @param {string} src - Image source URL
 * @param {string} placeholder - Placeholder image URL
 * @returns {Promise<HTMLImageElement>} Loaded image element
 */
export const loadImageProgressively = (src, placeholder) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Load placeholder first
    if (placeholder) {
      const placeholderImg = new Image();
      placeholderImg.src = placeholder;
    }
    
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

export default {
  compressImage,
  convertToWebP,
  generateResponsiveSizes,
  createBlurPlaceholder,
  validateImage,
  getImageDimensions,
  batchProcessImages,
  loadImageProgressively
};