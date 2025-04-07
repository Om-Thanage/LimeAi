import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { X, User, Mail, Calendar } from 'lucide-react';

const Profile = ({ onClose }) => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        } else {
          console.log("No user data found in Firestore");
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white p-8 overflow-auto z-50">
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Invalid date';
    }
  };

  return (
    <div className="fixed inset-0 bg-white p-8 overflow-auto z-50">
      {/* Close button */}
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 bg-gray-100 p-3 rounded-full hover:bg-gray-200 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>
      
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 mt-6">
          <h2 className="text-3xl font-bold text-gray-800">Account Settings</h2>
          <p className="text-gray-500 text-lg mt-2">View and manage your profile information</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Profile Picture */}
          <div className="flex flex-col items-center">
            <div className="mb-6">
              {currentUser?.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt="Profile" 
                  className="w-48 h-48 rounded-full shadow-md object-cover"
                />
              ) : (
                <div className="w-48 h-48 rounded-full bg-blue-100 flex items-center justify-center shadow-md">
                  <User className="w-24 h-24 text-blue-500" />
                </div>
              )}
            </div>
            
            <h3 className="text-2xl font-bold text-center">
              {currentUser?.displayName || 'User'}
            </h3>
            <p className="text-gray-500 text-center mt-2">{currentUser?.email || 'No email'}</p>
          </div>
          
          {/* User Details */}
          <div className="md:col-span-2 space-y-8">
            <h3 className="text-xl font-semibold border-b pb-4 mb-6">Profile Information</h3>
            
            <div className="space-y-6">
              <div className="flex items-center">
                <User className="w-6 h-6 text-blue-500 mr-4" />
                <div>
                  <div className="text-sm text-gray-500">Name</div>
                  <div className="font-medium text-lg">{currentUser?.displayName || 'Not set'}</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <Mail className="w-6 h-6 text-blue-500 mr-4" />
                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <div className="font-medium text-lg">{currentUser?.email || 'Not available'}</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <Calendar className="w-6 h-6 text-blue-500 mr-4" />
                <div>
                  <div className="text-sm text-gray-500">Account Created</div>
                  <div className="font-medium text-lg">
                    {userData?.onboardedAt ? formatDate(userData.onboardedAt) : 'Not available'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-8 mt-8 border-t">
              <h3 className="text-xl font-semibold mb-6">Account Preferences</h3>
              
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-4"
                onClick={() => {
                  // Add functionality for updating profile
                  alert("This feature is coming soon!");
                }}
              >
                Update Profile
              </button>
              
              <button
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;