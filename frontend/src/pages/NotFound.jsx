import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 py-12">
      <div className="flex">
        <Link to="/" aria-label="Home">
          <img 
            src="/assets/images/1.png" 
            alt="LimeAI Logo" 
            className="h-25 w-auto" 
          />
        </Link>
      </div>
      <p className="mt-5 text-2xl font-medium text-gray-700">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-gray-900">
        Page not found
      </h1>
      <p className="mt-3 text-m text-gray-700">
        Sorry, we couldn't find the page you're looking for.
      </p>
      <Link 
        to="/dashboard"
        className="mt-10 inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        Go back home
      </Link>
    </div>
  )
}