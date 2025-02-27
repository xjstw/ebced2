import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Input,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Select,
  Alert,
  AlertIcon,
  Stack,
  Radio,
  RadioGroup,
  Divider,
} from '@chakra-ui/react';

interface LetterAnalysis {
  letter: string;
  arabic: string;
  ebced: number;
  element: string;
  is_nurani: boolean;
  gender: string;
}

interface NameAnalysis {
  name: string;
  arabic: string;
  ebced: number;
  letters: LetterAnalysis[];
}

interface EsmaAnalysis {
  name: string;
  arabic: string;
  ebced: number;
  meaning: string;
  element_counts: {
    [key: string]: number;
  };
  dominant_element: string;
  ebced_difference: number;
}

interface DiseaseElementResponse {
  person_name_analysis: NameAnalysis;
  mother_name_analysis: NameAnalysis;
  total_ebced: number;
  disease_type: string;
  target_element: string;
  matching_esmas: EsmaAnalysis[];
}

const ELEMENT_DESCRIPTIONS = {
  'ATEŞ': 'Ruhsal ve manevi problemler için',
  'HAVA': 'Psikolojik ve zihinsel problemler için',
  'TOPRAK': 'Fiziksel hastalıklar için',
  'SU': 'Fizik bedendeki sıvı akışı problemleri için (kan, safra, böbrekler, idrar yolu, lenfatik sistem)',
};

