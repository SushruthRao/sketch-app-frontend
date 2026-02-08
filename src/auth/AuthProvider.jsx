/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { handleApiRequest } from '../service/ApiService';
import AuthContext from './AuthContext';

const TOKEN_KEY = 'userToken';
const USERNAME_KEY = 'userName';

function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function getMsUntilExpiry(jwt) {
  const claims = decodeJwt(jwt);
  if (!claims?.exp) return null;
  const expMs = claims.exp * 1000;
  return Math.max(expMs - Date.now(), 0);
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
    
   const [username, setUserName] = useState(() => localStorage.getItem(USERNAME_KEY));
  const [loading, setLoading] = useState(true);
  const expiryTimer = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const clearTimer = () => {
    if (expiryTimer.current) {
      clearTimeout(expiryTimer.current);
      expiryTimer.current = null;
    }
  };

const performSilentLogout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);

  setToken(null);
  setUserName(null);

  clearTimer();

  navigate('/home', { replace: true });
};

const logout = async () => {
  setIsLoggingOut(true);
  await new Promise(resolve => setTimeout(resolve, 1200));
  performSilentLogout();
  setIsLoggingOut(false);
};

const scheduleExpiryLogout = (jwt) => {
  clearTimer();
  const msLeft = getMsUntilExpiry(jwt);
  console.log("Time left for token expiry : " + msLeft);
  if (msLeft === null || msLeft <= 0) {
    performSilentLogout(); 
    return;
  }

  const MAX_DELAY = 2147483647; 
  const delay = Math.min(msLeft, MAX_DELAY);

  expiryTimer.current = setTimeout(() => {
    performSilentLogout(); 
  }, delay);
};


const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    const current = localStorage.getItem(TOKEN_KEY);
    if (!current) {
      if (token) performSilentLogout(); 
      return;
    }

    scheduleExpiryLogout(current);
  }
};

  const bootstrap = async (existingToken) => {
    if (!existingToken) {
      setLoading(false);
      return;
    }
    try {
      scheduleExpiryLogout(existingToken);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USERNAME_KEY);
      setToken(null);
      setUserName(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bootstrap(token);

    const onStorage = (e) => {
      if (e.key === TOKEN_KEY) {
        const newToken = e.newValue;
        setToken(newToken);
        if (!newToken) {
          clearTimer();
          if (location.pathname !== '/') navigate('/', { replace: true });
        } else {
          scheduleExpiryLogout(newToken);
        }
      }
    };
    const onAppLogout = () => logout();

    window.addEventListener('storage', onStorage);
    window.addEventListener('app:logout', onAppLogout);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('app:logout', onAppLogout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimer();
    };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
  setLoading(true);
  
  try {

    const [data] = await Promise.all([
      handleApiRequest('post', '/user/login', { email, password }),
      new Promise((resolve) => setTimeout(resolve, 2000)) 
    ]);

    const jsonToken = data.jsonToken;
    const userName = data.userName;
    console.log(data);
    
    if (!jsonToken) throw new Error('No token returned from server');
    localStorage.setItem(USERNAME_KEY, userName)
    localStorage.setItem(TOKEN_KEY, jsonToken);
    setToken(jsonToken);
    setUserName(userName)
    scheduleExpiryLogout(jsonToken);
    navigate('/home', { replace: true });
  
    
  } catch (error) {
    

    console.log("Auth Provider " + error);
    throw error; 
  } finally {
    setLoading(false);
  }
};


   const register = async (registrationDetails) => {
    setLoading(true);
    try {
      const data = await handleApiRequest('post', '/user/register', registrationDetails);

      if (data.jsonToken) {
        const jsonToken = data.jsonToken;
        localStorage.setItem(TOKEN_KEY, jsonToken);
        setToken(jsonToken);
        scheduleExpiryLogout(jsonToken);
        navigate('/home', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
      
      return data; 
    } catch (error) {
      console.error("Registration error:", error);
      throw error; 
    }
    finally{
      setLoading(false);
    }
  };



  return (
    <AuthContext.Provider value={{ token, loading, register, login, logout, username }}>
           {children}
    </AuthContext.Provider>
  );
}