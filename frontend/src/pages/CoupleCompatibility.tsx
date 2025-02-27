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
  Badge,
} from '@chakra-ui/react'

interface LetterAnalysis {
  letter: string
  ebced: number
  arabic: string
}

interface CoupleCompatibilityResponse {
  woman_name: string
  woman_arabic: string
  woman_ebced: number
  woman_letters: LetterAnalysis[]
  man_name: string
  man_arabic: string
  man_ebced: number
  man_letters: LetterAnalysis[]
  total_ebced: number
  total_with_seven: number
  remainder: number
  compatibility: string
  compatibility_level: string
}

const getCompatibilityColor = (level: string) => {
  switch (level) {
    case 'Yüksek':
      return 'green'
    case 'Orta':
      return 'yellow'
    case 'Düşük':
      return 'orange'
    case 'Çok Düşük':
      return 'red'
    default:
      return 'gray'
  }
}

export default function CoupleCompatibility() {
  const [womanName, setWomanName] = useState('')
  const [manName, setManName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<CoupleCompatibilityResponse | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('http://localhost:8000/couple-compatibility/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          woman_name: womanName,
          man_name: manName,
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
            Evlenecek Çiftler İçin Uyum Analizi
          </Heading>
        </Box>

        <Box as="form" onSubmit={handleSubmit}>
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Kadın İsmi</FormLabel>
              <Input
                value={womanName}
                onChange={(e) => setWomanName(e.target.value)}
                placeholder="Kadın ismini girin"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Erkek İsmi</FormLabel>
              <Input
                value={manName}
                onChange={(e) => setManName(e.target.value)}
                placeholder="Erkek ismini girin"
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
                    Kadın İsmi Analizi
                  </Heading>
                  <Text>
                    İsim: {result.woman_name} ({result.woman_arabic})
                  </Text>
                  <Text>Ebced Değeri: {result.woman_ebced}</Text>
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Harf</Th>
                        <Th>Arapça</Th>
                        <Th>Ebced</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {result.woman_letters.map((letter, index) => (
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
                    Erkek İsmi Analizi
                  </Heading>
                  <Text>
                    İsim: {result.man_name} ({result.man_arabic})
                  </Text>
                  <Text>Ebced Değeri: {result.man_ebced}</Text>
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Harf</Th>
                        <Th>Arapça</Th>
                        <Th>Ebced</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {result.man_letters.map((letter, index) => (
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
                  <Text>7 Eklendikten Sonra: {result.total_with_seven}</Text>
                  <Text>9'a Bölümünden Kalan: {result.remainder}</Text>
                  <Stack direction="row" align="center" spacing={2} mt={2}>
                    <Text fontWeight="bold" fontSize="lg">
                      Uyum Durumu:
                    </Text>
                    <Badge
                      colorScheme={getCompatibilityColor(result.compatibility_level)}
                      fontSize="lg"
                      px={2}
                      py={1}
                      borderRadius="md"
                    >
                      {result.compatibility} ({result.compatibility_level})
                    </Badge>
                  </Stack>
                </Box>
              </Stack>
            </Box>
          </Stack>
        )}
      </Stack>
    </Container>
  )
} 