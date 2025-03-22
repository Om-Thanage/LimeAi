import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";

function Onboarding() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const completeOnboarding = async () => {
    if (!currentUser) return;
    
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        onboarded: true
      });
      navigate("/dashboard");
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  };

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
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <h2 className="text-2xl font-semibold mb-4">Welcome to ConceptFlow!</h2>
            <p className="mb-6">
              Thank you for signing up. We're excited to help you create amazing flowcharts!
            </p>
            
            <p className="mb-10">
              ConceptFlow helps you visualize complex concepts through AI-generated flowcharts. 
              Simply describe what you want to visualize, and our AI will create a beautiful 
              flowchart for you.
            </p>
            
            <button 
              onClick={completeOnboarding} 
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Get Started
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Onboarding; 