/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { handleApiRequest } from '../service/ApiService';
import AuthContext from './AuthContext';
import { setCredentials, setAccessToken, clearCredentials } from '../store/authSlice';
import { scheduleTokenRefresh, clearScheduledRefresh } from '../service/Api';
import axios from 'axios';

const API_URL = import.meta.env.VITE_SPRING_API_URL;

export function AuthProvider({ children }) {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const username = useSelector((state) => state.auth.username);
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const performSilentLogout = () => {
    clearScheduledRefresh();
    dispatch(clearCredentials());
    navigate('/home', { replace: true });
  };

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      clearScheduledRefresh();
      await Promise.all([
        handleApiRequest('post', '/user/logout'),
        new Promise(resolve => setTimeout(resolve, 1200))
      ]);
    } catch {
      // proceed with client-side logout even if server call fails
    }
    dispatch(clearCredentials());
    navigate('/home', { replace: true });
    setIsLoggingOut(false);
  };

  const bootstrap = async () => {
    try {
      // First, get a fresh access token from the refresh cookie
      const { data: refreshData } = await axios.post(
        `${API_URL}/user/refresh`,
        {},
        { withCredentials: true }
      );

      dispatch(setAccessToken(refreshData.accessToken));
      scheduleTokenRefresh(refreshData.expiresIn);

      // Now fetch user info using the new access token
      const meData = await handleApiRequest('get', '/user/me');
      dispatch(setCredentials({ username: meData.userName }));
    } catch {
      dispatch(clearCredentials());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bootstrap();

    const onAppLogout = () => performSilentLogout();

    window.addEventListener('app:logout', onAppLogout);

    return () => {
      window.removeEventListener('app:logout', onAppLogout);
      clearScheduledRefresh();
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

      const userName = data.userName;
      const accessToken = data.accessToken;
      const expiresIn = data.expiresIn;

      dispatch(setCredentials({ username: userName, accessToken }));
      scheduleTokenRefresh(expiresIn);
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
      navigate('/', { replace: true });
      return data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, register, login, logout, username, isLoggingOut }}>
           {children}
    </AuthContext.Provider>
  );
}
