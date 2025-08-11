import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);

  // Show timeout warning after 2 seconds instead of 5
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setShowTimeoutWarning(true);
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">
            {showTimeoutWarning ? 'Connecting to authentication service...' : 'Loading...'}
          </p>
          {showTimeoutWarning && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md mx-auto">
              <p className="text-sm text-yellow-800 mb-2">
                Taking longer than expected. This might indicate:
              </p>
              <ul className="text-xs text-yellow-700 text-left space-y-1">
                <li>• Supabase environment variables not configured</li>
                <li>• Network connectivity issues</li>
                <li>• Supabase service temporarily unavailable</li>
              </ul>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 px-3 py-1 bg-yellow-200 text-yellow-800 rounded text-sm hover:bg-yellow-300 transition-colors"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;