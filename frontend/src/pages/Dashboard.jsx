import React, { useState } from 'react';
import { 
  Users, Settings, FolderOpen, BookOpen, 
  BarChart2, Plus, Calendar, ChevronDown, LogOut
} from 'lucide-react';

import { useAuth } from '../context/AuthContext'

function Dashboard() {
  const [selectedTab, setSelectedTab] = useState('All');
  const { currentUser, logout} = useAuth();
  const [hoveredItem, setHoveredItem] = useState(null);

  const handleMouseEnter = (item) => {
    setHoveredItem(item);
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
  };

  return (
    <div className="flex h-screen bg-blue-500">
      {/* Sidebar */}
      <div className="w-20 flex flex-col items-center pt-8 pb-4 space-y-8">
        <div className="bg-white w-10 h-10 rounded-lg flex items-center justify-center">
          <img src='src/images/LimeAi.svg' alt='Logo' />
        </div>
        
        <div className="flex flex-col items-center space-y-6 flex-1">
          <a href='/flowchart' className="relative">
            <button 
              className="text-white p-2"
              onMouseEnter={() => handleMouseEnter('flowchart')}
              onMouseLeave={handleMouseLeave}
            >
              <BarChart2 className="w-6 h-6" />
              {hoveredItem === 'flowchart' && (
                <div className="absolute bottom-full ml-2 px-2 py-1 bg-white text-blue-500 rounded text-sm whitespace-nowrap">
                  Flowchart
                </div>
              )}
            </button>
          </a>

          <a href='/summary' className="relative">
            <button 
              className="text-white p-2"
              onMouseEnter={() => handleMouseEnter('summary')}
              onMouseLeave={handleMouseLeave}
            >
              <BookOpen className="w-6 h-6" />
              {hoveredItem === 'summary' && (
                <div className="absolute bottom-full ml-2 px-2 py-1 bg-white text-blue-500 rounded text-sm whitespace-nowrap">
                  Summary
                </div>
              )}
            </button>
          </a>

          <a href='/whiteboard' className="relative">
            <button 
              className="text-white p-2"
              onMouseEnter={() => handleMouseEnter('whiteboard')}
              onMouseLeave={handleMouseLeave}
            >
              <FolderOpen className="w-6 h-6" />
              {hoveredItem === 'whiteboard' && (
                <div className="absolute bottom-full px-2 py-1 bg-white text-blue-500 rounded text-sm whitespace-nowrap">
                  Whiteboard
                </div>
              )}
            </button>
          </a>
          
          <a href='/podcast' className="relative">
            <button 
              className="text-white p-2"
              onMouseEnter={() => handleMouseEnter('podcast')}
              onMouseLeave={handleMouseLeave}
            >
              <Users className="w-6 h-6" />
              {hoveredItem === 'podcast' && (
                <div className="absolute bottom-full px-2 py-1 bg-white text-blue-500 rounded text-sm whitespace-nowrap">
                  Podcast
                </div>
              )}
            </button>
          </a>
          
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-left mb-1">{currentUser?.displayName} <span className="text-yellow-400"></span></h1>
            </div>
            
            
            {/* Your class section */}
            <div>
              <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
              
              {/* <div className="flex mb-4 border-b">
                <button 
                  className={`pb-2 mr-6 ${selectedTab === 'All' ? 'text-black border-b-2 border-black font-medium' : 'text-gray-500'}`}
                  onClick={() => setSelectedTab('All')}
                >
                  All
                </button>
                <button 
                  className={`pb-2 mr-6 ${selectedTab === 'Design' ? 'text-black border-b-2 border-black font-medium' : 'text-gray-500'}`}
                  onClick={() => setSelectedTab('Design')}
                >
                  Design
                </button>
                <button 
                  className={`pb-2 mr-6 ${selectedTab === 'Science' ? 'text-black border-b-2 border-black font-medium' : 'text-gray-500'}`}
                  onClick={() => setSelectedTab('Science')}
                >
                  Science
                </button>
                <button 
                  className={`pb-2 ${selectedTab === 'Coding' ? 'text-black border-b-2 border-black font-medium' : 'text-gray-500'}`}
                  onClick={() => setSelectedTab('Coding')}
                >
                  Coding
                </button>
                
                <div className="flex-1 flex justify-end">
                  <button className="text-gray-400 mx-2">
                    <Filter className="w-5 h-5" />
                  </button>
                  <button className="text-gray-400 mx-2">
                    <Edit className="w-5 h-5" />
                  </button>
                </div>
              </div> */}
              
              {/* Microbiology Society class */}
              {/* <div className="bg-yellow-50 rounded-xl p-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-8 h-8 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 16a1 1 0 1 1 1-1 1 0 0 1-1 1zm1-5a1 1 0 0 1-2 0V8a1 1 0 0 1 2 0z" />
                    </svg>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-bold">Microbiology Society</h3>
                    <div className="grid grid-cols-3 gap-2 text-sm text-gray-500 mt-1">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 5v14M18 11l-6-6M6 11l6-6" />
                        </svg>
                        10 lesson
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        45 min
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        256 students
                      </div>
                    </div>
                  </div>
                </div>
              </div> */}
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
                <a href="/podcast" className="bg-white rounded-full w-6 h-6 flex items-center justify-center">
                <Plus className="w-4 h-4" />
                </a>
              </div>
              <p className="text-sm">Learn Concepts while you go</p>
              </div>
              
              <div className="bg-pink-100 rounded-xl p-4">
              <div className="flex justify-between mb-2">
                <div className="font-bold">Flowchart</div>
                <a href="/flowchart" className="bg-white rounded-full w-6 h-6 flex items-center justify-center">
                <Plus className="w-4 h-4" />
                </a>
              </div>
              <p className="text-sm">Set target, reminder and your study timeline</p>
              </div>
              <div className="bg-pink-100 rounded-xl p-4">
              <div className="flex justify-between mb-2">
                <div className="font-bold">AI Summarizer</div>
                <a href="/summary" className="bg-white rounded-full w-6 h-6 flex items-center justify-center">
                <Plus className="w-4 h-4" />
                </a>
              </div>
              <p className="text-sm">Set target, reminder and your study timeline</p>
              </div>
              <div className="bg-orange-100 rounded-xl p-4">
              <div className="flex justify-between mb-2">
                <div className="font-bold">WhiteBoard</div>
                <a href="/whiteboard" className="bg-white rounded-full w-6 h-6 flex items-center justify-center">
                <Plus className="w-4 h-4" />
                </a>
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
      </div>
    </div>
  );
}

export default Dashboard;