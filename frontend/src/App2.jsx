import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Footer } from './components/Footer'

const App2 = () => {
  return (
    <Router>
      <Header/>
      <Hero/>
      <Footer/>
    </Router>
  )
}

export default App2