import jwt from 'jsonwebtoken'; 
import { connectDB } from '../lib/db';
import User from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware untuk verifikasi token komposer
export const verifyComposerToken = async (req, res, next) => {
  try {
    const token = req.cookies.composer_token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Token tidak ditemukan' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    await connectDB();
    const user = await User.findById(decoded.userId);
    
    if (!user || user.role !== 'composer') {
      return res.status(401).json({ message: 'Akses ditolak' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ message: 'Token tidak valid' });
  }
};

// Utility function untuk mendapatkan user dari token
export const getComposerFromToken = async (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    await connectDB();
    const user = await User.findById(decoded.userId);
    
    if (!user || user.role !== 'composer') {
      return null;
    }
    
    return user;
  } catch (error) {
    return null;
  }
};

// HOC untuk proteksi halaman komposer
export const withComposerAuth = (WrappedComponent) => {
  return function ComposerProtectedRoute(props) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const router = useRouter();

    useEffect(() => {
      const checkAuth = async () => {
        try {
          const token = document.cookie
            .split('; ')
            .find(row => row.startsWith('composer_token='))
            ?.split('=')[1];

          if (!token) {
            router.push('/composer/login');
            return;
          }

          const response = await fetch('/api/composer/verify', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            setIsAuthenticated(true);
          } else {
            router.push('/composer/login');
          }
        } catch (error) {
          console.error('Auth check error:', error);
          router.push('/composer/login');
        } finally {
          setIsLoading(false);
        }
      };

      checkAuth();
    }, []);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <WrappedComponent {...props} user={user} />;
  };
};

// Logout function
export const logoutComposer = () => {
  document.cookie = 'composer_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
  window.location.href = '/composer/login';
};