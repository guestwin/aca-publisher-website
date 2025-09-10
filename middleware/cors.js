// CORS Configuration Middleware
// Mengatur Cross-Origin Resource Sharing dengan keamanan yang tepat

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001', 
  'https://acapubweb.com',
  'https://www.acapubweb.com',
  // Tambahkan domain production lainnya sesuai kebutuhan
];

// Development mode - izinkan semua origin untuk development
if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push('http://localhost:3000');
  allowedOrigins.push('http://127.0.0.1:3000');
}

const corsOptions = {
  origin: function (origin, callback) {
    // Izinkan requests tanpa origin (mobile apps, postman, dll)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Tidak diizinkan oleh CORS policy'));
    }
  },
  credentials: true, // Izinkan cookies dan credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-CSRF-Token'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 hours - cache preflight response
  optionsSuccessStatus: 200 // untuk legacy browser support
};

// Middleware function untuk Next.js API routes
export const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    // Check if origin is allowed
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
      res.setHeader('Access-Control-Allow-Methods', corsOptions.methods.join(', '));
      res.setHeader('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(', '));
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', corsOptions.maxAge);
      return res.status(200).end();
    } else {
      return res.status(403).json({ error: 'CORS policy violation' });
    }
  }
  
  // Handle actual requests
  if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Expose-Headers', corsOptions.exposedHeaders.join(', '));
  }
  
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  if (next) {
    next();
  }
};

// Wrapper function untuk API routes
export const withCors = (handler) => {
  return async (req, res) => {
    return new Promise((resolve, reject) => {
      corsMiddleware(req, res, (result) => {
        if (result instanceof Error) {
          return reject(result);
        }
        return resolve(handler(req, res));
      });
    });
  };
};

// Helper function untuk cek origin yang diizinkan
export const isOriginAllowed = (origin) => {
  if (!origin) return true; // Allow requests without origin
  if (process.env.NODE_ENV === 'development') return true;
  return allowedOrigins.includes(origin);
};

// Configuration untuk berbagai environment
export const getCorsConfig = () => {
  return {
    development: {
      origin: true, // Allow all origins in development
      credentials: true
    },
    production: {
      origin: allowedOrigins,
      credentials: true
    },
    test: {
      origin: true,
      credentials: false
    }
  }[process.env.NODE_ENV] || corsOptions;
};

export default corsMiddleware;