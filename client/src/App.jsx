import './App.css'
import RecommendationDashboard from './components/RecommendationDashboard'

function App() {
  return (
<div>
      <header className="hero">
        <h1>Product recommendations dashboard</h1>
        <p className="hero-sub">Get Your desired products in minutes</p>
      </header>

      <main className="container main-content">
        <RecommendationDashboard />
      </main>
    </div>
  )
}

export default App