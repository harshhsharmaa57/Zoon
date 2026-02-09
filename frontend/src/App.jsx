import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import LandingPage from './pages/landing.jsx'
import {Route, BrowserRouter as Router, Routes } from 'react-router-dom';

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Router>
          <Routes>
            <Route path='/' element= {<LandingPage/>}/>
          </Routes>
      </Router>
    </>
  )
}

export default App
