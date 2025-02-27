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
  Radio,
  RadioGroup,
  Select,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  AlertTitle,
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

interface NameAnalysis {
  name: string
  arabic: string
  ebced: number
  letters: LetterAnalysis[]
  element_counts: Record<string, number>
  dominant_element: string
  nurani_ratio: number
  gender_ratio: number
}

interface NameCoachingResponse {
  mother_analysis?: NameAnalysis
  current_name_analysis?: NameAnalysis
  suggested_names_analysis: NameAnalysis[]
  recommended_names: string[]
  recommendation_reason: string
  warning_message: string
}

const NameCoaching: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0)
  const toast = useToast()
  const navigate = useNavigate();

  return (
    <Container maxW="container.xl" py={8}>
      <Stack spacing={8}>
        <Box textAlign="center">
          <Heading as="h1" size="xl" mb={4}>
            İsim Koçluğu
          </Heading>
          <Text fontSize="lg" color="gray.600">
            Çocuğunuz için uyumlu isim seçimi veya kendiniz için yeni bir isim analizi yapın
          </Text>
        </Box>

        <Tabs isFitted variant="enclosed" index={activeTab} onChange={setActiveTab}>
          <TabList mb="1em">
            <Tab>Çocuk İsmi Seçimi</Tab>
            <Tab>Kişisel İsim Değişikliği</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <ChildNameCoaching />
            </TabPanel>
            <TabPanel>
              <PersonalNameCoaching />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Stack>
    </Container>
  )
}

