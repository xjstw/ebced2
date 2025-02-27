import React, { useState } from 'react';
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
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  Alert,
  AlertIcon,
  useToast,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Progress,
  Collapse
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';

interface LetterAnalysis {
  letter: string;
  arabic: string;
  ebced: number;
  element: string;
  is_nurani: boolean;
  gender: string;
}

interface EsmaAnalysis {
  name: string;
  arabic: string;
  ebced: number;
  meaning: string;
  element_counts: {
    [key: string]: number;  // Dynamic element counts
  };
  dominant_element: string;
  ebced_difference: number;
}

interface DiseaseElementResponse {
  name: string;
  name_arabic: string;
  name_ebced: number;
  name_letters: LetterAnalysis[];
  target_element: string;
  matching_esmas: EsmaAnalysis[];
}

const elementDescriptions = {
  'ATEŞ': 'Ruhsal ve duygusal sorunlar için',
  'HAVA': 'Psikolojik ve zihinsel sorunlar için',
  'TOPRAK': 'Fiziksel hastalıklar için',
  'SU': 'Vücuttaki sıvı akışı sorunları için'
};

const API_URL = 'http://localhost:8000';
const FETCH_TIMEOUT = 30000; // 30 seconds

export default function DiseaseElement() {
  const [name, setName] = useState('');
  const [targetElement, setTargetElement] = useState('');
  const [result, setResult] = useState<DiseaseElementResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    if (!name || !targetElement) {
      setError('Lütfen tüm alanları doldurun');
      setLoading(false);
      return;
    }

    try {
      console.log('Sending request with:', { name, targetElement });
      
      const response = await fetch(`${API_URL}/disease-element/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          target_element: targetElement,
        }),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(errorText || 'Hesaplama sırasında bir hata oluştu');
      }

      const data = await response.json();
      console.log('Received data:', data);

      if (!data || typeof data !== 'object') {
        throw new Error('Geçersiz yanıt formatı');
      }

      setResult(data);
    } catch (err) {
      console.error('Error details:', err);
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
      setLoading(false);
    }
  };

  const renderLetterAnalysis = (letters: LetterAnalysis[]) => {
    if (!letters || !Array.isArray(letters)) return null;
    
    return (
      <Table size="sm" variant="simple" mt={2}>
        <Thead>
          <Tr>
            <Th>Harf</Th>
            <Th>Arapça</Th>
            <Th>Ebced</Th>
            <Th>Element</Th>
            <Th>Nurani/Zulmani</Th>
            <Th>Cinsiyet</Th>
          </Tr>
        </Thead>
        <Tbody>
          {letters.map((letter, index) => (
            <Tr key={index}>
              <Td>{letter?.letter || '-'}</Td>
              <Td>{letter?.arabic || '-'}</Td>
              <Td>{letter?.ebced || '-'}</Td>
              <Td>{letter?.element || '-'}</Td>
              <Td>{letter?.is_nurani ? 'Nurani' : 'Zulmani'}</Td>
              <Td>{letter?.gender || '-'}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    );
  };

  const renderElementDistribution = (elements: Record<string, ElementAnalysis>) => {
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
          {Object.entries(elements).map(([element, analysis]) => (
            <Box key={element}>
              <Text fontSize="sm">
                {element}: {analysis.count} harf - Ebced: {analysis.ebced}
              </Text>
              <Progress
                value={analysis.count}
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
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading as="h1" size="xl" mb={4}>
            Hastalıklar İçin Elementlerle Çalışma
          </Heading>
          <Text fontSize="lg" color="gray.600">
            İsminizin ebced değerine ve seçilen elemente göre uygun esmaları hesaplar
          </Text>
        </Box>

        <Alert status="info">
          <AlertIcon />
          <VStack align="start" spacing={2}>
            <Text>
              <strong>Önemli Not:</strong> Bu hesaplamalar tıbbi tedavinin yerini tutmaz, sadece destekleyici olarak kullanılmalıdır.
            </Text>
            <Text>
              <strong>Element Seçim Rehberi:</strong>
            </Text>
            {Object.entries(elementDescriptions).map(([element, description]) => (
              <Text key={element}>• {element}: {description}</Text>
            ))}
          </VStack>
        </Alert>

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
              <FormLabel>Element</FormLabel>
              <Select
                value={targetElement}
                onChange={(e) => setTargetElement(e.target.value)}
                placeholder="Element seçin"
              >
                <option value="ATEŞ">ATEŞ</option>
                <option value="HAVA">HAVA</option>
                <option value="TOPRAK">TOPRAK</option>
                <option value="SU">SU</option>
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
          <VStack spacing={6} align="stretch">
            <Card>
              <CardHeader>
                <Heading size="md">İsim Analizi</Heading>
              </CardHeader>
              <CardBody>
                <Text>
                  İsim: {result.name} ({result.name_arabic})
                </Text>
                <Text>Ebced Değeri: {result.name_ebced}</Text>
                {result.name_letters && renderLetterAnalysis(result.name_letters)}
              </CardBody>
            </Card>

            {result.matching_esmas && result.matching_esmas.length > 0 && (
              <Card>
                <CardHeader>
                  <Heading size="md">Eşleşen Esmalar</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    {result.matching_esmas.map((esma, index) => (
                      <Box key={index} p={4} borderWidth="1px" borderRadius="md">
                        <Text fontSize="lg" fontWeight="bold">
                          {esma.name} ({esma.arabic})
                        </Text>
                        <Text>Ebced Değeri: {esma.ebced}</Text>
                        <Text>Baskın Element: {esma.dominant_element}</Text>
                        {esma.element_counts && renderElementDistribution(esma.element_counts)}
                        <Divider my={2} />
                        <Text>Anlamı: {esma.meaning}</Text>
                      </Box>
                    ))}
                  </VStack>
                </CardBody>
              </Card>
            )}
          </VStack>
        )}
      </VStack>
    </Container>
  );
} 