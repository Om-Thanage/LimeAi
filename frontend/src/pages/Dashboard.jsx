import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Dashboard.css";

function Dashboard() {
  const { currentUser, logout } = useAuth();

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="dashboard-header">
          <div className="dashboard-header-inner">
            <div>
              <h3 className="dashboard-title">Dashboard</h3>
              <p className="dashboard-subtitle">
                Welcome back, {currentUser?.displayName || currentUser?.email}
              </p>
            </div>
            <button onClick={logout} className="logout-button">
              Logout
            </button>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-body">
            <h3 className="card-title">Your Flowcharts</h3>
            <div className="create-button-container">
              <Link to="/flowchart" className="create-button">
                Create New Flowchart
              </Link>
            </div>
            <div className="empty-state">
              <p className="empty-state-text">No flowcharts created yet. Create your first one!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 