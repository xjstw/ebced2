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
  VStack,
  SimpleGrid,
  useToast,
  Card,
  CardBody,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react'

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

interface DiseaseProneMemberResponse {
  mother: PersonAnalysis
  child: PersonAnalysis
  total_ebced: number
  remainder: number
  disease_type: string
  disease_description: string
}

const getDiseaseColor = (diseaseType: string) => {
  switch (diseaseType) {
    case 'Baş bölgesi':
      return 'red'
    case 'Boğaz bölgesi':
      return 'orange'
    case 'Göğüs bölgesi':
      return 'yellow'
    case 'Üst Karın bölgesi':
      return 'green'
    case 'Alt Karın bölgesi':
      return 'teal'
    case 'Bacaklar':
      return 'blue'
    case 'Ayaklar':
      return 'purple'
    default:
      return 'gray'
  }
}

const DiseaseProneAnalysis: React.FC = () => {
  const [motherName, setMotherName] = useState('')
  const [childName, setChildName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<DiseaseProneMemberResponse | null>(null)
  const toast = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('http://localhost:8000/disease-prone/analyze', {
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
        throw new Error('Analiz sırasında bir hata oluştu')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      toast({
        title: 'Hata',
        description: err instanceof Error ? err.message : 'Bir hata oluştu',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

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
            <Text fontSize="sm">{element}: {count} ({((count / total) * 100).toFixed(1)}%)</Text>
            <Progress
              value={(count / total) * 100}
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
                <Text>
                  <strong>İsim:</strong> {person.name}
                </Text>
                <Text fontFamily="arabic">
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
          <Heading as="h1" size="xl" mb={4}>
            Hastalığa Yatkınlık Analizi
          </Heading>
          <Text>
            Anne ve çocuk isimlerinin ebced değerlerini toplayıp 7'ye bölerek kalan sayıya göre hastalık yatkınlığını belirler
          </Text>
        </Box>

        <Box as="form" onSubmit={handleSubmit}>
          <Card>
            <CardBody>
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
                  size="lg"
                  isLoading={loading}
                  loadingText="Analiz Ediliyor..."
                >
                  Analiz Et
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
            {renderPersonAnalysis(result.mother, "Anne İsmi Analizi", "pink")}
            {renderPersonAnalysis(result.child, "Çocuk İsmi Analizi", "blue")}

            <Card>
              <CardBody>
                <VStack align="stretch" spacing={4}>
                  <Heading as="h3" size="md">
                    Sonuç
                  </Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <Stat>
                      <StatLabel>Toplam Ebced Değeri</StatLabel>
                      <StatNumber>{result.total_ebced}</StatNumber>
                      <StatHelpText>7'ye bölümünden kalan: {result.remainder}</StatHelpText>
                    </Stat>
                    <Box>
                      <Text fontWeight="bold" mb={2}>Hastalık Yatkınlığı:</Text>
                      <Badge
                        colorScheme={getDiseaseColor(result.disease_type)}
                        p={2}
                        borderRadius="md"
                        fontSize="md"
                      >
                        {result.disease_type}
                      </Badge>
                      <Text mt={2} fontSize="sm" color="gray.600">
                        {result.disease_description}
                      </Text>
                    </Box>
                  </SimpleGrid>
                </VStack>
              </CardBody>
            </Card>
          </Stack>
        )}
      </Stack>
    </Container>
  )
}

export default DiseaseProneAnalysis 