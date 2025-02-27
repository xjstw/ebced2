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
  useToast,
  Card,
  CardHeader,
  CardBody,
  Divider,
  List,
  ListItem,
  ListIcon,
  OrderedList,
  Badge,
  SimpleGrid,
  UnorderedList
} from '@chakra-ui/react';
import { MdCalculate } from 'react-icons/md';

interface LetterAnalysis {
  letter: string;
  ebced: number;
  element: string;
  nurani_zulmani: string;
  gender: string;
}

interface VerseInfo {
  surah_name: string;
  surah_number: number;
  verse_number: number;
  verse_text: string;
  original_number: number;
}

interface VerseAnalysis {
  verse_number: string;
  arabic_text: string;
  turkish_meaning: string;
  surah_name: string;
  ebced: number;
  ebced_difference: number;
}

interface ManagerVerseResponse {
  mother_name: string
  mother_arabic: string
  mother_ebced: number
  mother_letters: LetterAnalysis[]
  child_name: string
  child_arabic: string
  child_ebced: number
  child_letters: LetterAnalysis[]
  total_ebced: number
  total_arabic_letters: number
  method1_verses: VerseAnalysis[]
  method2_verses: VerseAnalysis[]
}

export default function ManagerVerse() {
  const [motherName, setMotherName] = useState('');
  const [childName, setChildName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ManagerVerseResponse | null>(null);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('http://localhost:8000/manager-verse/calculate', {
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

  const renderVerseResults = (verses: VerseAnalysis[], title: string) => (
    <Card>
      <CardBody>
        <VStack align="stretch" spacing={4}>
          <Heading as="h3" size="md">
            {title}
          </Heading>

          {verses.length > 0 ? (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {verses.map((verse, index) => (
                <Box
                  key={index}
                  borderWidth="1px"
                  borderRadius="lg"
                  overflow="hidden"
                  bg="white"
                  _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }}
                  transition="all 0.2s"
                  position="relative"
                >
                  {/* Ebced Fark Rozeti */}
                  <Badge
                    position="absolute"
                    top={2}
                    right={2}
                    colorScheme={verse.ebced_difference <= 5 ? 'green' : verse.ebced_difference <= 20 ? 'yellow' : 'red'}
                    variant="solid"
                    fontSize="xs"
                    px={2}
                    py={1}
                    borderRadius="full"
                  >
                    Fark: {verse.ebced_difference}
                  </Badge>

                  <Box p={4}>
                    {/* Sure ve Ayet Bilgisi */}
                    <Text fontWeight="bold" mb={2}>
                      {verse.surah_name} - Ayet: {verse.verse_number}
                    </Text>

                    {/* Arapça Metin */}
                    <Text
                      fontFamily="arabic"
                      fontSize="xl"
                      mb={3}
                      textAlign="right"
                      color="gray.700"
                    >
                      {verse.arabic_text}
                    </Text>

                    {/* Türkçe Meal */}
                    <Text fontSize="sm" color="gray.600" mb={3}>
                      {verse.turkish_meaning}
                    </Text>

                    {/* Ebced Değeri */}
                    <Text color="blue.600" fontWeight="medium">
                      Ebced Değeri: {verse.ebced}
                    </Text>
                  </Box>
                </Box>
              ))}
            </SimpleGrid>
          ) : (
            <Alert status="warning">
              <AlertIcon />
              Bu yönteme göre uygun ayet bulunamadı
            </Alert>
          )}
        </VStack>
      </CardBody>
    </Card>
  )

  return (
    <Container maxW="container.xl" py={8}>
      <Stack spacing={8}>
        <Box>
          <Heading as="h1" size="xl" mb={4}>
            Yönetici Ayet Hesaplama
          </Heading>
          <Text>
            Anne ve çocuk isimlerinin ebced değerlerine göre iki farklı yöntemle yönetici ayetler hesaplanır.
          </Text>
        </Box>

        <Alert status="info" variant="left-accent">
          <VStack align="start" spacing={2}>
            <Text fontWeight="bold">İki farklı hesaplama yöntemi kullanılır:</Text>
            <Box>
              <Text fontWeight="bold">1. Yöntem:</Text>
              <UnorderedList>
                <ListItem>Toplam harf sayısı sure numarası olarak kullanılır</ListItem>
                <ListItem>Toplam ebced değeri ayet numarası olarak kullanılır</ListItem>
                <ListItem>Ayet numarası çok büyükse rakamları toplanarak sadeleştirilir</ListItem>
              </UnorderedList>
            </Box>
            <Box>
              <Text fontWeight="bold">2. Yöntem:</Text>
              <UnorderedList>
                <ListItem>Toplam harf sayısı ayet numarası olarak kullanılır</ListItem>
                <ListItem>Toplam ebced değeri sure numarası olarak kullanılır</ListItem>
                <ListItem>Sure numarası çok büyükse rakamları toplanarak sadeleştirilir</ListItem>
              </UnorderedList>
            </Box>
          </VStack>
        </Alert>

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
            {/* İsim Analizleri */}
            <Card>
              <CardBody>
                <VStack align="stretch" spacing={4}>
                  <Heading as="h3" size="md">
                    İsim Analizleri
                  </Heading>
                  
                  {/* Anne İsmi */}
                  <Box bg="pink.50" p={4} borderRadius="md">
                    <Heading as="h4" size="sm" mb={2}>
                      Anne İsmi
                    </Heading>
                    <Text>
                      <strong>İsim:</strong> {result.mother_name}
                    </Text>
                    <Text fontFamily="arabic">
                      <strong>Arapça:</strong> {result.mother_arabic}
                    </Text>
                    <Text color="pink.600" fontWeight="bold">
                      <strong>Ebced Değeri:</strong> {result.mother_ebced}
                    </Text>
                  </Box>

                  {/* Çocuk İsmi */}
                  <Box bg="blue.50" p={4} borderRadius="md">
                    <Heading as="h4" size="sm" mb={2}>
                      Çocuk İsmi
                    </Heading>
                    <Text>
                      <strong>İsim:</strong> {result.child_name}
                    </Text>
                    <Text fontFamily="arabic">
                      <strong>Arapça:</strong> {result.child_arabic}
                    </Text>
                    <Text color="blue.600" fontWeight="bold">
                      <strong>Ebced Değeri:</strong> {result.child_ebced}
                    </Text>
                  </Box>

                  {/* Toplam Değerler */}
                  <Box bg="purple.50" p={4} borderRadius="md">
                    <Heading as="h4" size="sm" mb={2}>
                      Toplam Değerler
                    </Heading>
                    <Text>
                      <strong>Toplam Ebced Değeri:</strong> {result.total_ebced}
                    </Text>
                    <Text>
                      <strong>Toplam Harf Sayısı:</strong> {result.total_arabic_letters}
                    </Text>
                  </Box>
                </VStack>
              </CardBody>
            </Card>

            {/* 1. Yöntem Sonuçları */}
            <Card>
              <CardBody>
                <VStack align="stretch" spacing={4}>
                  <Alert status="info" variant="left-accent" mb={4}>
                    <VStack align="start" spacing={3}>
                      <Text fontWeight="bold" fontSize="lg">YÖNETİCİ SURE VE AYET NE DEMEK?</Text>
                      <Text>
                        Yönetici sure ve ayetlerde esmalar gibidir.
                      </Text>
                      <Text>
                        Kişiler tekamülünde var olan sınavlar, başına gelen olaylar, durumlar ya da değiştirip dönüştürülmesi gereken yanlarını dengelemek ve şifalandırmak için okuyabilir ve kendi öz farkındalığına varabilir.
                      </Text>
                      <Text>
                        Surelerin ve ayetlerin anlattığı olay ve değindiği konularla ilgili, kişilerin kendinde veya hayatında farkındalığa varması ve bu konular üzerinde çalışma yapması kişilerin ya da hayatlarının akışının düzene girmesi ve dengelenmesi için önemlidir.
                      </Text>
                      <Text>
                        Hayatında belli konularda blokaj olduğunu, hep aynı döngüleri yaşadığını düşünen kişiler eğer kendilerine bakan yönüyle ayetlerini ele alırlarsa bu blokajı veya döngüyü neden yaşadıklarını anlayabilirler.
                      </Text>
                      <Text>
                        Örneğin; kendisine zekatla ilgili ayetlerin çıkıyor olması kişinin maddi blokajlarının neden kaynaklandığını gösterir. (Ancak bu blokajın sebeplerinden sadece 1 tanesi olabilir burada dikkatli olunmalı)
                      </Text>
                      <Box>
                        <Text fontWeight="bold">Önemli Notlar:</Text>
                        <UnorderedList>
                          <ListItem>İsminize bakan yönüyle size çıkan ayetleri en az 21 gün okuyun, bununla beraber aslında durumunuz şifalanıncaya kadar okumanız önerilir.</ListItem>
                          <ListItem>Ayetleri okumaya en az 7-11-22 veya 33 adet gibi düşük adetler ile başlayın ve daha sonra zamanla istediğiniz sayıda yükselterek okuyabilirsiniz.</ListItem>
                          <ListItem color="red.500" fontWeight="bold">Kadınlar özel hallerinde ayet okuması yapamaz.</ListItem>
                        </UnorderedList>
                      </Box>
                    </VStack>
                  </Alert>
                  {renderVerseResults(result.method1_verses, "1. Yöntem - Yönetici Ayet")}
                </VStack>
              </CardBody>
            </Card>

            {/* 2. Yöntem Sonuçları */}
            {renderVerseResults(result.method2_verses, "2. Yöntem - Yönetici Ayet")}
          </Stack>
        )}
      </Stack>
    </Container>
  );
} 