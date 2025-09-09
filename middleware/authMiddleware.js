import jwt from 'jsonwebtoken';
import connectDB from '../lib/db';
import User from '../models/User';

// Middleware untuk verifikasi token JWT
export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Token tidak ditemukan' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    await connectDB();
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User tidak ditemukan' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ message: 'Token tidak valid' });
  }
};

// Middleware untuk verifikasi role admin
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang diizinkan.' });
    }

    next();
  } catch (error) {
    console.error('Admin verification error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Middleware untuk verifikasi role user atau admin
export const requireAuth = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    next();
  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Utility function untuk mengekstrak user dari token (untuk client-side)
export const getUserFromToken = (token) => {
  try {
    if (!token) return null;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
};

// Utility function untuk cek apakah user sudah login (untuk client-side)
export const isAuthenticated = () => {
  if (typeof window === 'undefined') return false;
  
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  return !!(token && user);
};

// Utility function untuk cek apakah user adalah admin (untuk client-side)
export const isAdmin = () => {
  if (typeof window === 'undefined') return false;
  
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role === 'admin';
  } catch (error) {
    return false;
  }
};

// Utility function untuk logout (untuk client-side)
export const logout = () => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/auth';
};

// Higher-order component untuk protected pages
export const withAuth = (WrappedComponent, requireAdminRole = false) => {
  return function AuthenticatedComponent(props) {
    const { useEffect, useState } = require('react');
    const { useRouter } = require('next/router');
    
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const router = useRouter();

    useEffect(() => {
      const checkAuth = () => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (!token || !userStr) {
          router.push('/auth');
          return;
        }

        try {
          const user = JSON.parse(userStr);
          
          if (requireAdminRole && user.role !== 'admin') {
            router.push('/');
            return;
          }
          
          setIsAuthorized(true);
        } catch (error) {
          console.error('Auth check error:', error);
          router.push('/auth');
        } finally {
          setIsLoading(false);
        }
      };

      checkAuth();
    }, [router]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!isAuthorized) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
};