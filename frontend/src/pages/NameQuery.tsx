import { Box, Container, Heading } from '@chakra-ui/react'
import { useState } from 'react'

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

const NameQuery = () => {
  const [result, setResult] = useState<Result | null>(null)

  return (
    <Box>
      <Box mb={8}>
        <Heading as="h1" size="xl" textAlign="center" color="blue.600">
          İsim Sorgulama
        </Heading>
      </Box>
      
      {/* Form bileşeni */}
      <Box mb={8}>
        <NameForm setResult={setResult} />
      </Box>
      
      {/* Sonuç bileşeni */}
      {result && <ResultCard result={result} />}
    </Box>
  )
}

// Form bileşeni
const NameForm = ({ 
  setResult 
}: { 
  setResult: (result: Result) => void
}) => {
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:8000/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
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

export default NameQuery 