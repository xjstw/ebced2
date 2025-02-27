import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
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
  Card,
  CardHeader,
  CardBody,
  Collapse,
} from '@chakra-ui/react'
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons'

interface LetterAnalysis {
  letter: string
  ebced: number
  arabic: string
}

interface EsmaAnalysis {
  name: string
  arabic: string
  ebced: number
  ebced_difference: number
  meaning: string
  dominant_element: string
  element_counts: Record<string, number>
}

interface PersonalDiseaseResponse {
  name: string
  name_arabic: string
  name_ebced: number
  name_letters: LetterAnalysis[]
  element: string
  matching_esmas: EsmaAnalysis[]
}

interface Element {
  value: string
  description: string
}

const getElementColor = (element: string) => {
  switch (element) {
    case 'ATEŞ':
      return 'red'
    case 'HAVA':
      return 'cyan'
    case 'TOPRAK':
      return 'orange'
    case 'SU':
      return 'blue'
    default:
      return 'gray'
  }
}

export default function PersonalDisease() {
  const [name, setName] = useState('')
  const [element, setElement] = useState('')
  const [elements, setElements] = useState<Element[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<PersonalDiseaseResponse | null>(null)
  const [isElementOpen, setIsElementOpen] = useState<{[key: number]: boolean}>({})

  useEffect(() => {
    // Element listesini yükle
    fetch('http://localhost:8000/personal-disease/elements')
      .then((response) => response.json())
      .then((data) => setElements(data))
      .catch((err) => console.error('Elementler yüklenirken hata oluştu:', err))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('http://localhost:8000/personal-disease/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          element: element,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Hesaplama sırasında bir hata oluştu')
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
            Kişiye Özel Hastalık Sorgu
          </Heading>
          <Text>
            Kişinin isminin ebced değeri hesaplanır ve seçilen elemente göre en uygun esmalar belirlenir.
          </Text>
        </Box>

        <Box as="form" onSubmit={handleSubmit}>
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>İsim</FormLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="İsminizi girin"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Hastalık Elementi</FormLabel>
              <Select
                value={element}
                onChange={(e) => setElement(e.target.value)}
                placeholder="Element seçin"
              >
                {elements.map((elem) => (
                  <option key={elem.value} value={elem.value}>
                    {elem.value} - {elem.description}
                  </option>
                ))}
              </Select>
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
                    İsim Analizi
                  </Heading>
                  <Text>
                    İsim: {result.name} ({result.name_arabic})
                  </Text>
                  <Text>Ebced Değeri: {result.name_ebced}</Text>
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Harf</Th>
                        <Th>Arapça</Th>
                        <Th>Ebced</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {result.name_letters.map((letter, index) => (
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
                    Seçilen Element
                  </Heading>
                  <Badge
                    colorScheme={getElementColor(result.element)}
                    fontSize="lg"
                    px={2}
                    py={1}
                    borderRadius="md"
                  >
                    {result.element}
                  </Badge>
                </Box>

                <Divider />

                <Box>
                  <Heading as="h3" size="md" mb={4}>
                    Uygun Esmalar
                  </Heading>
                  <Stack spacing={4}>
                    {result.matching_esmas.map((esma, index) => (
                      <Card key={index}>
                        <CardHeader pb={2}>
                          <Stack direction="row" align="center" justify="space-between">
                            <Heading size="sm">
                              {esma.name} ({esma.arabic})
                            </Heading>
                            <Badge colorScheme={getElementColor(esma.dominant_element)}>
                              {esma.dominant_element}
                            </Badge>
                          </Stack>
                        </CardHeader>
                        <CardBody pt={0}>
                          <Text fontSize="lg" fontWeight="bold">
                            {esma.name} ({esma.arabic})
                          </Text>
                          <Text>Ebced Değeri: {esma.ebced}</Text>
                          <Text>Baskın Element: {esma.dominant_element}</Text>
                          <Box mt={2}>
                            <Button
                              onClick={() => {
                                const newState = { ...isElementOpen }
                                newState[index] = !newState[index]
                                setIsElementOpen(newState)
                              }}
                              variant="ghost"
                              rightIcon={isElementOpen[index] ? <ChevronUpIcon /> : <ChevronDownIcon />}
                              justifyContent="space-between"
                              width="100%"
                            >
                              Element Dağılımı
                            </Button>
                            <Collapse in={isElementOpen[index]}>
                              <Stack direction="row" spacing={4} mt={2}>
                                {Object.entries(esma.element_counts).map(([element, count]) => (
                                  <Text key={element}>{element}: {count}</Text>
                                ))}
                              </Stack>
                            </Collapse>
                          </Box>
                          <Divider my={2} />
                          <Text>Anlamı: {esma.meaning}</Text>
                        </CardBody>
                      </Card>
                    ))}
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