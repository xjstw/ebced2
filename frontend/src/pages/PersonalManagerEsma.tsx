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
  Spinner,
  Alert,
  AlertIcon,
  Stack,
  ButtonGroup,
} from '@chakra-ui/react';

interface Letter {
  letter: string;
  ebced: number;
  element: string;
  nurani_zulmani: string;
  gender: string;
}

interface NameAnalysis {
  name: string;
  arabic: string;
  total_ebced: number;
  letters: Letter[];
}

interface EsmaInfo {
  name: string;
  arabic: string;
  ebced: number;
  meaning: string;
}

interface ApiResponse {
  name_analysis: NameAnalysis;
  selected_esma: EsmaInfo;
  lower_esma: EsmaInfo | null;
  upper_esma: EsmaInfo | null;
  differences: { [key: string]: number };
}

const PersonalManagerEsma: React.FC = () => {
  const [name, setName] = useState('');
  // const [gender, setGender] = useState<'male' | 'female'>('male');
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Te marbuta harfinin özellikleri
  // const teMarbuta = {
  //   arabic: 'ة',
  //   ebced: 5,
  //   element: 'ATEŞ',
  //   is_nurani: true,
  //   gender: 'E'
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/calculate-personal-manager-esma', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!response.ok) {
        throw new Error('Hesaplama sırasında bir hata oluştu');
      }

      const data = await response.json();
      
      // Eğer kadın seçiliyse ve sonuç varsa, te marbuta harfini ekle
      // if (gender === 'female' && data.name_analysis) {
      //   // Te marbuta harfini letters dizisine ekle
      //   data.name_analysis.letters.push({
      //     letter: teMarbuta.arabic,
      //     ebced: teMarbuta.ebced,
      //     element: teMarbuta.element,
      //     nurani_zulmani: teMarbuta.is_nurani ? 'N' : 'Z',
      //     gender: teMarbuta.gender
      //   });

      //   // Arapça yazılışa te marbuta ekle
      //   data.name_analysis.arabic += teMarbuta.arabic;
      // }
      
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="container.lg">
      <Box my={8}>
        <Heading as="h1" size="lg" textAlign="center" mb={6}>
          Kişisel Yönetici Esma (İsim Esması) Hesaplama
        </Heading>

        <Box as="form" onSubmit={handleSubmit} mt={6}>
          <Input
            placeholder="İsim"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            mb={4}
            required
          />
          
          {/* <ButtonGroup isAttached width="full" mb={4}>
            <Button
              flex={1}
              colorScheme={gender === 'male' ? 'blue' : 'gray'}
              onClick={() => setGender('male')}
              type="button"
            >
              Erkek
            </Button>
            <Button
              flex={1}
              colorScheme={gender === 'female' ? 'pink' : 'gray'}
              onClick={() => setGender('female')}
              type="button"
            >
              Kadın
            </Button>
          </ButtonGroup> */}

          <Button
            type="submit"
            colorScheme="blue"
            width="full"
            isLoading={loading}
            loadingText="Hesaplanıyor"
          >
            Hesapla
          </Button>
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
                İsim Analizi
              </Heading>
              <Stack spacing={2}>
                <Text>
                  <strong>İsim:</strong> {result.name_analysis.name}
                </Text>
                <Text>
                  <strong>Arapça Yazılışı:</strong> {result.name_analysis.arabic}
                </Text>
                <Text>
                  <strong>Toplam Ebced Değeri:</strong> {result.name_analysis.total_ebced}
                </Text>
              </Stack>

              <TableContainer mt={4}>
                <Table variant="simple" size="sm">
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
                    {result.name_analysis.letters.map((letter, index) => (
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
              </TableContainer>
            </Box>

            <Box p={6} borderWidth="1px" borderRadius="lg" bg="white">
              <Heading as="h2" size="md" mb={4}>
                Yönetici Esma Sonucu
              </Heading>
              <Text fontSize="lg" color="blue.600" mb={2}>
                <strong>Seçilen Esma:</strong> {result.selected_esma.name} ({result.selected_esma.arabic})
              </Text>
              <Text>
                <strong>Ebced Değeri:</strong> {result.selected_esma.ebced}
              </Text>
              {result.selected_esma.meaning && (
                <Text>
                  <strong>Anlamı:</strong> {result.selected_esma.meaning}
                </Text>
              )}

              <Box mt={4}>
                <Heading as="h3" size="sm" mb={2}>
                  En Yakın Esmalar:
                </Heading>
                {result.lower_esma && (
                  <Text>
                    {result.lower_esma.name} ({result.lower_esma.ebced})
                  </Text>
                )}
                {result.upper_esma && (
                  <Text>
                    {result.upper_esma.name} ({result.upper_esma.ebced})
                  </Text>
                )}
              </Box>
            </Box>
          </Stack>
        )}
      </Box>
    </Container>
  );
};

export default PersonalManagerEsma; 