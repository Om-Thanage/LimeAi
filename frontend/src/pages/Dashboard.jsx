import React, { useState, useEffect, lazy, Suspense } from 'react';
import { 
  Users, Settings, FolderOpen, BookOpen, 
  BarChart2, Plus, Calendar, ChevronDown, LogOut,
  Clock, FileText, Mic, GitBranch, X
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { getRecentActivities } from '../utils/firebaseHelpers';
import { marked } from 'marked';

// Add the Inter font import
const interFontStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
`;

const Flowchart = lazy(() => import('./flowchart'));
const Summary = lazy(() => import('./Summary'));
const Podcast = lazy(() => import('./Podcast'));
const Whiteboard = lazy(() => import('./Whiteboard'));

function Dashboard() {
  const { currentUser, logout } = useAuth();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeComponent, setActiveComponent] = useState(null);

  const handleMouseEnter = (item) => {
    setHoveredItem(item);
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
  };

  useEffect(() => {
    const fetchActivities = async () => {
      if (currentUser) {
        try {
          const recentActivities = await getRecentActivities(currentUser.uid, 10);
          setActivities(recentActivities || []); 
        } catch (error) {
          console.error('Error fetching activities:', error);
          setActivities([]);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [currentUser]);

  
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
                  className="bg-white rounded-full w-6 h-6 flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm">Learn Concepts while you go</p>
            </div>
            
            <div className="bg-pink-100 rounded-xl p-4">
              <div className="flex justify-between mb-2">
                <div className="font-bold">Flowchart</div>
                <button 
                  onClick={() => handleComponentClick('flowchart')}
                  className="bg-white rounded-full w-6 h-6 flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm">Set target, reminder and your study timeline</p>
            </div>
            
            <div className="bg-pink-100 rounded-xl p-4">
              <div className="flex justify-between mb-2">
                <div className="font-bold">AI Summarizer</div>
                <button 
                  onClick={() => handleComponentClick('summary')}
                  className="bg-white rounded-full w-6 h-6 flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm">Set target, reminder and your study timeline</p>
            </div>
            
            <div className="bg-orange-100 rounded-xl p-4">
              <div className="flex justify-between mb-2">
                <div className="font-bold">WhiteBoard</div>
                <button 
                  onClick={() => handleComponentClick('whiteboard')}
                  className="bg-white rounded-full w-6 h-6 flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm">Set target, reminder and your study timeline</p>
            </div>
          </div>
          
          {/* Learning activity chart */}
          <div>
            <div className="flex items-center mb-4">
              <h2 className="text-xl font-bold flex-1">Learning activity</h2>
              <div className="flex items-center text-sm">
                <span className="flex items-center mr-4">
                  <span className="w-2 h-2 bg-blue-700 rounded-full mr-1"></span>
                  Materials
                </span>
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-pink-400 rounded-full mr-1"></span>
                  Exams
                </span>
              </div>
            </div>
            
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <Calendar className="w-4 h-4 mr-1" />
              3rd semester
              <ChevronDown className="w-4 h-4 ml-1" />
            </div>
            
            <div className="h-48 relative">
              {/* Activity chart */}
              <div className="absolute top-2 right-16 bg-purple-700 text-white rounded-lg px-2 py-1 text-xs">
                12 hours
              </div>
              
              {/* Placeholder for chart data */}
              <div className="absolute bottom-0 left-0 right-0 h-40">
                <div className="relative h-full">
                  <div className="absolute left-0 top-0 right-0 bottom-0 flex flex-col justify-between text-xs text-gray-500">
                    <div>100</div>
                    <div>80</div>
                    <div>60</div>
                    <div>40</div>
                    <div>20</div>
                    <div>0</div>
                  </div>
                  
                  <div className="absolute left-8 right-0 bottom-0 flex justify-between text-xs text-gray-500">
                    <div>Aug</div>
                    <div>Sept</div>
                    <div>Oct</div>
                    <div>Nov</div>
                    <div>Dec</div>
                    <div>Jan</div>
                  </div>
                  
                  {/* Simplified chart representation */}
                  <svg className="absolute inset-0 mt-4" viewBox="0 0 300 100" preserveAspectRatio="none">
                    {/* Pink line (exams) */}
                    <path 
                      d="M0,80 C20,70 40,40 60,30 C80,20 100,40 120,50 C140,60 160,30 180,20 C200,10 220,30 240,50 C260,70 280,80 300,70" 
                      fill="rgba(244,114,182,0.2)" 
                      stroke="#f472b6" 
                      strokeWidth="2"
                    />
                    
                    {/* Blue line (materials) */}
                    <path 
                      d="M0,50 C20,40 40,30 60,40 C80,50 100,70 120,60 C140,50 160,20 180,30 C200,40 220,50 240,30 C260,20 280,10 300,20" 
                      fill="rgba(29,78,216,0.2)" 
                      stroke="#1d4ed8" 
                      strokeWidth="2"
                    />
                    
                    {/* Marker for selected point */}
                    <circle cx="240" cy="30" r="4" fill="#1d4ed8" />
                  </svg>
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
            <img src='src/images/Lemon.png' alt='Logo' />
          </div>
          
          <div className="flex flex-col items-center space-y-6 flex-1">
            <button 
              className="text-white p-2 relative"
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
              className="text-white p-2 relative"
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
              className="text-white p-2 relative"
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
              className="text-white p-2 relative"
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
                className="text-white p-2"
                onMouseEnter={() => handleMouseEnter('settings')}
                onMouseLeave={handleMouseLeave}
              >
                <Settings className="w-6 h-6" />
                {hoveredItem === 'settings' && (
                  <div className="absolute bottom-full ml-2 px-2 py-1 bg-white text-blue-500 rounded text-sm whitespace-nowrap">
                    Settings
                  </div>
                )}
              </button>
            </div>
          </div>
          
          <div className="relative">
            <button 
              className="text-white p-2" 
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
      </div>
    </>
  );
}

export default Dashboard;