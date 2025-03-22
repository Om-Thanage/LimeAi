import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { currentUser, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Dashboard
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Welcome back, {currentUser?.displayName || currentUser?.email}
              </p>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Your Flowcharts
            </h3>
            <div className="mt-5">
              <Link
                to="/flowchart"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create New Flowchart
              </Link>
            </div>
            <div className="mt-8">
              <p className="text-gray-500">No flowcharts created yet. Create your first one!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 