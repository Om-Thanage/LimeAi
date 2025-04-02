import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import React, { useEffect } from 'react';

export const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/login');
    }
  }, [currentUser, loading, navigate]);

  if (loading) return <div>Loading...</div>;
  
  if (!currentUser) return null; // Return null to prevent flash of content before redirect

  return children;
};
