import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
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

// Configure axios to use relative URLs (Vite will proxy them to backend)
axios.defaults.baseURL = '/';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const isMounted = useRef(true);

  // Debug logging
  useEffect(() => {
    console.log('🔐 AuthProvider - Component mounted');
    
    return () => {
      isMounted.current = false;
      console.log('🔐 AuthProvider - Component unmounted');
    };
  }, []);

  // Get token from localStorage
  const getToken = (): string | null => {
    try {
      const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
      console.log('🔐 getToken - Token found:', !!token);
      return token;
    } catch (error) {
      console.error('🔐 getToken - Error accessing localStorage:', error);
      return null;
    }
  };

  // Set token in localStorage and axios headers
  const setToken = (token: string) => {
    try {
      localStorage.setItem('admin_token', token);
      localStorage.setItem('token', token);
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      console.log('🔐 setToken - Token set in localStorage and axios headers');
    } catch (error) {
      console.error('🔐 setToken - Error setting token:', error);
    }
  };

  // Remove token from localStorage and axios headers
  const removeToken = () => {
    try {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      console.log('🔐 removeToken - Token removed from localStorage and axios headers');
    } catch (error) {
      console.error('🔐 removeToken - Error removing token:', error);
    }
  };

  // Setup axios interceptors
  useEffect(() => {
    console.log('🔐 Setting up axios interceptors...');

    // Request interceptor to add token to all requests
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        console.log(`🔐 Request Interceptor - ${config.method?.toUpperCase()} ${config.url}`);
        const token = getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('🔐 Request Interceptor - Authorization header added');
        }
        return config;
      },
      (error) => {
        console.error('🔐 Request Interceptor - Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle auth errors
    const responseInterceptor = axios.interceptors.response.use(
      (response) => {
        console.log(`🔐 Response Interceptor - ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('🔐 Response Interceptor - Error:', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message
        });

        if (error.response?.status === 401) {
          console.log('🔐 Response Interceptor - Authentication error (401), logging out...');
          removeToken();
          if (isMounted.current) {
            setUser(null);
            setProfile(null);
            setIsAuthenticated(false);
          }
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptors
    return () => {
      console.log('🔐 Cleaning up axios interceptors...');
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const checkAuth = async () => {
    if (!isMounted.current) {
      console.log('🔐 checkAuth - Component not mounted, skipping');
      return;
    }

    console.log('🔐 checkAuth - Starting auth check');
    const token = getToken();
    
    console.log('🔐 checkAuth - Token exists:', !!token);
    
    if (!token) {
      console.log('🔐 checkAuth - No token found');
      if (isMounted.current) {
        setLoading(false);
        setIsAuthenticated(false);
      }
      return;
    }

    try {
      // Set the token for axios
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      console.log('🔐 checkAuth - Making request to /api/admin/check-auth');
      const response = await axios.get<{ authenticated: boolean; user: User }>('/api/admin/check-auth');
      console.log('🔐 checkAuth - Response received:', response.data);
      
      if (response.data.authenticated && response.data.user) {
        console.log('🔐 checkAuth - User authenticated');
        if (isMounted.current) {
          setUser(response.data.user);
          setIsAuthenticated(true);
          
          // Also fetch profile
          try {
            console.log('🔐 checkAuth - Fetching profile...');
            const profileResponse = await axios.get<{ success: boolean; data: Profile }>('/api/admin/profile');
            if (profileResponse.data.success && profileResponse.data.data) {
              console.log('🔐 checkAuth - Profile loaded:', profileResponse.data.data);
              setProfile(profileResponse.data.data);
            }
          } catch (profileError) {
            console.warn('🔐 checkAuth - Profile fetch failed:', profileError);
          }
        }
      } else {
        console.log('🔐 checkAuth - Invalid response format');
        throw new Error('Not authenticated - invalid response');
      }
    } catch (error: any) {
      console.error('🔐 checkAuth - Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Clear invalid token
      removeToken();
      if (isMounted.current) {
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        console.log('🔐 checkAuth - Completed, loading set to false');
      }
    }
  };

  const refreshProfile = async () => {
    if (!isMounted.current) return;

    try {
      console.log('🔐 refreshProfile - Fetching profile...');
      const response = await axios.get<{ success: boolean; data: Profile }>('/api/admin/profile');
      if (response.data.success && response.data.data) {
        console.log('🔐 refreshProfile - Profile updated');
        setProfile(response.data.data);
      }
    } catch (error) {
      console.error('🔐 refreshProfile - Error:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!isMounted.current) {
      throw new Error('AuthProvider is not mounted');
    }

    console.log('🔐 signIn - Starting login for email:', email);
    
    try {
      // Remove any existing authorization header for login request
      const originalAuthHeader = axios.defaults.headers.common['Authorization'];
      delete axios.defaults.headers.common['Authorization'];
      
      console.log('🔐 signIn - Sending login request...');
      const response = await axios.post<{ success: boolean; token: string; user: User }>('/api/admin/login', {
        email,
        password
      });

      console.log('🔐 signIn - Response received:', response.data);

      if (response.data.success && response.data.token) {
        // Store the token and set axios headers
        setToken(response.data.token);
        
        // Store user data
        const userData = response.data.user;
        try {
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (storageError) {
          console.warn('🔐 signIn - Could not store user in localStorage:', storageError);
        }
        
        if (isMounted.current) {
          setUser(userData);
          setIsAuthenticated(true);
        }
        
        console.log('🔐 signIn - Login successful');
        
        // Fetch profile data
        try {
          console.log('🔐 signIn - Fetching profile...');
          const profileResponse = await axios.get<{ success: boolean; data: Profile }>('/api/admin/profile');
          if (profileResponse.data.success && profileResponse.data.data) {
            console.log('🔐 signIn - Profile loaded');
            if (isMounted.current) {
              setProfile(profileResponse.data.data);
            }
          }
        } catch (profileError) {
          console.warn('🔐 signIn - Profile fetch failed:', profileError);
        }
      } else {
        throw new Error(response.data.message || 'Login failed - no token in response');
      }
    } catch (error: any) {
      console.error('🔐 signIn - Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Restore original auth header if it existed
      if (axios.defaults.headers.common['Authorization'] === undefined && originalAuthHeader) {
        axios.defaults.headers.common['Authorization'] = originalAuthHeader;
      }
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  };

  const signOut = async () => {
    if (!isMounted.current) return;

    console.log('🔐 signOut - Starting logout');
    
    try {
      await axios.post('/api/admin/logout');
      console.log('🔐 signOut - Logout request successful');
    } catch (error: any) {
      console.warn('🔐 signOut - Logout request failed:', error.message);
    } finally {
      removeToken();
      if (isMounted.current) {
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
      }
      console.log('🔐 signOut - Logout completed');
    }
  };

  // Initialize auth state
  useEffect(() => {
    console.log('🔐 AuthProvider useEffect - Initializing auth');
    
    // Set initial axios headers if token exists
    const token = getToken();
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('🔐 AuthProvider useEffect - Set initial axios header');
    }
    
    checkAuth();

    return () => {
      console.log('🔐 AuthProvider useEffect - Cleanup');
    };
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

  console.log('🔐 AuthProvider - Rendering with state:', {
    user: !!user,
    profile: !!profile,
    loading,
    isAuthenticated
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Export helper functions for external use
export const getAuthHeaders = (): HeadersInit => {
  try {
    const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  } catch (error) {
    console.error('🔐 getAuthHeaders - Error:', error);
    return {
      'Content-Type': 'application/json'
    };
  }
};

export const getAuthAxiosConfig = () => {
  try {
    const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  } catch (error) {
    console.error('🔐 getAuthAxiosConfig - Error:', error);
    return {
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
};

// Export a fetch wrapper for convenience
export const authFetch = async (url: string, options: RequestInit = {}) => {
  try {
    const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    console.log(`🔐 authFetch - Making request to ${url}`);
    return fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });
  } catch (error) {
    console.error('🔐 authFetch - Error:', error);
    throw error;
  }
};