const ChildNameCoaching: React.FC = () => {
  const [motherName, setMotherName] = useState('')
  const [suggestedNames, setSuggestedNames] = useState(['', '', '', '', ''])
  const [childGender, setChildGender] = useState<'male' | 'female'>('female')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<NameCoachingResponse | null>(null)
  const toast = useToast()
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const validNames = suggestedNames.filter(name => name.trim() !== '')
      if (validNames.length === 0) {
        throw new Error('En az bir isim önerisi girilmelidir')
      }

      const response = await api.post('/name-coaching/child-name', {
        mother_name: motherName,
        suggested_names: validNames,
        child_gender: childGender,
      });

      const data = await response.json()
      console.log("Child Name API Response:", data);
      console.log("Mother Analysis:", data.mother_analysis);
      console.log("Suggested Names Analysis:", data.suggested_names_analysis);
      console.log("Recommended Names:", data.recommended_names);
      console.log("Recommendation Reason:", data.recommendation_reason);
      console.log("Warning Message:", data.warning_message);
      
      // Save to localStorage with correct structure
      localStorage.setItem('childNameData', JSON.stringify({
        motherName,
        childGender,
        analysisResult: {
          motherAnalysis: data.mother_analysis,
          suggestedNamesAnalysis: data.suggested_names_analysis || [],
          recommendationReason: data.recommendation_reason,
          warningMessage: data.warning_message
        }
      }));

      setResult(data)
      toast({
        title: 'Analiz Tamamlandı',
        description: 'İsim analizi başarıyla gerçekleştirildi.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bir hata oluştu';
      toast({
        title: 'Hata',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNameChange = (index: number, value: string) => {
    const newNames = [...suggestedNames]
    newNames[index] = value
    setSuggestedNames(newNames)
  }

  const handleViewReport = () => {
    navigate('/name-coaching-report');
  };

  return (
    <Stack spacing={6}>
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
                <FormLabel>Çocuk Cinsiyeti</FormLabel>
                <RadioGroup value={childGender} onChange={(value: 'male' | 'female') => setChildGender(value)}>
                  <Stack direction="row">
                    <Radio value="female">Kız</Radio>
                    <Radio value="male">Erkek</Radio>
                  </Stack>
                </RadioGroup>
              </FormControl>

              <FormControl>
                <FormLabel>İsim Önerileri (En az 1 isim)</FormLabel>
                <Stack spacing={2}>
                  {suggestedNames.map((name, index) => (
                    <Input
                      key={index}
                      value={name}
                      onChange={(e) => handleNameChange(index, e.target.value)}
                      placeholder={`${index + 1}. isim önerisi`}
                    />
                  ))}
                </Stack>
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

      {result && <AnalysisResult result={result} childGender={childGender} />}

      {result && (
        <Button
          onClick={handleViewReport}
          colorScheme="blue"
          size="lg"
          mt={4}
        >
          Detaylı Raporu Görüntüle
        </Button>
      )}
    </Stack>
  )
}

const PersonalNameCoaching: React.FC = () => {
  const [currentName, setCurrentName] = useState('')
  const [suggestedNames, setSuggestedNames] = useState(['', '', '', '', ''])
  const [gender, setGender] = useState<'male' | 'female'>('female')
  const [criteria, setCriteria] = useState<'gender' | 'element' | 'nurani'>('gender')
  const [preferredElement, setPreferredElement] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<NameCoachingResponse | null>(null)
  const toast = useToast()
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const validNames = suggestedNames.filter(name => name.trim() !== '')
      if (validNames.length === 0) {
        throw new Error('En az bir isim önerisi girilmelidir')
      }

      const response = await api.post('/name-coaching/personal-name', {
        current_name: currentName,
        suggested_names: validNames,
        gender,
        criteria,
        preferred_element: criteria === 'element' ? preferredElement : undefined,
      });

      const data = await response.json()
      console.log("Personal Name API Response:", data);
      
      // Save to localStorage with correct structure
      localStorage.setItem('personalNameData', JSON.stringify({
        currentName,
        gender,
        criteria,
        analysisResult: {
          currentNameAnalysis: data.current_name_analysis,
          suggestedNamesAnalysis: data.suggested_names_analysis || [],
          recommendationReason: data.recommendation_reason,
          warningMessage: data.warning_message
        }
      }));

      setResult(data)
      toast({
        title: 'Analiz Tamamlandı',
        description: 'İsim analizi başarıyla gerçekleştirildi.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bir hata oluştu';
      toast({
        title: 'Hata',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNameChange = (index: number, value: string) => {
    const newNames = [...suggestedNames]
    newNames[index] = value
    setSuggestedNames(newNames)
  }

  const handleViewReport = () => {
    navigate('/name-coaching-report');
  };

  return (
    <Stack spacing={6}>
      <Box as="form" onSubmit={handleSubmit}>
        <Card>
          <CardBody>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Mevcut İsim</FormLabel>
                <Input
                  value={currentName}
                  onChange={(e) => setCurrentName(e.target.value)}
                  placeholder="Mevcut isminizi girin"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Cinsiyet</FormLabel>
                <RadioGroup value={gender} onChange={(value: 'male' | 'female') => setGender(value)}>
                  <Stack direction="row">
                    <Radio value="female">Kadın</Radio>
                    <Radio value="male">Erkek</Radio>
                  </Stack>
                </RadioGroup>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Değişiklik Kriteri</FormLabel>
                <Select value={criteria} onChange={(e) => setCriteria(e.target.value as any)}>
                  <option value="gender">Cinsiyet Enerjisi</option>
                  <option value="element">Element</option>
                  <option value="nurani">Nurani/Zulmani</option>
                </Select>
              </FormControl>

              {criteria === 'element' && (
                <FormControl isRequired>
                  <FormLabel>Tercih Edilen Element</FormLabel>
                  <Select value={preferredElement} onChange={(e) => setPreferredElement(e.target.value)}>
                    <option value="">Seçiniz</option>
                    <option value="ATEŞ">Ateş</option>
                    <option value="HAVA">Hava</option>
                    <option value="TOPRAK">Toprak</option>
                    <option value="SU">Su</option>
                  </Select>
                </FormControl>
              )}

              <FormControl>
                <FormLabel>İsim Önerileri (En az 1 isim)</FormLabel>
                <Stack spacing={2}>
                  {suggestedNames.map((name, index) => (
                    <Input
                      key={index}
                      value={name}
                      onChange={(e) => handleNameChange(index, e.target.value)}
                      placeholder={`${index + 1}. isim önerisi`}
                    />
                  ))}
                </Stack>
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

      {result && <AnalysisResult result={result} childGender={gender} />}

      {result && (
        <Button
          onClick={handleViewReport}
          colorScheme="blue"
          size="lg"
          mt={4}
        >
          Detaylı Raporu Görüntüle
        </Button>
      )}
    </Stack>
  )
}

const AnalysisResult: React.FC<{ 
  result: NameCoachingResponse
  childGender?: 'male' | 'female'
}> = ({ result, childGender }) => {
  const renderNameAnalysis = (analysis: NameAnalysis, title: string) => (
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
              <Text>
                <strong>Ebced Değeri:</strong> {analysis.ebced}
              </Text>
              <Text>
                <strong>Baskın Element:</strong> {analysis.dominant_element}
              </Text>
            </Box>
            
            <Box>
              <Text>
                <strong>Nurani/Zulmani:</strong> {analysis.nurani_ratio > 0.5 ? 'Nurani Baskın' : 'Zulmani Baskın'}
              </Text>
              <Progress value={analysis.nurani_ratio * 100} colorScheme="green" size="sm" mb={2} />
              
              <Text>
                <strong>Eril/Dişil:</strong> {analysis.gender_ratio > 0.5 ? 'Eril Baskın' : 'Dişil Baskın'}
              </Text>
              <Progress value={analysis.gender_ratio * 100} colorScheme="blue" size="sm" />
            </Box>
          </SimpleGrid>

          <Box>
            <Text fontWeight="bold" mb={2}>Element Dağılımı:</Text>
            {Object.entries(analysis.element_counts).map(([element, count]) => (
              <Box key={element} mb={2}>
                <Text fontSize="sm">
                  {element}: {count}
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
          </Box>

          <Box>
            <Text fontWeight="bold" mb={2}>Harf Analizi:</Text>
            <Table size="sm">
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
                {analysis.letters.map((letter, index) => (
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
          </Box>
        </VStack>
      </CardBody>
    </Card>
  )

  return (
    <Stack spacing={6}>
      {result.mother_analysis && renderNameAnalysis(result.mother_analysis, "Anne İsmi Analizi")}
      {result.current_name_analysis && renderNameAnalysis(result.current_name_analysis, "Mevcut İsim Analizi")}
      
      <Card>
        <CardBody>
          <VStack align="stretch" spacing={4}>
            <Heading as="h3" size="md">
              Önerilen İsimler
            </Heading>
            
            {result.current_name_analysis && childGender && (
              (childGender === 'female' && result.current_name_analysis.gender_ratio > 0.5) || 
              (childGender === 'male' && result.current_name_analysis.gender_ratio < 0.5)
            ) && (
              <Alert status="error" variant="solid">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold" fontSize="lg">Cinsiyet Uyumsuzluğu Uyarısı!</Text>
                  <Text>
                    Bu isim anne ismiyle kriter yönüyle uyumludur ancak çocuğun cinsiyeti ile uyumlu değildir! 
                    Bu durumda yeni isimlerle tekrar analiz yapmanız önerilmektedir.
                  </Text>
                </Box>
              </Alert>
            )}
            
            <Text>{result.recommendation_reason}</Text>

            {result.warning_message && result.warning_message.includes("cinsiyeti ile uyumlu değildir") && (
              <Alert status="error" variant="solid" mb={4}>
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold" fontSize="lg">Cinsiyet Uyumsuzluğu Uyarısı!</Text>
                  <Text>{result.warning_message}</Text>
                </Box>
              </Alert>
            )}
            
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {result.suggested_names_analysis.map((analysis, index) => {
                const isRecommended = result.recommended_names.includes(analysis.name)
                const isGenderIncompatible = childGender ? (
                  (childGender === "female" && analysis.gender_ratio > 0.5) ||
                  (childGender === "male" && analysis.gender_ratio < 0.5)
                ) : false
                
                return (
                  <Box
                    key={index}
                    p={4}
                    borderWidth={2}
                    borderRadius="md"
                    borderColor={isGenderIncompatible ? "red.300" : isRecommended ? "blue.200" : "gray.200"}
                    bg={isGenderIncompatible ? "red.50" : isRecommended ? "blue.50" : "gray.50"}
                  >
                    <Text fontSize="lg" fontWeight="bold" mb={2}>
                      {index + 1}. {analysis.name}
                      {isGenderIncompatible && (
                        <Badge ml={2} colorScheme="red">
                          Cinsiyet Uyumsuz
                        </Badge>
                      )}
                      {!isRecommended && !isGenderIncompatible && (
                        <Badge ml={2} colorScheme="gray">
                          Element Uyumsuz
                        </Badge>
                      )}
                    </Text>
                    <Text fontFamily="arabic" mb={2}>
                      {analysis.arabic}
                    </Text>
                    <Text mb={1}>
                      <strong>Ebced:</strong> {analysis.ebced}
                    </Text>
                    <Text mb={1}>
                      <strong>Element Dağılımı:</strong>
                    </Text>
                    {Object.entries(analysis.element_counts).map(([element, count]) => (
                      <Text key={element} fontSize="sm" ml={2} mb={0.5}>
                        {element}: {count}
                      </Text>
                    ))}
                    <Text mt={2}>
                      <strong>Baskın Element:</strong> {analysis.dominant_element}
                    </Text>
                    <Text>
                      <strong>Nurani/Zulmani:</strong> {analysis.nurani_ratio > 0.5 ? 'Nurani Baskın' : 'Zulmani Baskın'}
                    </Text>
                    <Progress value={analysis.nurani_ratio * 100} colorScheme="green" size="sm" mb={2} />
                    
                    <Text>
                      <strong>Eril/Dişil:</strong> {analysis.gender_ratio > 0.5 ? 'Eril Baskın' : 'Dişil Baskın'}
                    </Text>
                    <Progress value={analysis.gender_ratio * 100} colorScheme="blue" size="sm" />
                  </Box>
                )
              })}
            </SimpleGrid>

            {result.warning_message && !result.warning_message.includes("cinsiyeti ile uyumlu değildir") && (
              <Alert status="info" mt={4}>
                <AlertIcon />
                {result.warning_message}
              </Alert>
            )}
          </VStack>
        </CardBody>
      </Card>
    </Stack>
  )
}

export default NameCoaching 