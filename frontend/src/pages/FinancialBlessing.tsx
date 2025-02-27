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
  VStack,
  Text,
  Alert,
  AlertIcon,
  SimpleGrid,
  HStack,
  Tag,
  Divider,
} from '@chakra-ui/react';

interface FinancialBlessingResponse {
  mother_name: string;
  mother_arabic: string;
  mother_letters: Array<{
    letter: string;
    ebced: number;
    element: string;
    nurani_zulmani: string;
    gender: string;
  }>;
  mother_letter_count: number;
  mother_ebced: number;
  
  child_name: string;
  child_arabic: string;
  child_letters: Array<{
    letter: string;
    ebced: number;
    element: string;
    nurani_zulmani: string;
    gender: string;
  }>;
  child_letter_count: number;
  child_ebced: number;
  
  blessing_word: string;
  blessing_letters: Array<{
    letter: string;
    ebced: number;
    element: string;
    nurani_zulmani: string;
    gender: string;
  }>;
  blessing_letter_count: number;
  blessing_ebced: number;
  
  provision_word: string;
  provision_letters: Array<{
    letter: string;
    ebced: number;
    element: string;
    nurani_zulmani: string;
    gender: string;
  }>;
  provision_letter_count: number;
  provision_ebced: number;
  
  healing_word: string;
  healing_letters: Array<{
    letter: string;
    ebced: number;
    element: string;
    nurani_zulmani: string;
    gender: string;
  }>;
  healing_letter_count: number;
  healing_ebced: number;
  
  total_letter_count: number;
  total_ebced: number;
  
  first_verse: {
    sure: number;
    ayet: number;
  };
  second_verse: {
    sure: number;
    ayet: number;
  };
}

