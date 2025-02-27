import React, { useState } from 'react'
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
  Badge,
  SimpleGrid,
  VStack,
  Card,
  CardBody,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
} from '@chakra-ui/react'
import { api } from '../api/config';
import { useNavigate } from 'react-router-dom';

interface LetterAnalysis {
  letter: string
  ebced: number
  element: string
  nurani_zulmani: string
  gender: string
}

interface PersonAnalysis {
  name: string
  arabic: string
  ebced: number
  letters: LetterAnalysis[]
  element_counts: Record<string, number>
  nurani_ratio: number
  gender_ratio: number
}

interface CoupleCompatibilityResponse {
  male: PersonAnalysis
  female: PersonAnalysis
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

const CoupleMatch: React.FC = () => {
  const [femaleName, setFemaleName] = useState('')
  const [maleName, setMaleName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<CoupleCompatibilityResponse | null>(null)
  const toast = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await api.post('/couple-compatibility/calculate', {
        female_name: femaleName,
        male_name: maleName,
      });

      const data = await response.json()
      setResult(data)
      toast({
        title: 'Hesaplama Tamamlandı',
        description: 'Çift uyum analizi başarıyla gerçekleştirildi.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bir hata oluştu';
      setError(errorMessage);
      toast({
        title: 'Hata',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false)
    }
  }

  const handleViewReport = () => {
    navigate('/couple-analysis-report', { state: { result } });
  };

  const renderLetterAnalysis = (letters: LetterAnalysis[]) => (
    <Table size="sm" variant="simple">
      <Thead>
        <Tr>
          <Th>Harf</Th>
          <Th>Ebced</Th>
          <Th>Element</Th>
          <Th>Nurani/Zulmani</Th>
          <Th>Cinsiyet</Th>
        </Tr>
      </Thead>
      <Tbody>
        {letters.map((letter, index) => (
          <Tr key={index}>
            <Td>{letter.letter}</Td>
            <Td>{letter.ebced}</Td>
            <Td>{letter.element}</Td>
            <Td>{letter.nurani_zulmani}</Td>
            <Td>{letter.gender}</Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  )

  const renderElementDistribution = (elementCounts: Record<string, number>) => {
    const total = Object.values(elementCounts).reduce((a, b) => a + b, 0)
    return (
      <VStack align="stretch" spacing={2}>
        <Text fontWeight="bold">Element Dağılımı:</Text>
        {Object.entries(elementCounts).map(([element, count]) => (
          <Box key={element}>
            <Text fontSize="sm">{element}: {count}</Text>
            <Progress
              value={count}
              colorScheme={element === 'ATEŞ' ? 'red' : element === 'HAVA' ? 'blue' : element === 'TOPRAK' ? 'orange' : 'cyan'}
              size="sm"
            />
          </Box>
        ))}
      </VStack>
    )
  }

  const renderPersonAnalysis = (person: PersonAnalysis, title: string, bgColor: string) => (
    <Card>
      <CardBody>
        <VStack align="stretch" spacing={4}>
          <Heading as="h3" size="md" color={`${bgColor}.700`}>
            {title}
          </Heading>
          <Box bg={`${bgColor}.50`} p={4} borderRadius="md">
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Box>
                <Text noOfLines={1}>
                  <strong>İsim:</strong> {person.name}
                </Text>
                <Text fontFamily="arabic" noOfLines={1}>
                  <strong>Arapça:</strong> {person.arabic}
                </Text>
                <Text color={`${bgColor}.600`} fontWeight="bold">
                  <strong>Ebced Değeri:</strong> {person.ebced}
                </Text>
              </Box>
            </SimpleGrid>
          </Box>
          {renderElementDistribution(person.element_counts)}
          {renderLetterAnalysis(person.letters)}
        </VStack>
      </CardBody>
    </Card>
  )

  return (
    <Container maxW="container.xl" py={8}>
      <Stack spacing={8}>
        <Box textAlign="center">
          <Heading as="h1" size="xl" color="blue.600" mb={4}>
            Evlenecek Çiftler İçin Uyum Analizi
          </Heading>
          <Text mt={2} fontWeight="medium" color="gray.700">
            Uyum Seviyeleri:
            <Badge colorScheme="green" ml={2}>5,7: Uyumlu</Badge>
            <Badge colorScheme="yellow" ml={2}>1,2,8: Orta Uyumlu</Badge>
            <Badge colorScheme="orange" ml={2}>3: Problemli</Badge>
            <Badge colorScheme="red" ml={2}>4: Stresli</Badge>
            <Badge colorScheme="red" ml={2}>6,9,0: Yıpratıcı</Badge>
          </Text>
        </Box>

        <Box as="form" onSubmit={handleSubmit}>
          <Card>
            <CardBody>
              <Stack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Kadın İsmi</FormLabel>
                  <Input
                    value={femaleName}
                    onChange={(e) => setFemaleName(e.target.value)}
                    placeholder="Kadın ismini girin"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Erkek İsmi</FormLabel>
                  <Input
                    value={maleName}
                    onChange={(e) => setMaleName(e.target.value)}
                    placeholder="Erkek ismini girin"
                  />
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  isLoading={loading}
                  loadingText="Hesaplanıyor..."
                >
                  Hesapla
                </Button>
              </Stack>
            </CardBody>
          </Card>
        </Box>

        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {result && (
          <Stack spacing={6}>
            {renderPersonAnalysis(result.female, "Kadın İsmi Analizi", "pink")}
            {renderPersonAnalysis(result.male, "Erkek İsmi Analizi", "blue")}

            <Card>
              <CardBody>
                <VStack align="stretch" spacing={4}>
                  <Box p={4} bg="gray.50" borderRadius="md">
                    <VStack align="stretch" spacing={3}>
                      <Text><strong>5 ve 7:</strong> Gayet uyumlu bir çift</Text>
                      <Text><strong>1, 2 ve 8:</strong> Orta uyumlu</Text>
                      <Text><strong>3:</strong> İlk başta gayet güzel giden sonrası problemli olabilir</Text>
                      <Text><strong>4:</strong> Ayrılma ihtimalleri düşük olsa da stresli geçen evlilik süreci</Text>
                      <Text><strong>6 ve 9:</strong> Birbirlerini yıpratabilirler o nedenle çok fazla önerilmez!</Text>
                      <Text><strong>0:</strong> Birbirlerini yıpratabilirler o nedenle çok fazla önerilmez!</Text>
                    </VStack>
                  </Box>
                  <Heading as="h3" size="md">
                    Hesaplama Sonucu
                  </Heading>
                  <Box 
                    mt={4} 
                    p={6} 
                    borderRadius="lg" 
                    bg={`${getCompatibilityColor(result.compatibility_level)}.50`}
                    borderWidth={2}
                    borderColor={`${getCompatibilityColor(result.compatibility_level)}.200`}
                    maxW="100%"
                  >
                    <VStack spacing={4} align="center">
                      <Text fontSize="lg" fontWeight="bold" color={`${getCompatibilityColor(result.compatibility_level)}.700`}>
                        Uyum Durumu
                      </Text>
                      <Badge
                        colorScheme={getCompatibilityColor(result.compatibility_level)}
                        fontSize="xl"
                        px={4}
                        py={2}
                        borderRadius="lg"
                        whiteSpace="normal"
                        textAlign="center"
                      >
                        {result.compatibility}
                      </Badge>
                    </VStack>
                  </Box>

                  <Button
                    onClick={handleViewReport}
                    colorScheme="blue"
                    size="lg"
                    mt={4}
                  >
                    Detaylı Raporu Görüntüle
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          </Stack>
        )}
      </Stack>
    </Container>
  )
}

export default CoupleMatch 