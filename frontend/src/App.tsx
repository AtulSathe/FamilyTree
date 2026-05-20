import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TreePage from './pages/TreePage'
import PersonDetailPage from './pages/PersonDetailPage'
import SurnameRelationshipsPage from './pages/SurnameRelationshipsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TreePage />} />
        <Route path="/person/:id" element={<PersonDetailPage />} />
        <Route path="/surnames" element={<SurnameRelationshipsPage />} />
      </Routes>
    </BrowserRouter>
  )
}
