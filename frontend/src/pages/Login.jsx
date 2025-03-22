import React, { useState, useEffect } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore"
import { Link } from "react-router-dom"
import "./Login.css"


function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      checkUserStatus(currentUser.uid);
    }
  }, [currentUser]);

  const checkUserStatus = async (userId) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists() && userDoc.data().onboarded) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch (error) {
      console.error("Error checking user status:", error);
    }
  };

  // Handle Google Sign-In
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

//   return (
//     <div className="flex justify-center items-center min-h-screen bg-gray-100">
//       <div className="w-[440px] bg-white p-8 rounded-lg shadow-lg">
//         <div className="text-center mb-10">
//           <h1 className="text-3xl font-semibold text-gray-800">Login</h1>
//         </div>

//         {/* Google Sign-In Button */}
//         <div className="flex justify-center">
//         <button
//           onClick={handleGoogleLogin}
//           disabled={loading}
//           className="w-[60%] h-12 bg-gray-900 text-white rounded-full flex items-center justify-center gap-3 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
//         >
//           {loading ? (
//             <span>Loading...</span>
//           ) : (
//             <>
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 viewBox="0 0 48 48"
//                 width="20px"
//                 height="20px"
//               >
//                 <path
//                   fill="#FFC107"
//                   d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
//                 />
//                 <path
//                   fill="#FF3D00"
//                   d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
//                 />
//                 <path
//                   fill="#4CAF50"
//                   d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
//                 />
//                 <path
//                   fill="#1976D2"
//                   d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
//                 />
//               </svg>
//               <span className="font-medium">Sign in with Google</span>
//             </>
//           )}
//         </button>
//         </div>

//         {/* Error Message */}
//         {error && (
//           <div className="mt-4 text-red-500 text-sm text-center">{error}</div>
//         )}

//       </div>
//     </div>
//   );
return (
    <div className="login-container">
      {/* Left side with illustration */}
      <div className="login-illustration login-gradient">
        <div className="login-content">
          <h1 className="login-title">ConceptFlow</h1>
          <p className="login-subtitle">Visualize complex concepts with AI-generated flowcharts</p>
          <div className="login-features">
            <div className="login-feature-item">
              <div className="login-feature-icon">
                <svg className="login-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="login-feature-text">Intuitive flowchart generation</p>
            </div>
            <div className="login-feature-item">
              <div className="login-feature-icon">
                <svg className="login-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="login-feature-text">AI-powered concept mapping</p>
            </div>
            <div className="login-feature-item">
              <div className="login-feature-icon">
                <svg className="login-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="login-feature-text">Easy sharing and collaboration</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side with login form */}
      <div className="login-form-container">
        <div className="login-form-content">
          <div className="login-header">
            <h1 className="login-mobile-logo">ConceptFlow</h1>
            <h2 className="login-heading">Welcome back</h2>
            <p className="login-subheading">
              Sign in to continue to your account
            </p>
          </div>
          
          <div>
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="login-google-btn"
            >
              {loading ? (
                <div className="login-loading">
                  <svg className="login-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="login-spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="login-spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="login-btn-content">
                  <svg className="login-google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                      <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                      <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                      <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                      <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                    </g>
                  </svg>
                  <span>Sign in with Google</span>
                </div>
              )}
            </button>
            
            {error && (
              <div className="login-error">
                {error}
              </div>
            )}
            
            <div className="login-signup-link">
              <p className="login-signup-text">
                Don't have an account yet?{' '}
                <Link to="/register" className="login-link">
                  Sign up for free
                </Link>
              </p>
            </div>
          </div>
          
          <div className="login-footer">
            <p className="login-copyright">
              &copy; 2024 ConceptFlow. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

}

export default Login;