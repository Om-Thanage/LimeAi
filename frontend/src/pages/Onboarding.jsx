import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
  }, [currentUser, logout]);

  const completeOnboarding = async () => {
    if (currentUser) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const today = new Date();
        
        // Initialize streak-related data
        await setDoc(userDocRef, {
          onboarded: true,
          onboardedAt: today,
          // Streak tracking data
          streakData: {
            currentStreak: 1, // Start with a streak of 1 for today
            longestStreak: 1, // Initially, longest = current
            lastLoginDate: today, // Track last login for streak calculations
            totalDays: 1, // Total days the user has logged in
            streakHistory: [today.toISOString().split('T')[0]] // Array of ISO date strings (YYYY-MM-DD)
          }
        }, { merge: true });
        
        window.location.href = '/dashboard';
      } catch (error) {
        console.error("Error updating onboarding status: ", error);
      }
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="max-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <main className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          {/* Bento Grid Layout */}
          <div className="grid grid-cols-5 grid-rows-7 gap-4 h-[500px] w-full">
            {/* Div 3 - Large Main Feature */}
            <div className="col-span-3 row-span-4 bg-blue-50 p-6 rounded-lg flex flex-col">
              <h3 className="text-2xl font-semibold mb-4">Whiteboard</h3>
              <p className="text-gray-600 mb-4">Create stunning drawings with AI-powered tools.</p>
              <div className="bg-blue-100 rounded-lg flex-grow flex items-center justify-center">
                <span className="text-blue-600">Drawing Canvas Preview</span>
              </div>
            </div>

            {/* Div 4 */}
            <div className="col-span-2 row-span-3 col-start-4 bg-red-50 p-6 rounded-lg flex flex-col">
              <h3 className="text-xl font-semibold mb-2">Flowchart Visualizer</h3>
              <p className="text-gray-600 mb-4">Get Conceptual clarity using flowcharts instantly.</p>
              <div className="bg-red-100 rounded-lg flex-grow flex items-center justify-center">
                <span className="text-red-600">Flowchart Preview</span>
              </div>
            </div>

            {/* Div 5 */}
            <div className="col-span-2 row-span-4 col-start-4 row-start-4 bg-purple-50 p-6 rounded-lg flex flex-col">
              <h3 className="text-xl font-semibold mb-2">AI Summarizer</h3>
              <p className="text-gray-600 mb-4">Summarize your lesson within seconds.Chat with AI and solve your doubts!</p>
              <div className="bg-purple-100 rounded-lg flex-grow flex items-center justify-center">
                <span className="text-purple-600">Summarizer Preview</span>
              </div>
            </div>

            {/* Div 6 */}
            <div className="col-span-3 row-span-3 row-start-5 bg-orange-50 p-6 rounded-lg flex flex-col">
              <h3 className="text-xl font-semibold mb-2">Podcast Studio</h3>
              <p className="text-gray-600 mb-4">Create podcasts with AI voices.</p>
              <div className="bg-orange-100 rounded-lg flex-grow flex items-center justify-center">
                <span className="text-orange-600">Audio Waveform Preview</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={completeOnboarding}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Complete Setup
          </button>
        </div>
      </main>
    </div>
  );
}

export default Onboarding;
