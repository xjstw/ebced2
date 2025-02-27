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
  Divider,
  Badge,
  VStack,
  Progress,
  SimpleGrid,
  List,
  ListItem,
  ListIcon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
  Collapse,
} from '@chakra-ui/react'
import { MdWarning, MdCheckCircle } from 'react-icons/md'
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons'

interface LetterAnalysis {
  letter: string
  ebced: number
  element: string
  nurani_zulmani: string
  gender: string
}

interface MagicAnalysisResponse {
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
  issue_type: string
  issue_description: string
}

const getIssueColor = (issueType: string) => {
  switch (issueType) {
    case 'Fiziksel':
      return 'orange'
    case 'Nazar':
      return 'purple'
    case 'Sihir':
      return 'red'
    case 'Düşük Enerji':
      return 'yellow'
    case 'Yel veya Romatizma':
      return 'blue'
    default:
      return 'gray'
  }
}

const getRiskColor = (score: number) => {
  if (score < 30) return 'green'
  if (score < 60) return 'yellow'
  return 'red'
}

const MagicAnalysis: React.FC = () => {
  const [motherName, setMotherName] = useState('')
  const [childName, setChildName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<MagicAnalysisResponse | null>(null)
  const toast = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('http://localhost:8000/magic-analysis/analyze', {
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
            <Td>{letter.nurani_zulmani === 'N' ? 'Nurani' : 'Zulmani'}</Td>
            <Td>{letter.gender === 'E' ? 'Eril' : 'Dişil'}</Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  )

  const renderElementDistribution = (elements: Record<string, number>) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
      <VStack align="stretch" spacing={2}>
        <Button 
          onClick={() => setIsOpen(!isOpen)} 
          variant="ghost" 
          rightIcon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
          justifyContent="space-between"
          width="100%"
        >
          Element Dağılımı
        </Button>
        <Collapse in={isOpen}>
          {Object.entries(elements).map(([element, count]) => (
            <Box key={element}>
              <Text fontSize="sm">
                {element}: {count} harf
              </Text>
              <Progress
                value={count}
                colorScheme={
                  element === 'ATEŞ' ? 'red' :
                  element === 'HAVA' ? 'blue' :
                  element === 'TOPRAK' ? 'orange' :
                  'cyan'
                }
                size="sm"
              />
            </Box>
          ))}
        </Collapse>
      </VStack>
    )
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Stack spacing={8}>
        <Box>
          <Heading as="h1" size="xl" mb={4}>
            Büyü ve Nazar Analizi
          </Heading>
          <Text>
            Anne ve çocuk isimlerinin ebced değerlerini toplayıp 5'e bölerek kalan sayıya göre manevi sıkıntı türünü belirler
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
                size="lg"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Çocuk İsmi</FormLabel>
              <Input
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="Çocuk ismini girin"
                size="lg"
              />
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              isLoading={loading}
              loadingText="Analiz Ediliyor..."
            >
              Analiz Et
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
            <Box p={6} borderWidth={1} borderRadius="lg">
              <Heading size="md" mb={4}>
                Anne İsmi Analizi
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
                <Box>
                  <Text fontWeight="bold">İsim:</Text>
                  <Text>{result.mother_name}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Arapça Yazılış:</Text>
                  <Text className="arabic-text">{result.mother_arabic}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Ebced Değeri:</Text>
                  <Text>{result.mother_ebced}</Text>
                </Box>
              </SimpleGrid>
              {renderLetterAnalysis(result.mother_letters)}
            </Box>

            <Box p={6} borderWidth={1} borderRadius="lg">
              <Heading size="md" mb={4}>
                Çocuk İsmi Analizi
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
                <Box>
                  <Text fontWeight="bold">İsim:</Text>
                  <Text>{result.child_name}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Arapça Yazılış:</Text>
                  <Text className="arabic-text">{result.child_arabic}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Ebced Değeri:</Text>
                  <Text>{result.child_ebced}</Text>
                </Box>
              </SimpleGrid>
              {renderLetterAnalysis(result.child_letters)}
            </Box>

            <Box p={6} borderWidth={1} borderRadius="lg">
              <Heading size="md" mb={4}>
                Sonuç
              </Heading>
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text fontWeight="bold">Toplam Ebced Değeri:</Text>
                  <Text>{result.total_ebced}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">5'e Bölümünden Kalan:</Text>
                  <Text>{result.remainder}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Manevi Sıkıntı Türü:</Text>
                  <Badge
                    colorScheme={getIssueColor(result.issue_type)}
                    fontSize="lg"
                    p={2}
                    borderRadius="md"
                  >
                    {result.issue_type}
                  </Badge>
                </Box>
                <Box>
                  <Text fontWeight="bold">Açıklama:</Text>
                  <Text>{result.issue_description}</Text>
                </Box>
              </VStack>
            </Box>
          </Stack>
        )}
      </Stack>
    </Container>
  )
}

export default MagicAnalysis 