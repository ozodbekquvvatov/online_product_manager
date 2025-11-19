import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  full_name?: string;
  api_token?: string;
}

interface Profile {
  id: number;
  name: string;
  email: string;
  role: string;
  full_name: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const API_BASE_URL = 'http://127.0.0.1:8000';

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Get token from localStorage
  const getToken = (): string | null => {
    return localStorage.getItem('admin_token') || localStorage.getItem('token');
  };

  // Set token in localStorage and axios headers
  const setToken = (token: string) => {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('token', token);
    
    // Set axios default header
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    console.log('🔐 Token set in localStorage and axios headers');
  };

  // Remove token from localStorage and axios headers
  const removeToken = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    console.log('🔐 Token removed from localStorage and axios headers');
  };

  // Setup axios interceptors
  useEffect(() => {
    // Request interceptor to add token to all requests
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle auth errors
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.log('🔐 Authentication error (401), logging out...');
          removeToken();
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptors
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const checkAuth = async () => {
    const token = getToken();
    
    console.log('🔐 CheckAuth - Token exists:', !!token, 'Token:', token);
    
    if (!token) {
      console.log('🔐 No token found, user not authenticated');
      setLoading(false);
      setIsAuthenticated(false);
      return;
    }

    try {
      // Set the token for axios
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      console.log('🔐 Making check-auth request with token...');
      const response = await axios.get('/api/admin/check-auth');
      console.log('🔐 CheckAuth response:', response.data);
      
      if (response.data.authenticated && response.data.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        console.log('🔐 User authenticated successfully');
        
        // Also fetch profile
        try {
          const profileResponse = await axios.get('/api/admin/profile');
          if (profileResponse.data.success && profileResponse.data.data) {
            setProfile(profileResponse.data.data);
          }
        } catch (profileError) {
          console.warn('🔐 Profile fetch failed, but user is authenticated');
        }
      } else {
        throw new Error('Not authenticated - invalid response');
      }
    } catch (error: any) {
      console.error('🔐 Auth check failed:', error);
      console.error('🔐 Error status:', error.response?.status);
      console.error('🔐 Error data:', error.response?.data);
      
      // Clear invalid token
      removeToken();
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    try {
      const response = await axios.get('/api/admin/profile');
      if (response.data.success && response.data.data) {
        setProfile(response.data.data);
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    // Declare here so it's available in both try and catch scopes
    let originalAuthHeader: any = undefined;

    try {
      console.log('🔐 Starting login process...');
      
      // Remove any existing authorization header for login request
      originalAuthHeader = axios.defaults.headers.common['Authorization'];
      delete axios.defaults.headers.common['Authorization'];
      
      console.log('🔐 Sending login request to /api/admin/login...');
      const response = await axios.post('/api/admin/login', {
        email,
        password
      });

      console.log('🔐 Login response received:', response.data);

      if (response.data.success && response.data.token) {
        // Store the token and set axios headers
        setToken(response.data.token);
        
        // Store user data
        const userData = response.data.user;
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);
        
        console.log('🔐 Login successful!');
        console.log('🔐 Token stored:', response.data.token);
        console.log('🔐 User stored:', userData);
        
        // Fetch profile data
        try {
          console.log('🔐 Fetching profile data...');
          const profileResponse = await axios.get('/api/admin/profile');
          if (profileResponse.data.success && profileResponse.data.data) {
            setProfile(profileResponse.data.data);
            console.log('🔐 Profile data loaded:', profileResponse.data.data);
          }
        } catch (profileError) {
          console.warn('🔐 Profile fetch failed, but login was successful');
        }
      } else {
        throw new Error(response.data.message || 'Login failed - no token in response');
      }
    } catch (error: any) {
      console.error('🔐 Login error:', error);
      console.error('🔐 Login error status:', error.response?.status);
      console.error('🔐 Login error data:', error.response?.data);
      
      // Restore original auth header if it existed
      if (originalAuthHeader) {
        axios.defaults.headers.common['Authorization'] = originalAuthHeader;
      }
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('🔐 Logging out...');
      await axios.post('/api/admin/logout');
    } catch (error: any) {
      console.warn('🔐 Logout request had issues:', error.message);
    } finally {
      removeToken();
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      console.log('🔐 Logout completed');
    }
  };

  // Initialize auth state and setup axios
  useEffect(() => {
    console.log('🔐 AuthProvider mounted, checking auth...');
    
    // Set initial axios headers if token exists
    const token = getToken();
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    profile,
    loading,
    isAuthenticated,
    signIn,
    signOut,
    refreshProfile,
    getToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Export helper functions for external use
export const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const getAuthAxiosConfig = () => {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

// Export a fetch wrapper for convenience
export const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });
};