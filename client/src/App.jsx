import './App.css'
import RecommendationDashboard from './components/RecommendationDashboard'

function App() {
  return (
    <div className="app-root">
      <header>
        <h1>Product Recommendation Dashboard</h1>
        <p>Upload a product catalog, send user behavior, and get LLM explanations.</p>
      </header>
      <main>
        <RecommendationDashboard />
      </main>
    </div>
  )
}

export default App