const DiseaseElementCalculation: React.FC = () => {
  const [name, setName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [diseaseType, setDiseaseType] = useState('');
  const [selectedElement, setSelectedElement] = useState<string>('');
  const [result, setResult] = useState<DiseaseElementResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !motherName || !selectedElement || !diseaseType) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Sending request with:', { name, motherName, diseaseType, selectedElement });
      
      const response = await fetch('http://localhost:8000/disease-element/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: name.trim(),
          mother_name: motherName.trim(),
          disease_type: diseaseType.trim(),
          target_element: selectedElement,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Hesaplama sırasında bir hata oluştu');
      }

      const data = await response.json();
      console.log('Received data:', data);
      setResult(data);
    } catch (err) {
      console.error('Error details:', err);
      const errorMessage = err instanceof Error ? err.message : 'Bir hata oluştu';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderNameAnalysis = (analysis: NameAnalysis, title: string) => (
    <Box p={4} borderWidth="1px" borderRadius="md">
      <Heading size="sm" mb={2}>{title}</Heading>
      <Stack spacing={2}>
        <Text>
          <strong>İsim:</strong> {analysis.name}
        </Text>
        <Text>
          <strong>Arapça Yazılışı:</strong> {analysis.arabic}
        </Text>
        <Text>
          <strong>Ebced Değeri:</strong> {analysis.ebced}
        </Text>
      </Stack>

      <TableContainer mt={4}>
        <Table variant="simple" size="sm">
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
            {analysis.letters.map((letter, index) => (
              <Tr key={index}>
                <Td>{letter.letter}</Td>
                <Td>{letter.arabic}</Td>
                <Td>{letter.ebced}</Td>
                <Td>{letter.element}</Td>
                <Td>{letter.is_nurani ? 'Nurani' : 'Zulmani'}</Td>
                <Td>{letter.gender}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <Container maxW="container.xl">
      <Box my={8}>
        <Heading as="h1" size="lg" textAlign="center" mb={6}>
          Hastalıklar İçin Elementlerle Çalışma
        </Heading>

        <Alert status="warning" mb={4}>
          <AlertIcon />
          <Stack>
            <Text>
              <strong>Önemli Notlar:</strong>
            </Text>
            <Text>
              - Kişilerin var olan hastalıkları için öncelikle tıbbi destek almaları tavsiye edilir.
            </Text>
            <Text>
              - Bu çalışmalar sadece doktor ve tıbbi tedaviye ek olarak yapılabilir.
            </Text>
            <Text>
              - Kişilere asla ilaçlarını ve tedavilerini kesmelerini veya değiştirmelerini tavsiye etmeyiniz.
            </Text>
            <Text>
              - Buradaki uygulamaların hiç biri tıbbi tedavi yerine geçmez.
            </Text>
          </Stack>
        </Alert>

        <Box p={6} borderWidth="1px" borderRadius="lg" bg="white" mb={6}>
          <Heading as="h2" size="md" mb={4}>
            Element Seçimi
          </Heading>
          <RadioGroup onChange={setSelectedElement} value={selectedElement} mb={4}>
            <Stack>
              {Object.entries(ELEMENT_DESCRIPTIONS).map(([element, description]) => (
                <Radio key={element} value={element}>
                  <Text>
                    <strong>{element}:</strong> {description}
                  </Text>
                </Radio>
              ))}
            </Stack>
          </RadioGroup>
        </Box>

        <Box as="form" onSubmit={handleSubmit}>
          <Stack spacing={4}>
            <Input
              placeholder="Kişinin İsmi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              placeholder="Anne İsmi"
              value={motherName}
              onChange={(e) => setMotherName(e.target.value)}
              required
            />
            <Input
              placeholder="Hastalık veya Problem Türü (örn: kansızlık, kalp hastalığı)"
              value={diseaseType}
              onChange={(e) => setDiseaseType(e.target.value)}
              required
            />
            <Button
              type="submit"
              colorScheme="blue"
              width="full"
              isLoading={loading}
              loadingText="Hesaplanıyor"
            >
              Hesapla
            </Button>
          </Stack>
        </Box>

        {error && (
          <Alert status="error" mt={4}>
            <AlertIcon />
            {error}
          </Alert>
        )}

        {result && (
          <Stack spacing={6} mt={8}>
            <Box p={6} borderWidth="1px" borderRadius="lg" bg="white">
              <Heading as="h2" size="md" mb={4}>
                İsim Analizleri
              </Heading>
              <Stack spacing={4}>
                {renderNameAnalysis(result.person_name_analysis, "Kişi Analizi")}
                {renderNameAnalysis(result.mother_name_analysis, "Anne Analizi")}
                <Box p={4} borderWidth="1px" borderRadius="md">
                  <Text fontSize="lg" fontWeight="bold">
                    Toplam Ebced Değeri: {result.total_ebced}
                  </Text>
                  <Text>
                    <strong>Hastalık/Problem:</strong> {result.disease_type}
                  </Text>
                  <Text>
                    <strong>Seçilen Element:</strong> {result.target_element}
                  </Text>
                </Box>
              </Stack>
            </Box>

            {result.matching_esmas && result.matching_esmas.length > 0 && (
              <Box p={6} borderWidth="1px" borderRadius="lg" bg="white">
                <Heading as="h2" size="md" mb={4}>
                  Önerilen Esmalar
                </Heading>
                <Alert status="info" mb={4}>
                  <AlertIcon />
                  <Stack>
                    <Text>
                      <strong>Esma Çekme Tavsiyeleri:</strong>
                    </Text>
                    <Text>
                      - Seçilen esmayı en az 21 gün boyunca çekiniz.
                    </Text>
                    <Text>
                      - İlk defa çekilecekse, en küçük sayı ile başlayıp kademeli olarak artırınız.
                    </Text>
                  </Stack>
                </Alert>
                <Stack spacing={4}>
                  {result.matching_esmas.map((esma, index) => (
                    <Box key={index} p={4} borderWidth="1px" borderRadius="md">
                      <Text fontSize="lg" fontWeight="bold">
                        {esma.name} ({esma.arabic})
                      </Text>
                      <Text>
                        <strong>Ebced Değeri:</strong> {esma.ebced}
                      </Text>
                      <Text>
                        <strong>Fark:</strong> {esma.ebced_difference}
                      </Text>
                      <Text>
                        <strong>Baskın Element:</strong> {esma.dominant_element}
                      </Text>
                      <Stack direction="row" spacing={4} mt={2}>
                        <Text>Element Dağılımı:</Text>
                        {Object.entries(esma.element_counts).map(([element, count]) => (
                          <Text key={element}>{element}: {count}</Text>
                        ))}
                      </Stack>
                      <Divider my={2} />
                      <Text>
                        <strong>Anlamı:</strong> {esma.meaning}
                      </Text>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        )}
      </Box>
    </Container>
  );
};

export default DiseaseElementCalculation; 