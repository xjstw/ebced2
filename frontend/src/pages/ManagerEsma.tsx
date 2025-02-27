import React, { useState } from 'react';
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
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  Alert,
  AlertIcon,
  useToast
} from '@chakra-ui/react';

interface LetterAnalysis {
  letter: string;
  ebced: number;
  element: string;
  nurani_zulmani: string;
  gender: string;
}

interface ManagerEsmaResponse {
  mother_name: string;
  mother_name_arabic: string;
  mother_name_ebced: number;
  mother_name_letters: LetterAnalysis[];
  
  child_name: string;
  child_name_arabic: string;
  child_name_ebced: number;
  child_name_letters: LetterAnalysis[];
  
  total_ebced: number;
  selected_esma: string;
  selected_esma_arabic: string;
  selected_esma_ebced: number;
  selected_esma_meaning: string;
  ebced_difference: number;
}

export default function ManagerEsma() {
  const [motherName, setMotherName] = useState('');
  const [childName, setChildName] = useState('');
  const [result, setResult] = useState<ManagerEsmaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://localhost:8000/manager-esma/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mother_name: motherName,
          child_name: childName,
        }),
      });

      if (!response.ok) {
        throw new Error('Hesaplama sırasında bir hata oluştu');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
      toast({
        title: 'Hata',
        description: err instanceof Error ? err.message : 'Bir hata oluştu',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const renderLetterAnalysis = (letters: LetterAnalysis[]) => (
    <Table size="sm" variant="simple" mt={2}>
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
  );

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading as="h1" size="xl" mb={4}>
            Yönetici Esma Hesaplama
          </Heading>
          <Text fontSize="lg" color="gray.600">
            Anne ve çocuk isimlerinin ebced değerlerini toplayarak yönetici esmayı hesaplar
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
            <Box>
              <Heading as="h3" size="md" mb={3}>
                Anne İsmi Analizi
              </Heading>
              <Text>
                İsim: {result.mother_name} ({result.mother_name_arabic})
              </Text>
              <Text>Ebced Değeri: {result.mother_name_ebced}</Text>
              {renderLetterAnalysis(result.mother_name_letters)}
            </Box>

            <Box>
              <Heading as="h3" size="md" mb={3}>
                Çocuk İsmi Analizi
              </Heading>
              <Text>
                İsim: {result.child_name} ({result.child_name_arabic})
              </Text>
              <Text>Ebced Değeri: {result.child_name_ebced}</Text>
              {renderLetterAnalysis(result.child_name_letters)}
            </Box>

            <Box>
              <Heading as="h3" size="md" mb={3}>
                Sonuç
              </Heading>
              <Text>Toplam Ebced Değeri: {result.total_ebced}</Text>
              <Text>
                Seçilen Esma: {result.selected_esma} ({result.selected_esma_arabic})
              </Text>
              <Text>Esma Ebced Değeri: {result.selected_esma_ebced}</Text>
              <Text mt={2}>Anlamı: {result.selected_esma_meaning}</Text>
            </Box>
          </VStack>
        )}
      </VStack>
    </Container>
  );
} 