const FinancialBlessing = () => {
  const [motherName, setMotherName] = useState('');
  const [childName, setChildName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FinancialBlessingResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://localhost:8000/financial-blessing/analyze', {
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
        throw new Error('Analiz sırasında bir hata oluştu');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const renderLetterAnalysis = (letters: any[], title: string) => (
    <Box bg="white" p={4} borderRadius="md" shadow="sm">
      <Text fontWeight="bold" mb={2}>{title}</Text>
      <Stack spacing={2}>
        {letters.map((letter, index) => (
          <HStack key={index} spacing={4}>
            <Tag size="lg" colorScheme="blue" fontFamily="'Noto Naskh Arabic', serif">
              {letter.letter}
            </Tag>
            <Text>Ebced: {letter.ebced}</Text>
            <Tag colorScheme={
              letter.element === 'ATEŞ' ? 'red' :
              letter.element === 'HAVA' ? 'yellow' :
              letter.element === 'TOPRAK' ? 'orange' : 'blue'
            }>
              {letter.element}
            </Tag>
            <Tag colorScheme={letter.nurani_zulmani === 'N' ? 'green' : 'purple'}>
              {letter.nurani_zulmani === 'N' ? 'NURANİ' : 'ZÜLMANİ'}
            </Tag>
            <Tag colorScheme={letter.gender === 'E' ? 'blue' : 'pink'}>
              {letter.gender === 'E' ? 'ERİL' : 'DİŞİL'}
            </Tag>
          </HStack>
        ))}
      </Stack>
    </Box>
  );

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8}>
        <Box textAlign="center">
          <Heading as="h1" size="xl" mb={4}>
            Maddi Blokaj/Bolluk Bereket Rızık Analizi
          </Heading>
          <Text>
            Anne ve çocuk isimlerini girerek maddi blokaj, bolluk bereket ve rızık analizini yapabilirsiniz.
          </Text>
        </Box>

        <Box as="form" onSubmit={handleSubmit} w="100%">
          <Stack spacing={6}>
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
              loadingText="Analiz Yapılıyor"
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
          <VStack spacing={6} align="stretch" w="100%">
            <Box bg="blue.50" p={6} borderRadius="lg">
              <SimpleGrid columns={2} spacing={6}>
                <Box>
                  <Text fontWeight="bold" mb={2}>Anne İsmi Analizi</Text>
                  <Text>İsim: {result.mother_name} ({result.mother_arabic})</Text>
                  <Text>Harf Sayısı: {result.mother_letter_count}</Text>
                  <Text>Ebced Değeri: {result.mother_ebced}</Text>
                  {renderLetterAnalysis(result.mother_letters, "Anne İsmi Harf Analizi")}
                </Box>
                
                <Box>
                  <Text fontWeight="bold" mb={2}>Çocuk İsmi Analizi</Text>
                  <Text>İsim: {result.child_name} ({result.child_arabic})</Text>
                  <Text>Harf Sayısı: {result.child_letter_count}</Text>
                  <Text>Ebced Değeri: {result.child_ebced}</Text>
                  {renderLetterAnalysis(result.child_letters, "Çocuk İsmi Harf Analizi")}
                </Box>
              </SimpleGrid>
            </Box>

            <Divider />

            <Box bg="green.50" p={6} borderRadius="lg">
              <Text fontWeight="bold" fontSize="xl" mb={4}>Kelime Analizleri</Text>
              <SimpleGrid columns={3} spacing={6}>
                <Box>
                  <Text fontWeight="bold">Bolluk Bereket</Text>
                  <Text>Kelime: {result.blessing_word}</Text>
                  <Text>Harf Sayısı: {result.blessing_letter_count}</Text>
                  <Text>Ebced Değeri: {result.blessing_ebced}</Text>
                  {renderLetterAnalysis(result.blessing_letters, "Bolluk Bereket Harf Analizi")}
                </Box>

                <Box>
                  <Text fontWeight="bold">Rızık</Text>
                  <Text>Kelime: {result.provision_word}</Text>
                  <Text>Harf Sayısı: {result.provision_letter_count}</Text>
                  <Text>Ebced Değeri: {result.provision_ebced}</Text>
                  {renderLetterAnalysis(result.provision_letters, "Rızık Harf Analizi")}
                </Box>

                <Box>
                  <Text fontWeight="bold">Şifa</Text>
                  <Text>Kelime: {result.healing_word}</Text>
                  <Text>Harf Sayısı: {result.healing_letter_count}</Text>
                  <Text>Ebced Değeri: {result.healing_ebced}</Text>
                  {renderLetterAnalysis(result.healing_letters, "Şifa Harf Analizi")}
                </Box>
              </SimpleGrid>
            </Box>

            <Divider />

            <Box bg="purple.50" p={6} borderRadius="lg">
              <Text fontWeight="bold" fontSize="xl" mb={4}>Toplam Değerler</Text>
              <SimpleGrid columns={2} spacing={6}>
                <Box>
                  <Text fontWeight="bold">Toplam Harf Sayısı</Text>
                  <Text fontSize="2xl">{result.total_letter_count}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Toplam Ebced Değeri</Text>
                  <Text fontSize="2xl">{result.total_ebced}</Text>
                </Box>
              </SimpleGrid>
            </Box>

            <Divider />

            <Box bg="orange.50" p={6} borderRadius="lg">
              <Text fontWeight="bold" fontSize="xl" mb={4}>Önerilen Ayetler</Text>
              <SimpleGrid columns={2} spacing={6}>
                <Box>
                  <Text fontWeight="bold">1. Önerilen Ayet</Text>
                  <Text>Sure: {result.first_verse.sure}</Text>
                  <Text>Ayet: {result.first_verse.ayet}</Text>
                  <Text fontSize="sm" color="gray.600">
                    (Toplam Harf Sayısı = Sure No, Toplam Ebced = Ayet No)
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">2. Önerilen Ayet</Text>
                  <Text>Sure: {result.second_verse.sure}</Text>
                  <Text>Ayet: {result.second_verse.ayet}</Text>
                  <Text fontSize="sm" color="gray.600">
                    (Toplam Ebced = Sure No, Toplam Harf Sayısı = Ayet No)
                  </Text>
                </Box>
              </SimpleGrid>
            </Box>
          </VStack>
        )}
      </VStack>
    </Container>
  );
};

export default FinancialBlessing; 