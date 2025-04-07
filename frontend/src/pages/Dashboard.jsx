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

const Flowchart = lazy(() => import('./flowchart'));
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
      
      if (!userDoc.exists()) {
        console.log("User document not found, creating initial streak data");
        
        const today = new Date();
        const initialStreakData = {
          currentStreak: 1,
          longestStreak: 1, // Set longest streak to 1 as well
          lastLoginDate: today,
          totalDays: 1,
          streakHistory: [today.toISOString().split('T')[0]]
        };
        
        await setDoc(userDocRef, {
          onboarded: true,
          onboardedAt: today,
          streakData: initialStreakData
        });
        
        // Update local state
        setStreakData({
          currentStreak: 1,
          longestStreak: 1, // Ensure longest streak is 1
          totalDays: 1
        });
        
        return;
      }
      
      const userData = userDoc.data();
      
      // Check if streakData exists
      if (!userData.streakData) {
        console.log("Streak data not found, initializing now");
        
        // Initialize streak data if it doesn't exist
        const today = new Date();
        const newStreakData = {
          currentStreak: 1,
          longestStreak: 1, // Set longest streak to 1
          lastLoginDate: today,
          totalDays: 1,
          streakHistory: [today.toISOString().split('T')[0]]
        };
        
        await updateDoc(userDocRef, {
          streakData: newStreakData
        });
        
        setStreakData({
          currentStreak: 1,
          longestStreak: 1, // Ensure longest streak is 1
          totalDays: 1
        });
        
        return;
      }
      
      let { 
        currentStreak = 0, 
        longestStreak = 0, 
        lastLoginDate, 
        totalDays = 0, 
        streakHistory = [] 
      } = userData.streakData;
      
      // Ensure longestStreak is at least equal to currentStreak
      longestStreak = Math.max(longestStreak, currentStreak);
      
      const lastLogin = lastLoginDate?.toDate ? lastLoginDate.toDate() : new Date(lastLoginDate || Date.now());
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const lastLoginDay = new Date(lastLogin);
      lastLoginDay.setHours(0, 0, 0, 0);
      
      const todayString = today.toISOString().split('T')[0];
      
      let calculatedTotalDays = totalDays;
      if (userData.onboardedAt) {
        const onboardedDate = userData.onboardedAt.toDate ? 
          userData.onboardedAt.toDate() : new Date(userData.onboardedAt);
        const daysSinceCreation = Math.floor((Date.now() - onboardedDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        calculatedTotalDays = Math.max(totalDays, daysSinceCreation);
      }
      
      if (lastLoginDay.getTime() === today.getTime()) {
        setStreakData({
          currentStreak: Math.max(currentStreak, 1), // Ensure at least 1
          longestStreak: Math.max(longestStreak, 1), // Ensure at least 1
          totalDays: Math.max(calculatedTotalDays, 1) // Ensure at least 1
        });
        return;
      }
      
      const isConsecutiveDay = lastLoginDay.getTime() === yesterday.getTime();
      
      let updatedStreakData = {
        lastLoginDate: today,
        totalDays: Math.max(calculatedTotalDays, 1) // Ensure at least 1
      };
      
      if (!streakHistory) streakHistory = [];
      
      const dateInHistory = streakHistory.includes(todayString);
      
      if (!dateInHistory) {
        updatedStreakData.streakHistory = [...streakHistory, todayString];
        
        if (isConsecutiveDay) {
          const newCurrentStreak = currentStreak + 1;
          updatedStreakData.currentStreak = newCurrentStreak;
          updatedStreakData.longestStreak = Math.max(newCurrentStreak, longestStreak);
        } else {
          updatedStreakData.currentStreak = 1;
          // Don't reset longest streak, just keep the previous value
          updatedStreakData.longestStreak = Math.max(1, longestStreak);
        }
      } else {
        updatedStreakData.streakHistory = streakHistory;
        updatedStreakData.currentStreak = Math.max(currentStreak, 1); // Ensure at least 1
        updatedStreakData.longestStreak = Math.max(longestStreak, 1); // Ensure at least 1
      }
      
      await updateDoc(userDocRef, {
        streakData: updatedStreakData
      });
      
      setStreakData({
        currentStreak: updatedStreakData.currentStreak,
        longestStreak: updatedStreakData.longestStreak, 
        totalDays: updatedStreakData.totalDays
      });
      
    } catch (error) {
      console.error("Error updating streak data:", error);
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
                    <div className="flex items-start">
                      <div className="p-2 bg-gray-50 rounded-lg mr-4">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{activity.title}</h3>
                          <span className="text-xs text-gray-500">{formatDate(activity.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {activity.type === 'flowchart' && 'Created a flowchart'}
                          {activity.type === 'summary' && 'Generated a summary'}
                          {activity.type === 'podcast' && 'Created a podcast'}
                        </p>
                        
                        <div className="mt-2">
                          <span className="text-xs text-blue-500 hover:underline">
                            View {activity.type}
                          </span>
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
                <div className="grid grid-cols-2 gap-4 mb-8">
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
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center shadow-sm">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {streakData.currentStreak || 0}
                </div>
                <div className="text-xs text-gray-600 font-medium">Current Streak</div>
                <div className="mt-2 w-full h-1 bg-green-200 rounded-full">
                  <div 
                    className="h-1 bg-green-500 rounded-full" 
                    style={{ 
                      width: `${streakData.longestStreak > 0 
                        ? Math.min(100, (streakData.currentStreak/streakData.longestStreak)*100) 
                        : 100}%` 
                    }}
                  >
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center shadow-sm">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {streakData.longestStreak || 0}
                </div>
                <div className="text-xs text-gray-600 font-medium">Longest Streak</div>
                <div className="mt-2 w-full h-1 bg-blue-200 rounded-full">
                  <div className="h-1 bg-blue-500 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center shadow-sm">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {streakData.totalDays || 0}
                </div>
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
        <div className="w-20 flex flex-col items-center pt-8 pb-4 space-y-8">
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
        <div className="flex-1 bg-white rounded-tl-3xl rounded-bl-3xl p-8 overflow-y-auto">
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