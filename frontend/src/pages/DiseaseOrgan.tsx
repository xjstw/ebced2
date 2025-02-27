import { useState } from 'react'
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Alert,
  AlertIcon,
  Divider,
} from '@chakra-ui/react'

interface LetterAnalysis {
  letter: string
  ebced: number
  arabic: string
}

interface DiseaseOrganResponse {
  mother_name: string
  mother_arabic: string
  mother_ebced: number
  mother_letters: LetterAnalysis[]
  child_name: string
  child_arabic: string
  child_ebced: number
  child_letters: LetterAnalysis[]
  total_ebced: number
  remainder: number
  organ: string
}

export default function DiseaseOrgan() {
  const [motherName, setMotherName] = useState('')
  const [childName, setChildName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<DiseaseOrganResponse | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('http://localhost:8000/disease-organ/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mother_name: motherName,
          child_name: childName,
        }),
      })

      if (!response.ok) {
        throw new Error('Hesaplama sırasında bir hata oluştu')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Stack spacing={8}>
        <Box>
          <Heading as="h1" size="xl" mb={4}>
            Hastalığa Yatkın Organ Hesaplama
          </Heading>
          <Text>
            Anne ve çocuk isimlerinin ebced değerleri toplanır. Toplam değer 7'ye bölünür.
            Kalan sayıya göre hastalığa yatkın organ belirlenir.
          </Text>
        </Box>

        <Box as="form" onSubmit={handleSubmit}>
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Anne İsmi</FormLabel>
              <Input
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
                placeholder="Anne ismini girin"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Çocuk İsmi</FormLabel>
              <Input
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="Çocuk ismini girin"
              />
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              isLoading={loading}
              loadingText="Hesaplanıyor..."
            >
              Hesapla
            </Button>
          </Stack>
        </Box>

        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {result && (
          <Stack spacing={6}>
            <Box>
              <Heading as="h2" size="lg" mb={4}>
                Sonuçlar
              </Heading>
              
              <Stack spacing={4}>
                <Box>
                  <Heading as="h3" size="md" mb={2}>
                    Anne İsmi Analizi
                  </Heading>
                  <Text>
                    İsim: {result.mother_name} ({result.mother_arabic})
                  </Text>
                  <Text>Ebced Değeri: {result.mother_ebced}</Text>
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Harf</Th>
                        <Th>Arapça</Th>
                        <Th>Ebced</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {result.mother_letters.map((letter, index) => (
                        <Tr key={index}>
                          <Td>{letter.letter}</Td>
                          <Td>{letter.arabic}</Td>
                          <Td>{letter.ebced}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>

                <Divider />

                <Box>
                  <Heading as="h3" size="md" mb={2}>
                    Çocuk İsmi Analizi
                  </Heading>
                  <Text>
                    İsim: {result.child_name} ({result.child_arabic})
                  </Text>
                  <Text>Ebced Değeri: {result.child_ebced}</Text>
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Harf</Th>
                        <Th>Arapça</Th>
                        <Th>Ebced</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {result.child_letters.map((letter, index) => (
                        <Tr key={index}>
                          <Td>{letter.letter}</Td>
                          <Td>{letter.arabic}</Td>
                          <Td>{letter.ebced}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>

                <Divider />

                <Box>
                  <Heading as="h3" size="md" mb={2}>
                    Hesaplama Sonucu
                  </Heading>
                  <Text>Toplam Ebced Değeri: {result.total_ebced}</Text>
                  <Text>7'ye Bölümünden Kalan: {result.remainder}</Text>
                  <Text fontWeight="bold" fontSize="lg" mt={2}>
                    Hastalığa Yatkın Organ: {result.organ}
                  </Text>
                </Box>
              </Stack>
            </Box>
          </Stack>
        )}
      </Stack>
    </Container>
  )
} 