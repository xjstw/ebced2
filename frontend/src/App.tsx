import { Box, Container, Heading, Flex, Link as ChakraLink } from '@chakra-ui/react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate, Outlet } from 'react-router-dom'
import { useState } from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import Navbar from './components/Navbar'
import CoupleMatch from './pages/CoupleMatch'
import NameCoaching from './pages/NameCoaching'
import ComprehensiveAnalysis from './pages/ComprehensiveAnalysis'
import FinancialBlessing from './pages/FinancialBlessing'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import AnalysisReport from './pages/AnalysisReport'
import CoupleAnalysisReport from './pages/CoupleAnalysisReport'
import NameCoachingReport from './pages/NameCoachingReport'
import './App.css'

// Tip tanımlamaları
interface EsmaInfo {
  ebced: number
  name: string
  arabic: string
  meaning: string
}

interface Result {
  name: string
  arabic: string
  ebced: number
  is_calculated: boolean
  nearest_match: EsmaInfo | null
}

interface EsmaValue {
  name: string;
  ebced: number;
  arabic: string;
  element: string;
  coefficient: number;
}

interface DiseaseResult {
  elements: Record<string, number>;
  element_ebced: Record<string, number>;
  esma_values: EsmaValue[];
  total_score: number;
}

// Mevcut bileşenleri ayrı dosyalara taşıyacağız, şimdilik burada tutalım
import NameQuery from './pages/NameQuery'
import DiseaseQuery from './pages/DiseaseQuery'
import MagicAnalysis from './pages/MagicAnalysis'
import DiseaseProneAnalysis from './pages/DiseaseProneAnalysis'
import ManagerEsma from './pages/ManagerEsma'
import PersonalManagerEsma from './pages/PersonalManagerEsma'
import DiseaseElementCalculation from './pages/DiseaseElementCalculation'
import ManagerVerse from './pages/ManagerVerse'

// Protected Layout component
const ProtectedLayout: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <nav className="bg-gray-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span>Hoş geldiniz, <Box as="span" color="red.500" display="inline">{user?.username}</Box> </span>
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      </nav>
      <Box>
        <Navbar />
        <Box p={4}>
          <Outlet />
        </Box>
      </Box>
    </>
  );
};

// Main App content component
const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="App">
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
        />
        
        {/* Protected Routes */}
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<ComprehensiveAnalysis />} />
          <Route path="/couple-match" element={<CoupleMatch />} />
          <Route path="/name-coaching" element={<NameCoaching />} />
          <Route path="/disease-query" element={<DiseaseQuery />} />
          <Route path="/magic-analysis" element={<MagicAnalysis />} />
          <Route path="/disease-prone" element={<DiseaseProneAnalysis />} />
          <Route path="/manager-esma" element={<ManagerEsma />} />
          <Route path="/personal-manager-esma" element={<PersonalManagerEsma />} />
          <Route path="/manager-verse" element={<ManagerVerse />} />
          <Route path="/financial-blessing" element={<FinancialBlessing />} />
          <Route path="/name-query" element={<NameQuery />} />
          <Route path="/analysis-report" element={<AnalysisReport />} />
          <Route path="/couple-analysis-report" element={<CoupleAnalysisReport />} />
          <Route path="/name-coaching-report" element={<NameCoachingReport />} />
        </Route>
      </Routes>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ChakraProvider>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ChakraProvider>
  );
};

// Form bileşeni
const NameForm = ({ 
  setResult 
}: { 
  setResult: (result: Result) => void
}) => {
  const [name, setName] = useState('')
  const [gender, setGender] = useState('erkek')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // İsim hesaplama
      const response = await fetch('http://localhost:8000/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, gender }),
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Hata:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box as="form" onSubmit={handleSubmit} p={6} bg="white" borderRadius="lg" boxShadow="md">
      <Box mb={4}>
        <label>
          İsim:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '8px',
              marginTop: '4px',
              borderRadius: '4px',
              border: '1px solid #e2e8f0',
            }}
          />
        </label>
      </Box>

      <Box mb={4}>
        <label>
          Cinsiyet:
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '8px',
              marginTop: '4px',
              borderRadius: '4px',
              border: '1px solid #e2e8f0',
            }}
          >
            <option value="erkek">Erkek</option>
            <option value="kadın">Kadın</option>
          </select>
        </label>
      </Box>

      <button
        type="submit"
        disabled={isLoading}
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: '#3182ce',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        {isLoading ? 'Hesaplanıyor...' : 'Hesapla'}
      </button>
    </Box>
  )
}

// Sonuç bileşeni
const ResultCard = ({ result }: { result: Result }) => {
  return (
    <Box p={6} bg="white" borderRadius="lg" boxShadow="md">
      <Box mb={4}>
        <Heading as="h2" size="md" color="blue.600" mb={2}>
          İsim Bilgileri
          {result.is_calculated && (
            <Box
              as="span"
              ml={2}
              px={2}
              py={1}
              bg="orange.100"
              color="orange.800"
              fontSize="sm"
              borderRadius="md"
            >
              Otomatik Hesaplandı
            </Box>
          )}
        </Heading>
        <Box mb={2}>
          <strong>İsim:</strong> {result.name}
        </Box>
        <Box mb={2} className="arabic-text">
          <strong>Arapça Yazılışı:</strong> {result.arabic}
        </Box>
        <Box color="green.600" fontWeight="bold">
          <strong>Ebced Değeri:</strong> {result.ebced}
        </Box>
      </Box>

      {result.nearest_match && (
        <Box mb={4}>
          <Heading as="h3" size="sm" color="blue.600" mb={2} display="flex" alignItems="center">
            {result.ebced === result.nearest_match.ebced ? (
              "Esma Değeri"
            ) : (
              <>
                En Yakın Esma
                <Box
                  as="span"
                  ml={2}
                  px={2}
                  py={1}
                  bg="yellow.100"
                  color="yellow.800"
                  fontSize="sm"
                  borderRadius="md"
                >
                  Yakın Eşleşme
                </Box>
              </>
            )}
          </Heading>
          <Box mb={2}>
            <strong>Esma:</strong> {result.nearest_match.name}
          </Box>
          <Box fontStyle="italic">
            <strong>Anlamı:</strong> {result.nearest_match.meaning}
          </Box>
          <Box color="purple.600">
            <strong>Ebced Değeri:</strong> {result.nearest_match.ebced}
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default App
