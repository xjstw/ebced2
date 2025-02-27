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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
} from '@chakra-ui/react'

interface ElementAnalysis {
  count: number
  ebced: number
}

interface NuraniAnalysis {
  total_count: number
  total_ebced: number
  elements: Record<string, ElementAnalysis>
  dominant_element: string
}

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
  nurani_analysis: NuraniAnalysis
  letters: LetterAnalysis[]
}

interface EsmaRecommendation {
  name: string
  arabic: string
  ebced: number
  meaning: string
  element_counts: Record<string, number>
  selection_reason: string
}

interface VerseRecommendation {
  surah_number: number
  verse_number: number
  arabic_text: string
  meaning: string
  calculation_type: string
  calculation_steps: string[]
}

interface PersonalDiseaseResponse {
  mother: PersonAnalysis
  child: PersonAnalysis
  disease: PersonAnalysis
  combined_analysis: NuraniAnalysis
  recommended_esmas: EsmaRecommendation[]
  recommended_verses: VerseRecommendation[]
  warning_message: string
}

const DiseaseQuery: React.FC = () => {
  const [motherName, setMotherName] = useState('')
  const [childName, setChildName] = useState('')
  const [diseaseName, setDiseaseName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PersonalDiseaseResponse | null>(null)
  const toast = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('http://localhost:8000/personal-disease/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mother_name: motherName,
          child_name: childName,
          disease_name: diseaseName,
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

  const renderElementDistribution = (elements: Record<string, ElementAnalysis>) => {
    const total_count = Object.values(elements).reduce((sum, el) => sum + el.count, 0)
    const total_ebced = Object.values(elements).reduce((sum, el) => sum + el.ebced, 0)
    
    return (
      <VStack align="stretch" spacing={2}>
        <Text fontWeight="bold">Element Dağılımı (Nurani Harfler):</Text>
        {Object.entries(elements).map(([element, analysis]) => (
          <Box key={element}>
            <Text fontSize="sm">
              {element}: {analysis.count} harf ({((analysis.count / total_count) * 100).toFixed(1)}%) - 
              Ebced: {analysis.ebced} ({((analysis.ebced / total_ebced) * 100).toFixed(1)}%)
            </Text>
            <Progress
              value={(analysis.count / total_count) * 100}
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
        <Text fontSize="sm" mt={2}>
          Toplam Nurani Harf: {total_count} - Toplam Ebced: {total_ebced}
        </Text>
      </VStack>
    )
  }

  const renderPersonAnalysis = (analysis: PersonAnalysis, title: string) => (
    <Card>
      <CardBody>
        <VStack align="stretch" spacing={4}>
          <Heading as="h3" size="md">
            {title}
          </Heading>
          
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Box>
              <Text>
                <strong>İsim:</strong> {analysis.name}
              </Text>
              <Text fontFamily="arabic">
                <strong>Arapça:</strong> {analysis.arabic}
              </Text>
            </Box>
          </SimpleGrid>

          {renderElementDistribution(analysis.nurani_analysis.elements)}
          
          <Box>
            <Text fontWeight="bold" mb={2}>Harf Analizi:</Text>
            {renderLetterAnalysis(analysis.letters)}
          </Box>
        </VStack>
      </CardBody>
    </Card>
  )

  const renderEsmaRecommendations = (esmas: EsmaRecommendation[]) => (
    <Card>
      <CardBody>
        <VStack align="stretch" spacing={4}>
          <Heading as="h3" size="md">
            Önerilen Esmalar
          </Heading>
          
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            {esmas.map((esma, index) => (
              <Box
                key={index}
                p={4}
                borderWidth={1}
                borderRadius="md"
                borderColor="blue.200"
                bg="blue.50"
              >
                <Text fontSize="lg" fontWeight="bold" mb={2}>
                  {esma.name} ({esma.ebced})
                </Text>
                <Text fontFamily="arabic" mb={2}>
                  {esma.arabic}
                </Text>
                <Text fontSize="sm" mb={2}>
                  {esma.meaning}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {esma.selection_reason}
                </Text>
                <Box mt={2}>
                  <Text fontSize="sm" fontWeight="bold">Element Dağılımı:</Text>
                  {Object.entries(esma.element_counts).map(([element, count]) => (
                    count > 0 && (
                      <Text key={element} fontSize="sm">
                        {element}: {count}
                      </Text>
                    )
                  ))}
                </Box>
              </Box>
            ))}
          </SimpleGrid>
        </VStack>
      </CardBody>
    </Card>
  )

  const renderVerseRecommendations = (verses: VerseRecommendation[]) => (
    <Card>
      <CardBody>
        <VStack align="stretch" spacing={4}>
          <Heading as="h3" size="md">
            Önerilen Ayetler
          </Heading>
          
          {verses.map((verse, index) => (
            <Box
              key={index}
              p={4}
              borderWidth={1}
              borderRadius="md"
              borderColor="green.200"
              bg="green.50"
            >
              <Text fontSize="lg" fontWeight="bold" mb={2}>
                Sure {verse.surah_number}, Ayet {verse.verse_number}
              </Text>
              <Text fontFamily="arabic" mb={2}>
                {verse.arabic_text}
              </Text>
              <Text fontSize="sm" mb={4}>
                {verse.meaning}
              </Text>
              <Box>
                <Text fontSize="sm" fontWeight="bold" mb={1}>
                  {verse.calculation_type} Hesaplama Adımları:
                </Text>
                {verse.calculation_steps.map((step, stepIndex) => (
                  <Text key={stepIndex} fontSize="sm">
                    {step}
                  </Text>
                ))}
              </Box>
            </Box>
          ))}
        </VStack>
      </CardBody>
    </Card>
  )

  return (
    <Container maxW="container.xl" py={8}>
      <Stack spacing={8}>
        <Box textAlign="center">
          <Heading as="h1" size="xl" mb={4}>
            Kişiye Özel Hastalık Şifası
          </Heading>
          <Text fontSize="lg" color="gray.600">
            Anne ve çocuk isimleri ile hastalık ismine göre şifa esmaları ve ayetleri hesaplar
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

                <FormControl isRequired>
                  <FormLabel>Hastalık İsmi</FormLabel>
                  <Input
                    value={diseaseName}
                    onChange={(e) => setDiseaseName(e.target.value)}
                    placeholder="Hastalık ismini girin"
                  />
                  <Text fontSize="sm" color="gray.600" mt={1}>
                    Not: Hastalık ismine otomatik olarak şifa (شِفَاء) kelimesi eklenecektir
                  </Text>
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

        {result && (
          <Stack spacing={6}>
            <Tabs isFitted variant="enclosed">
              <TabList mb="1em">
                <Tab>İsim Analizleri</Tab>
                <Tab>Öneriler</Tab>
              </TabList>

              <TabPanels>
                <TabPanel>
                  <Stack spacing={6}>
                    {renderPersonAnalysis(result.mother, "Anne İsmi Analizi")}
                    {renderPersonAnalysis(result.child, "Çocuk İsmi Analizi")}
                    {renderPersonAnalysis(result.disease, "Hastalık İsmi Analizi")}
                    
                    <Card>
                      <CardBody>
                        <Heading as="h3" size="md" mb={4}>
                          Birleşik Analiz
                        </Heading>
                        {renderElementDistribution(result.combined_analysis.elements)}
                      </CardBody>
                    </Card>
                  </Stack>
                </TabPanel>

                <TabPanel>
                  <Stack spacing={6}>
                    {renderEsmaRecommendations(result.recommended_esmas)}
                    {renderVerseRecommendations(result.recommended_verses)}
                    
                    <Alert status="info">
                      <AlertIcon />
                      {result.warning_message}
                    </Alert>
                  </Stack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Stack>
        )}
      </Stack>
    </Container>
  )
}

export default DiseaseQuery 