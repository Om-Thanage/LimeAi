import React, { useState, useEffect, lazy, Suspense } from 'react';
import { 
  Users, Settings, FolderOpen, BookOpen, 
  BarChart2, Plus, Calendar, ChevronDown, LogOut,
  Clock, FileText, Mic, GitBranch, X
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { getRecentActivities } from '../utils/firebaseHelpers';
import { marked } from 'marked';
import { db } from '../config/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

// Add the Inter font import
const interFontStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
`;

const Flowchart = lazy(() => import('./Flowchart'));
const Summary = lazy(() => import('./Summary'));
const Podcast = lazy(() => import('./Podcast'));
const Whiteboard = lazy(() => import('./Whiteboard'));
const Profile = lazy(() => import('../components/Profile'));

function Dashboard() {
  const { currentUser, logout } = useAuth();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeComponent, setActiveComponent] = useState(null);
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    totalDays: 0,
  });
  const [showProfile, setShowProfile] = useState(false);
  
  
  const handleMouseEnter = (item) => {
    setHoveredItem(item);
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        try {
          const recentActivities = await getRecentActivities(currentUser.uid, 10);
          setActivities(recentActivities || []);
          
          // Get streak data once
          // If the streak system is completely broken, uncomment the next line
          // await resetStreakData(); 
          
          // Then use the new update logic
          await updateStreakData();
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  const updateStreakData = async () => {
    if (!currentUser) return;
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayString = today.toISOString().split('T')[0];
      
      // New user with no document
      if (!userDoc.exists()) {
        console.log("Creating new user document with streak data");
        
        const initialStreakData = {
          currentStreak: 1,
          longestStreak: 1,
          lastVisit: today,
          visitDates: [todayString], // Array of dates the user visited
          visitCount: 1 // Total visits (days)
        };
        
        await setDoc(userDocRef, {
          onboarded: true,
          onboardedAt: today,
          streakData: initialStreakData
        });
        
        setStreakData({
          currentStreak: 1,
          longestStreak: 1,
          totalDays: 1
        });
        
        return;
      }
      
      // Existing user but no streak data
      const userData = userDoc.data();
      if (!userData.streakData) {
        console.log("Initializing streak data for existing user");
        
        const newStreakData = {
          currentStreak: 1,
          longestStreak: 1,
          lastVisit: today,
          visitDates: [todayString],
          visitCount: 1
        };
        
        await updateDoc(userDocRef, {
          streakData: newStreakData
        });
        
        setStreakData({
          currentStreak: 1,
          longestStreak: 1,
          totalDays: 1
        });
        
        return;
      }
      
      // Get existing streak data
      let { 
        currentStreak = 0, 
        longestStreak = 0, 
        lastVisit, 
        visitDates = [], 
        visitCount = 0 
      } = userData.streakData;
      
      // Convert to proper Date object
      const lastVisitDate = lastVisit?.toDate ? lastVisit.toDate() : new Date(lastVisit);
      lastVisitDate.setHours(0, 0, 0, 0);
      
      // Calculate yesterday
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      // Check if already visited today
      const alreadyVisitedToday = visitDates.includes(todayString);
      
      // If not visited today, update streak
      if (!alreadyVisitedToday) {
        // Add today to visit dates
        visitDates.push(todayString);
        visitCount += 1;
        
        // Check if last visit was yesterday
        const isConsecutiveDay = lastVisitDate.getTime() === yesterday.getTime();
        
        if (isConsecutiveDay) {
          // Continue streak
          currentStreak += 1;
          // Update longest streak if needed
          longestStreak = Math.max(longestStreak, currentStreak);
        } else if (lastVisitDate.getTime() !== today.getTime()) {
          // Not consecutive and not today - reset streak
          currentStreak = 1;
        }
      }
      
      // Sanity check for longest streak
      const maxPossibleStreak = 120; // Reasonable max for a learning app
      if (longestStreak > maxPossibleStreak) {
        longestStreak = Math.min(currentStreak, maxPossibleStreak);
      }
      
      // Update database
      const updatedStreakData = {
        currentStreak,
        longestStreak,
        lastVisit: today,
        visitDates: [...new Set(visitDates)].sort(), // Remove duplicates and sort
        visitCount: [...new Set(visitDates)].length // Count unique dates
      };
      
      await updateDoc(userDocRef, {
        streakData: updatedStreakData
      });
      
      // Update local state
      setStreakData({
        currentStreak: updatedStreakData.currentStreak,
        longestStreak: updatedStreakData.longestStreak,
        totalDays: updatedStreakData.visitCount
      });
      
    } catch (error) {
      console.error("Error updating streak data:", error);
    }
  };

  const fixStreakData = async () => {
    if (!currentUser) return;
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists() || !userDoc.data().streakData) {
        return; // No data to fix
      }
      
      const userData = userDoc.data();
      const { streakData } = userData;
      
      // Create a copy of the data to modify
      const fixedStreakData = { ...streakData };
      
      // Fix impossible values
      const today = new Date();
      const earliestPossibleDate = new Date(2024, 0, 1); // Jan 1, 2024 or whenever your app launched
      const daysSinceStart = Math.floor((today - earliestPossibleDate) / (1000 * 60 * 60 * 24)) + 1;
      
      if (fixedStreakData.longestStreak > daysSinceStart) {
        fixedStreakData.longestStreak = Math.min(fixedStreakData.currentStreak, daysSinceStart);
      }
      
      // Ensure streak history is correct
      if (fixedStreakData.streakHistory && Array.isArray(fixedStreakData.streakHistory)) {
        // Remove duplicates and sort
        const uniqueHistory = [...new Set(fixedStreakData.streakHistory)].sort();
        fixedStreakData.streakHistory = uniqueHistory;
        fixedStreakData.totalDays = uniqueHistory.length;
      } else {
        // Reset streak history if it's corrupted
        const todayString = today.toISOString().split('T')[0];
        fixedStreakData.streakHistory = [todayString];
        fixedStreakData.totalDays = 1;
      }
      
      // Add streakStart if missing
      if (!fixedStreakData.streakStart) {
        const todayString = today.toISOString().split('T')[0];
        fixedStreakData.streakStart = todayString;
      }
      
      // Update the data
      await updateDoc(userDocRef, {
        streakData: fixedStreakData
      });
      
      setStreakData({
        currentStreak: fixedStreakData.currentStreak,
        longestStreak: fixedStreakData.longestStreak,
        totalDays: fixedStreakData.totalDays
      });
      
      console.log("Streak data fixed!");
      
    } catch (error) {
      console.error("Error fixing streak data:", error);
    }
  };

  const resetStreakData = async () => {
    if (!currentUser) return;
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) return;
      
      const userData = userDoc.data();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayString = today.toISOString().split('T')[0];
      
      // Simple fresh start
      const resetStreakData = {
        currentStreak: 1,
        longestStreak: 1,
        lastVisit: today,
        visitDates: [todayString],
        visitCount: 1
      };
      
      await updateDoc(userDocRef, {
        streakData: resetStreakData
      });
      
      setStreakData({
        currentStreak: 1,
        longestStreak: 1,
        totalDays: 1
      });
      
      console.log("Streak data has been reset!");
      
    } catch (error) {
      console.error("Error resetting streak data:", error);
    }
  };

  
  const getActivityIcon = (type) => {
    switch (type) {
      case 'flowchart':
        return <GitBranch className="w-5 h-5 text-blue-500" />;
      case 'summary':
        return <FileText className="w-5 h-5 text-green-500" />;
      case 'podcast':
        return <Mic className="w-5 h-5 text-orange-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  
  const openContentModal = (activity) => {
    setSelectedActivity(activity);
    setShowModal(true);
  };

  
  const closeModal = () => {
    setShowModal(false);
    setSelectedActivity(null);
  };

  
  const renderActivityContent = (activity) => {
    switch (activity.type) {
      case 'flowchart':
        return (
          <div className="p-4">
            <h3 className="text-lg font-bold mb-4">Flowchart: {activity.title}</h3>
            <div className="bg-gray-50 p-4 rounded-lg overflow-auto">
              <div className="mermaid">{activity.content}</div>
            </div>
          </div>
        );
      case 'summary':
        return (
          <div className="p-4">
            <h3 className="text-lg font-bold mb-4">Summary: {activity.title}</h3>
            <div className="prose max-w-none" 
                 dangerouslySetInnerHTML={{ __html: marked.parse(activity.content) }}>
            </div>
          </div>
        );
      case 'podcast':
        return (
          <div className="p-4">
            <h3 className="text-lg font-bold mb-4">Podcast: {activity.title}</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm">{activity.content}</pre>
            </div>
          </div>
        );
      default:
        return <div>Unsupported content type</div>;
    }
  };

  
  useEffect(() => {
    if (showModal && selectedActivity?.type === 'flowchart') {
      import('mermaid').then(mermaid => {
        mermaid.default.initialize({
          startOnLoad: true,
          theme: 'default',
          securityLevel: 'loose',
        });
        try {
          mermaid.default.init(undefined, document.querySelectorAll('.mermaid'));
        } catch (e) {
          console.error('Error initializing mermaid', e);
        }
      });
    }
  }, [showModal, selectedActivity]);

  const handleComponentClick = (component) => {
    setActiveComponent(component);
    // Hide the modal if it's open
    setShowModal(false);
  };

  const goBackToDashboard = () => {
    setActiveComponent(null);
  };

  
  const renderContent = () => {
    if (activeComponent) {
      return (
        <div className="relative w-full">
          <button 
            onClick={goBackToDashboard}
            className="absolute top-2 right-2 z-10 bg-blue-500 text-white rounded-full p-2 shadow-md hover:bg-blue-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
            {activeComponent === 'flowchart' && <Flowchart />}
            {activeComponent === 'summary' && <Summary />}
            {activeComponent === 'podcast' && <Podcast />}
            {activeComponent === 'whiteboard' && <Whiteboard />}
          </Suspense>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <div className="mb-8">
        <h1 className="text-3xl font-bold text-left mb-1">{currentUser?.displayName} <span className="text-yellow-400"></span></h1>
        </div>
        <div>
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        
        {loading ? (
          <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex">
            <div className="rounded-full bg-slate-200 h-10 w-10"></div>
            <div className="flex-1 ml-4 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            </div>
            </div>
          ))}
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} 
               className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
               onClick={() => openContentModal(activity)}>
            <div className="flex sm:flex-row flex-col items-start">
              <div className="py-2 mr-4">
              {getActivityIcon(activity.type)}
              </div>
              <div className="sm:flex-1 flex-2 w-full ">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{activity.title}</h3>
                <span className="text-xs text-gray-500 sm:block hidden">{formatDate(activity.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {activity.type === 'flowchart' && 'Created a flowchart'}
                {activity.type === 'summary' && 'Generated a summary'}
                {activity.type === 'podcast' && 'Created a podcast'}
              </p>
              
              <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-blue-500 hover:underline">
                View {activity.type}
                </span>
                <span className="text-xs text-gray-500 sm:hidden mt-1">{formatDate(activity.createdAt)}</span>
              </div>
              </div>
            </div>
            </div>
          ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8">
          <p>No recent activities found.</p>
          <p className="text-sm mt-2">Try generating a flowchart, summary, or podcast!</p>
          </div>
        )}
        </div>
      </div>
      
      {/* Right side content */}
      <div className="lg:col-span-1">            
        {/* Date and Time */}
        <div className="flex mb-6 text-center">
        <div className="flex-1 mr-3">
          <div className="text-blue-700 font-bold text-2xl">
          {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}
          </div>
        </div>
        </div>

        {/* Quick links */}
          <div className="grid sm:grid-cols-2 grid-cols-1 gap-4 mb-8">
          <div className="bg-orange-100 rounded-xl p-4">
            <div className="flex justify-between mb-2">
            <div className="font-bold">Podcast</div>
            <button 
            onClick={() => handleComponentClick('podcast')}
            className="bg-white rounded-full w-6 h-6 flex items-center justify-center hover:cursor-pointer"
            >
            <Plus className="w-4 h-4" />
            </button>
            </div>
            <p className="text-sm">Create podcasts with AI voices</p>
          </div>
          
          <div className="bg-pink-100 rounded-xl p-4">
            <div className="flex justify-between mb-2">
            <div className="font-bold">Flowchart</div>
            <button 
            onClick={() => handleComponentClick('flowchart')}
            className="bg-white rounded-full w-6 h-6 flex items-center justify-center hover:cursor-pointer"
            >
            <Plus className="w-4 h-4" />
            </button>
            </div>
            <p className="text-sm">Get Conceptual clarity using flowcharts instantly.</p>
          </div>
          
          <div className="bg-pink-100 rounded-xl p-4">
            <div className="flex justify-between mb-2">
            <div className="font-bold">AI Summarizer</div>
            <button 
            onClick={() => handleComponentClick('summary')}
            className="bg-white rounded-full w-6 h-6 flex items-center justify-center hover:cursor-pointer"
            >
            <Plus className="w-4 h-4" />
            </button>
            </div>
            <p className="text-sm">Summarize your lesson within seconds. Chat with AI and solve your doubts!</p>
          </div>
          
          <div className="bg-orange-100 rounded-xl p-4">
            <div className="flex justify-between mb-2">
            <div className="font-bold">WhiteBoard</div>
            <button 
            onClick={() => handleComponentClick('whiteboard')}
            className="bg-white rounded-full w-6 h-6 flex items-center justify-center hover:cursor-pointer"
            >
            <Plus className="w-4 h-4" />
            </button>
            </div>
            <p className="text-sm">Create stunning drawings with AI-powered tools.</p>
          </div>
          </div>
          
          {/* Learning Streak - Modified Section */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center mb-6">
          <h2 className="text-xl font-bold flex-1">Learning Streak</h2>
          <div className="flex items-center text-sm">
          <Calendar className="w-4 h-4 mr-1" />
          </div>
        </div>
        
        {/* Streak stats - Cool redesign with real data */}
        <div className="grid sm:grid-cols-3 grid-cols-1 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center shadow-sm">
          <div className="text-3xl font-bold text-green-600 mb-1">{streakData.currentStreak || 0}</div>
          <div className="text-xs text-gray-600 font-medium">Current Streak</div>
          <div className="mt-2 w-full h-1 bg-green-200 rounded-full">
            <div className="h-1 bg-green-500 rounded-full" 
               style={{ width: `${streakData.longestStreak > 0 
                        ? Math.min(100, (streakData.currentStreak/streakData.longestStreak)*100) 
                        : 100}%`  }}>
            </div>
          </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center shadow-sm">
          <div className="text-3xl font-bold text-blue-600 mb-1">{streakData.longestStreak}</div>
          <div className="text-xs text-gray-600 font-medium">Longest Streak</div>
          <div className="mt-2 w-full h-1 bg-blue-200 rounded-full">
            <div className="h-1 bg-blue-500 rounded-full" style={{ width: '100%' }}></div>
          </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center shadow-sm">
          <div className="text-3xl font-bold text-purple-600 mb-1">{streakData.totalDays || 0}</div>
          <div className="text-xs text-gray-600 font-medium">Total Days</div>
          <div className="mt-2 w-full h-1 bg-purple-200 rounded-full">
            <div className="h-1 bg-purple-500 rounded-full" style={{ width: '75%' }}></div>
          </div>
          </div>
        </div>
        </div>
      </div>
      </div>
    );
  };

  return (
    <>
      <style>{interFontStyle}</style>
      <div className="flex h-screen bg-blue-500 font-[Inter]">
        {/* Sidebar */}
        <div className="w-20 sm:flex flex-col items-center pt-8 pb-4 space-y-8 hidden">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center">
            <img src='assets/images/Lemon.png' alt='Logo' />
          </div>
          
          <div className="flex flex-col items-center space-y-6 flex-1">
            <button 
              className="text-white p-2 relative cursor-pointer"
              onMouseEnter={() => handleMouseEnter('flowchart')}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleComponentClick('flowchart')}
            >
              <BarChart2 className="w-6 h-6" />
              {hoveredItem === 'flowchart' && (
                <div className="absolute bottom-full ml-2 px-2 py-1 bg-white text-blue-500 rounded text-sm whitespace-nowrap">
                  Flowchart
                </div>
              )}
            </button>

            <button 
              className="text-white p-2 relative cursor-pointer"
              onMouseEnter={() => handleMouseEnter('summary')}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleComponentClick('summary')}
            >
              <BookOpen className="w-6 h-6" />
              {hoveredItem === 'summary' && (
                <div className="absolute bottom-full ml-2 px-2 py-1 bg-white text-blue-500 rounded text-sm whitespace-nowrap">
                  Summary
                </div>
              )}
            </button>

            <button 
              className="text-white p-2 relative cursor-pointer"
              onMouseEnter={() => handleMouseEnter('whiteboard')}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleComponentClick('whiteboard')}
            >
              <FolderOpen className="w-6 h-6" />
              {hoveredItem === 'whiteboard' && (
                <div className="absolute bottom-full px-2 py-1 bg-white text-blue-500 rounded text-sm whitespace-nowrap">
                  Whiteboard
                </div>
              )}
            </button>
            
            <button 
              className="text-white p-2 relative cursor-pointer"
              onMouseEnter={() => handleMouseEnter('podcast')}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleComponentClick('podcast')}
            >
              <Users className="w-6 h-6" />
              {hoveredItem === 'podcast' && (
                <div className="absolute bottom-full px-2 py-1 bg-white text-blue-500 rounded text-sm whitespace-nowrap">
                  Podcast
                </div>
              )}
            </button>
            
            <div className="relative">
              <button 
                className="text-white p-2 cursor-pointer"
                onMouseEnter={() => handleMouseEnter('settings')}
                onMouseLeave={handleMouseLeave}
                onClick={() => setShowProfile(true)}
              >
                <Settings className="w-6 h-6" />
                {hoveredItem === 'settings' && (
                  <div className="absolute bottom-full ml-2 px-2 py-1 bg-white text-blue-500 rounded text-sm whitespace-nowrap">
                    Profile
                  </div>
                )}
              </button>
            </div>
          </div>
          
          <div className="relative">
            <button 
              className="text-white p-2 cursor-pointer" 
              onClick={logout}
              onMouseEnter={() => handleMouseEnter('logout')}
              onMouseLeave={handleMouseLeave}
            >
              <LogOut className="w-6 h-6" />
              {hoveredItem === 'logout' && (
                <div className="absolute bottom-full px-2 py-1 bg-white text-blue-500 rounded text-sm whitespace-nowrap">
                  Logout
                </div>
              )}
            </button>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 bg-white sm:rounded-tl-3xl sm:rounded-bl-3xl p-8 overflow-y-auto">
          {renderContent()}
        </div>

        {/* Content Modal */}
        {showModal && selectedActivity && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-xl font-bold">
                  {selectedActivity.type.charAt(0).toUpperCase() + selectedActivity.type.slice(1)}
                </h2>
                <button 
                  onClick={closeModal}
                  className="bg-gray-100 p-2 rounded-full hover:bg-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto">
                {renderActivityContent(selectedActivity)}
              </div>
            </div>
          </div>
        )}

        {/* Profile Modal */}
        {showProfile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Suspense fallback={<div className="bg-white p-8 rounded-lg">Loading...</div>}>
              <Profile onClose={() => setShowProfile(false)} />
            </Suspense>
          </div>
        )}
      </div>
    </>
  );
}

export default Dashboard;