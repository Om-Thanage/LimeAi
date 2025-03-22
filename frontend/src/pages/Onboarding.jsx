import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { db } from '../config/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

function Onboarding() {
  const { currentUser, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists() && userDoc.data().onboarded) {
            window.location.href = '/dashboard';
          }
        } catch (error) {
          console.error("Error checking onboarding status:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    
    checkOnboardingStatus();
  }, [currentUser]);
  
  const completeOnboarding = async () => {
    if (currentUser) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await setDoc(userDocRef, {
          onboarded: true,
          onboardedAt: new Date()
        }, { merge: true });
        window.location.href='/dashboard';
      } catch (error) {
        console.error("Error updating onboarding status: ", error);
      }
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Onboarding</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">
              {currentUser?.displayName || currentUser?.email}
            </span>
            <button
              onClick={logout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      <button onClick={completeOnboarding} className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">Complete</button>
    </div>
  )
}

export default Onboarding