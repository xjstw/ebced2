import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Input,
  Button,
  Heading,
  Text,
  VStack,
  Alert,
  AlertIcon,
  AlertTitle,
  Spinner,
  useToast,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Badge,
  Table,
  Thead,
  Tbody as TableBody,
  Tr,
  Th,
  Td,
  Divider,
  HStack,
  Tag,
  SimpleGrid,
  Progress,
  Collapse,
  UnorderedList,
  ListItem,
  FormControl,
  FormLabel,
  Stack,
  Card,
  CardBody,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon, DownloadIcon, ViewIcon } from '@chakra-ui/icons';
import { api } from '../api/config';
import { FaPrint } from 'react-icons/fa';

interface AnalysisResult {
  success: boolean;
  data?: any;
  error?: string;
}

interface ComprehensiveResponse {
  message: string;
  mother_name: string;
  child_name: string;
  disease_name: string;
  manager_esma_analysis: AnalysisResult;
  personal_manager_analysis: AnalysisResult;
  manager_verse_analysis: AnalysisResult;
  disease_analysis: AnalysisResult;
  magic_analysis: AnalysisResult;
  disease_prone_analysis: AnalysisResult;
  financial_blessing_analysis: AnalysisResult;
}

const keyTranslations: { [key: string]: string } = {
  // Genel Anahtarlar
  "mother_name": "Anne Adı",
  "mother_name_arabic": "Anne Adı (Arapça)",
  "child_name": "Çocuk Adı",
  "child_name_arabic": "Çocuk Adı (Arapça)",
  "disease_name": "Hastalık Adı",
  "arabic": "Arapça",
  "mother_name_ebced": "Anne Adı Ebced Değeri",
  "child_name_ebced": "Çocuk Adı Ebced Değeri",
  "ebced": "Ebced Değeri",
  "mother_name_letters": "Anne Adı Harfleri",
  "mother_arabic": "Anne Adı (Arapça)",
  "child_name_letters": "Çocuk Adı Harfleri",
  "child_arabic": "Çocuk Adı (Arapça)",
  "mother_letters": "Anne Adı Harfleri",
  "child_letters": "Çocuk Adı Harfleri",
  "mother_ebced": "Anne Adı Ebced Değeri",
  "child_ebced": "Çocuk Adı Ebced Değeri",
  "total_arabic_letters": "Toplam Arapça Harf Sayısı",
  "selected_esma_meaning": "Seçilen Esma Anlamı",
  "selected_esma_arabic": "Seçilen Esma (Arapça)",
  "selected_esma_ebced": "Seçilen Esma Ebced Değeri",
  "method1_verses": "Yöntem 1 Ayetleri",
  "method2_verses": "Yöntem 2 Ayetleri",
  "ebced_difference": "Ebced Farkı",
  "mother": "Anne",
  "letters": "Harfler",
  "letter": "Harf",
  "element": "Element",
  "nurani_zulmani": "Nurani/Zülmani",
  "gender": "Cinsiyet",
  "element_counts": "Element Sayıları",
  "dominant_element": "Baskın Element",
  "nurani_ratio": "Nurani Oranı",
  "gender_ratio": "Cinsiyet Oranı",
  "selected_esma": "Seçilen Esma",
  "name": "İsim",
  "meaning": "Anlam",
  "selection_reason": "Seçilme Nedeni",
  "total_ebced": "Toplam Ebced",
  "remainder": "Kalan",
  "issue_type": "Sorun Tipi",
  "issue_description": "Sorun Açıklaması",
  "disease_type": "Hastalık Tipi",
  "disease_description": "Hastalık Açıklaması",
  "success": "Başarı",
  "error": "Hata",
  "data": "Veri",
  "message": "Mesaj",
  "total_count": "Toplam Harf Sayısı",
  "total_letters": "Toplam Harf",
  "total_arabic_ebced": "Toplam Arapça Ebced",
  "total_arabic_letters_count": "Toplam Arapça Harf Sayısı",
  "elements": "Elementler",
  "child": "Çocuk",
  "disease": "Hastalık",
  "nurani_analysis": "Nurani Analizi",
  "combined_analysis": "Birleşik Analiz",
  "recommended_esmas": "Önerilen Esmalar",
  "recommended_verses": "Önerilen Ayetler",
  "warning_message": "Uyarı Mesajı",
  
  // Maddi Blokaj/Bolluk Bereket Rızık Analizi
  "mother_letter_count": "Anne İsmi Harf Sayısı",
  "child_letter_count": "Çocuk İsmi Harf Sayısı",
  "blessing_word": "Bolluk Bereket Kelimesi",
  "blessing_letter_count": "Bolluk Bereket Harf Sayısı",
  "blessing_ebced": "Bolluk Bereket Ebced Değeri",
  "provision_word": "Rızık Kelimesi",
  "provision_letter_count": "Rızık Harf Sayısı",
  "provision_ebced": "Rızık Ebced Değeri",
  "healing_word": "Şifa Kelimesi",
  "healing_letter_count": "Şifa Harf Sayısı",
  "healing_ebced": "Şifa Ebced Değeri",
  "total_letter_count": "Toplam Harf Sayısı",
  "first_verse": "1. Önerilen Ayet",
  "second_verse": "2. Önerilen Ayet",
  "sure": "Sure",
  "ayet": "Ayet"
};

const translateKey = (key: string): string => {
  return keyTranslations[key] || key;
};

// Element renkleri için sabitler
const ELEMENT_COLORS: { [key: string]: string } = {
  'ATEŞ': 'red.100',
  'HAVA': 'yellow.100',
  'TOPRAK': 'orange.100',
  'SU': 'blue.100'
};

const ELEMENT_TEXT_COLORS: { [key: string]: string } = {
  'ATEŞ': 'red.800',
  'HAVA': 'yellow.800',
  'TOPRAK': 'orange.800',
  'SU': 'blue.800'
};

const formatLetters = (letters: any[]): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Box borderRadius="md" overflow="hidden">
      <Button 
        onClick={() => setIsOpen(!isOpen)} 
        variant="ghost" 
        rightIcon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
        justifyContent="space-between"
        width="100%"
      >
        Harf Analizi
      </Button>
      <Collapse in={isOpen}>
        <Table variant="simple" size="sm">
          <Thead bg="blue.50">
            <Tr>
              <Th color="blue.800">HARF</Th>
              <Th color="blue.800">EBCED</Th>
              <Th color="blue.800">ELEMENT</Th>
              <Th color="blue.800">NURANİ/ZÜLMANİ</Th>
              <Th color="blue.800">CİNSİYET</Th>
            </Tr>
          </Thead>
          <TableBody>
            {letters.map((letter, index) => (
              <Tr key={index}>
                <Td>
                  <Tag colorScheme="blue" borderRadius="full" size="lg" fontFamily="'Noto Naskh Arabic', serif" fontWeight="bold">
                    {letter.letter}
                  </Tag>
                </Td>
                <Td fontWeight="semibold">{letter.ebced}</Td>
                <Td>
                  <Tag
                    colorScheme={
                      letter.element === 'ATEŞ' ? 'red' :
                      letter.element === 'HAVA' ? 'yellow' :
                      letter.element === 'TOPRAK' ? 'orange' :
                      'blue'
                    }
                    borderRadius="full"
                  >
                    {letter.element}
                  </Tag>
                </Td>
                <Td>
                  <Tag
                    colorScheme={letter.nurani_zulmani === 'N' ? 'green' : 'purple'}
                    borderRadius="full"
                  >
                    {letter.nurani_zulmani === 'N' ? 'NURANİ' : 'ZÜLMANİ'}
                  </Tag>
                </Td>
                <Td>
                  <Tag
                    colorScheme={letter.gender === 'E' ? 'blue' : 'pink'}
                    borderRadius="full"
                  >
                    {letter.gender === 'E' ? 'ERİL' : 'DİŞİL'}
                  </Tag>
                </Td>
              </Tr>
            ))}
          </TableBody>
        </Table>
      </Collapse>
    </Box>
  )
}

const formatElements = (elements: any): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);

  console.log('Raw elements data:', elements);

  // Eğer elements undefined veya null ise boş bir div döndür
  if (!elements) {
    console.log('Elements is null or undefined');
    return <Box />;
  }

  // Veriyi doğru formata dönüştür
  let formattedElements: Record<string, { count: number; ebced: number }> = {};

  if (typeof elements === 'object' && !Array.isArray(elements)) {
    // Direkt sayı değerleri içeren obje formatı
    if (Object.values(elements).every(value => typeof value === 'number')) {
      formattedElements = Object.entries(elements).reduce((acc, [element, count]) => {
        acc[element] = {
          count: count as number,
          ebced: 0 // Bu durumda ebced değeri olmadığı için 0 atıyoruz
        };
        return acc;
      }, {} as Record<string, { count: number; ebced: number }>);
    }
    // Diğer obje formatları için mevcut işleme devam et
    else if (elements.element_counts) {
      formattedElements = Object.entries(elements.element_counts).reduce((acc, [element, count]) => {
        acc[element] = {
          count: count as number,
          ebced: elements.element_ebced?.[element] || 0
        };
        return acc;
      }, {} as Record<string, { count: number; ebced: number }>);
    } else {
      formattedElements = elements;
    }
  }

  console.log('Formatted elements:', formattedElements);

  return (
    <Box>
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
        <Table variant="striped" size="md" bg="white" borderRadius="md" boxShadow="sm">
          <Thead bg="blue.50">
            <Tr>
              <Th color="blue.800" textTransform="uppercase">ELEMENT</Th>
              <Th color="blue.800" textTransform="uppercase">ADET</Th>
              <Th color="blue.800" textTransform="uppercase">EBCED</Th>
            </Tr>
          </Thead>
          <TableBody>
            {Object.entries(formattedElements).map(([element, data], index) => (
              <Tr key={index}>
                <Td>
                  <Tag
                    colorScheme={
                      element === 'ATEŞ' ? 'red' :
                      element === 'HAVA' ? 'yellow' :
                      element === 'TOPRAK' ? 'orange' :
                      'blue'
                    }
                    borderRadius="full"
                  >
                    {element}
                  </Tag>
                </Td>
                <Td fontWeight="semibold">{typeof data === 'number' ? data : data.count}</Td>
                <Td fontWeight="semibold">{typeof data === 'number' ? 0 : data.ebced}</Td>
              </Tr>
            ))}
          </TableBody>
        </Table>
      </Collapse>
    </Box>
  );
};

const formatNuraniAnalysis = (analysis: any): JSX.Element => {
  return (
    <Box bg="gray.50" p={4} borderRadius="md" boxShadow="sm">
      <VStack align="stretch" spacing={4}>
        <Box bg="white" p={4} borderRadius="md">
          <Text fontWeight="bold" mb={2}>Genel Bilgiler</Text>
          <SimpleGrid columns={3} spacing={4}>
            <Box>
              <Text color="gray.600">Toplam Adet</Text>
              <Text fontWeight="bold">{analysis.total_count}</Text>
            </Box>
            <Box>
              <Text color="gray.600">Toplam Ebced</Text>
              <Text fontWeight="bold">{analysis.total_ebced}</Text>
            </Box>
            <Box>
              <Text color="gray.600">Baskın Element</Text>
              <Tag
                colorScheme={
                  analysis.dominant_element === 'ATEŞ' ? 'red' :
                  analysis.dominant_element === 'HAVA' ? 'yellow' :
                  analysis.dominant_element === 'TOPRAK' ? 'orange' :
                  'blue'
                }
                borderRadius="full"
              >
                {analysis.dominant_element}
              </Tag>
            </Box>
          </SimpleGrid>
        </Box>
        <Box bg="white" p={4} borderRadius="md">
          <Text fontWeight="bold" mb={2}>Element Dağılımı</Text>
          {formatElements(analysis.elements)}
        </Box>
      </VStack>
    </Box>
  );
};

const formatValue = (value: any, depth: number = 0, key?: string): JSX.Element | string => {
  const [isOpen, setIsOpen] = useState(false);

  if (value === null || value === undefined) {
    return '';
  }

  // Debug için veriyi logla
  console.log('formatValue called with:', { value, depth, key });

  // Özel durumlar için kontrol
  if (key === 'mother_letters' || key === 'child_letters' || key === 'letters' || key === 'mother_name_letters' || key === 'child_name_letters') {
    return formatLetters(value);
  }

  if (key === 'elements' || key === 'element_counts' || key === 'Element analizi') {
    // Eğer value bir string ve "Element analizi:" içeriyorsa
    if (typeof value === 'string' && value.includes('Element analizi:')) {
      const lines = value.split('\n').filter(line => line.trim());
      const elements: Record<string, { count: number; ebced: number }> = {};
      
      lines.forEach(line => {
        const match = line.match(/([A-ZŞİĞÜÇÖ]+): (\d+) harf - Ebced: (\d+)/);
        if (match) {
          elements[match[1]] = {
            count: parseInt(match[2]),
            ebced: parseInt(match[3])
          };
        }
      });
      
      return formatElements(elements);
    }
    
    // Eğer value bir obje ve element_counts/element_ebced içeriyorsa
    if (typeof value === 'object' && value.element_counts) {
      const elements: Record<string, { count: number; ebced: number }> = {};
      Object.entries(value.element_counts).forEach(([element, count]) => {
        elements[element] = {
          count: count as number,
          ebced: value.element_ebced?.[element] || 0
        };
      });
      return formatElements(elements);
    }
    
    // Diğer durumlar için direkt formatElements'i kullan
    return formatElements(value);
  }

  if (key === 'recommended_esmas') {
    return (
      <VStack align="stretch" spacing={4}>
        {value.map((item: any, index: number) => (
          <Box key={index} p={6} bg="white" borderRadius="md" borderWidth="1px">
            <Text fontSize="xl" fontWeight="bold">{item.name}</Text>
            <Text fontSize="xl" fontFamily="'Noto Naskh Arabic', serif">{item.arabic}</Text>
            <Text fontSize="lg">Ebced Değeri: {item.ebced}</Text>
            <Text fontSize="lg">Anlam: {item.meaning}</Text>
            <Text fontSize="lg" mt={2}>Element Sayıları:</Text>
            <HStack spacing={2} mt={1}>
              {Object.entries(item.element_counts as Record<string, number>).map(([element, count]) => (
                count > 0 && (
                  <Tag
                    key={element}
                    colorScheme={
                      element === 'ATEŞ' ? 'red' :
                      element === 'HAVA' ? 'yellow' :
                      element === 'TOPRAK' ? 'orange' :
                      'blue'
                    }
                    borderRadius="full"
                    size="lg"
                    fontSize="lg"
                  >
                    {element}: {count}
                  </Tag>
                )
              ))}
            </HStack>
            <Text fontSize="lg" mt={4}>Seçilme Nedeni: {item.selection_reason}</Text>
          </Box>
        ))}
      </VStack>
    );
  }

  if (key === 'recommended_verses' || key?.includes('verses') || (Array.isArray(value) && value[0]?.verse_number)) {
    return (
      <Box>
        <Button 
          onClick={() => setIsOpen(!isOpen)} 
          variant="ghost" 
          rightIcon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
          justifyContent="space-between"
          width="100%"
        >
          Ayet Detayları
        </Button>
        <Collapse in={isOpen}>
          <VStack spacing={4}>
            {key === 'recommended_verses' && (
              <Alert status="info" variant="left-accent" mb={4}>
                <VStack align="start" spacing={3}>
                  <Text fontWeight="bold" fontSize="lg">YÖNETİCİ SURE VE AYET NE DEMEK?</Text>
                  <Text>Yönetici sure ve ayetlerde esmalar gibidir.</Text>
                  <Text>
                    Kişiler tekamülünde var olan sınavlar, başına gelen olaylar, durumlar ya da değiştirip dönüştürülmesi gereken yanlarını dengelemek ve şifalandırmak için okuyabilir ve kendi öz farkındalığına varabilir.
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
            )}
            <Table variant="simple" size="md">
              <Thead bg="blue.50">
                <Tr>
                  <Th color="blue.800">SURE/AYET</Th>
                  <Th color="blue.800">SURE ADI</Th>
                  <Th color="blue.800">ARAPÇA METİN</Th>
                  <Th color="blue.800">TÜRKÇE ANLAM</Th>
                  <Th color="blue.800">EBCED</Th>
                  <Th color="blue.800">FARK</Th>
                </Tr>
              </Thead>
              <TableBody>
                {value.map((verse: any, index: number) => (
                  <Tr key={index}>
                    <Td>{verse.verse_number}</Td>
                    <Td>{verse.surah_name}</Td>
                    <Td fontFamily="'Noto Naskh Arabic', serif">{verse.arabic_text}</Td>
                    <Td>{verse.turkish_meaning}</Td>
                    <Td>{verse.ebced}</Td>
                    <Td>{verse.ebced_difference}</Td>
                  </Tr>
                ))}
              </TableBody>
            </Table>
          </VStack>
        </Collapse>
      </Box>
    );
  }

  // Temel veri tipleri için
  if (typeof value !== 'object') {
    return <Text fontSize="lg">{String(value)}</Text>;
  }

  // Array kontrolü
  if (Array.isArray(value)) {
    return (
      <VStack align="stretch" spacing={2}>
        {value.map((item, index) => (
          <Box key={index} p={4} bg="white" borderRadius="md">
            {formatValue(item, depth + 1)}
          </Box>
        ))}
      </VStack>
    );
  }

  // Nesne için tablo formatı
  return (
    <Box borderRadius="md" overflow="hidden">
      <Table variant="simple" size="lg" bg="white">
        <TableBody>
          {Object.entries(value).map(([entryKey, entryValue]) => {
            if (entryKey === "personal_manager_analysis" && typeof entryValue === 'object' && entryValue !== null) {
              const filteredData = Object.entries(entryValue as Record<string, unknown>).filter(([k]) => 
                !["lower_esma", "upper_esma", "differences", "ebced_difference"].includes(k)
              );
              return filteredData.map(([k, v]) => (
                <Tr key={k}>
                  <Th width="30%" fontSize="lg" color="gray.700" bg="gray.50">
                    {translateKey(k)}
                  </Th>
                  <Td fontSize="lg">{formatValue(v, depth + 1, k)}</Td>
                </Tr>
              ));
            }

            if (entryKey.startsWith('_') || entryValue === null || entryValue === undefined) {
              return null;
            }

            return (
              <Tr key={entryKey}>
                <Th 
                  width="30%" 
                  fontSize="lg" 
                  color="gray.700"
                  bg="gray.50"
                >
                  {translateKey(entryKey)}
                </Th>
                <Td fontSize="lg">{formatValue(entryValue, depth + 1, entryKey)}</Td>
              </Tr>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
};

const formatFinancialBlessingAnalysis = (analysis: any): JSX.Element => {
  // Backend'den gelen veriyi doğru şekilde al
  const data = analysis?.data || {};
  
  return (
    <VStack spacing={4} align="stretch">
      <Box bg="blue.50" p={4} borderRadius="md">
        <SimpleGrid columns={2} spacing={4}>
          <Box>
            <Text fontWeight="bold" mb={2}>İsim Analizleri</Text>
            <VStack align="start" spacing={2}>
              <HStack>
                <Text color="gray.600">Anne İsmi:</Text>
                <Text>{data.mother_name} ({data.mother_arabic})</Text>
              </HStack>
              <HStack>
                <Text color="gray.600">Çocuk İsmi:</Text>
                <Text>{data.child_name} ({data.child_arabic})</Text>
              </HStack>
            </VStack>
          </Box>
          <Box>
            <Text fontWeight="bold" mb={2}>Harf Sayıları</Text>
            <VStack align="start" spacing={2}>
              <HStack>
                <Text color="gray.600">Anne İsmi:</Text>
                <Text>{data.mother_letter_count} harf</Text>
              </HStack>
              <HStack>
                <Text color="gray.600">Çocuk İsmi:</Text>
                <Text>{data.child_letter_count} harf</Text>
              </HStack>
            </VStack>
          </Box>
        </SimpleGrid>
      </Box>

      <Box bg="green.50" p={4} borderRadius="md">
        <Text fontWeight="bold" mb={4}>Kelime Analizleri</Text>
        <SimpleGrid columns={3} spacing={4}>
          <Box>
            <VStack align="start" spacing={2}>
              <Text fontWeight="semibold">Bolluk Bereket</Text>
              <Text fontFamily="'Noto Naskh Arabic', serif">{data.blessing_word}</Text>
              <Text>{data.blessing_letter_count} harf</Text>
              <Text>Ebced: {data.blessing_ebced}</Text>
            </VStack>
          </Box>
          <Box>
            <VStack align="start" spacing={2}>
              <Text fontWeight="semibold">Rızık</Text>
              <Text fontFamily="'Noto Naskh Arabic', serif">{data.provision_word}</Text>
              <Text>{data.provision_letter_count} harf</Text>
              <Text>Ebced: {data.provision_ebced}</Text>
            </VStack>
          </Box>
          <Box>
            <VStack align="start" spacing={2}>
              <Text fontWeight="semibold">Şifa</Text>
              <Text fontFamily="'Noto Naskh Arabic', serif">{data.healing_word}</Text>
              <Text>{data.healing_letter_count} harf</Text>
              <Text>Ebced: {data.healing_ebced}</Text>
            </VStack>
          </Box>
        </SimpleGrid>
      </Box>

      <Box bg="purple.50" p={4} borderRadius="md">
        <Text fontWeight="bold" mb={4}>Toplam Değerler</Text>
        <SimpleGrid columns={2} spacing={4}>
          <Box>
            <VStack align="start" spacing={2}>
              <Text color="gray.600">Toplam Harf Sayısı:</Text>
              <Text fontSize="xl" fontWeight="bold">{data.total_letter_count}</Text>
            </VStack>
          </Box>
          <Box>
            <VStack align="start" spacing={2}>
              <Text color="gray.600">Toplam Ebced Değeri:</Text>
              <Text fontSize="xl" fontWeight="bold">{data.total_ebced}</Text>
            </VStack>
          </Box>
        </SimpleGrid>
      </Box>

      <Box bg="orange.50" p={4} borderRadius="md">
        <Text fontWeight="bold" mb={4}>Önerilen Ayetler</Text>
        <SimpleGrid columns={2} spacing={4}>
          <Box>
            <VStack align="start" spacing={2}>
              <Text fontWeight="semibold">1. Önerilen Ayet</Text>
              <Text>Sure: {data.first_verse?.sure} - {data.first_verse?.sure_name}</Text>
              <Text>Ayet: {data.first_verse?.ayet}</Text>
              <Text fontFamily="'Noto Naskh Arabic', serif" fontSize="xl" my={2}>
                {data.first_verse?.arabic_text}
              </Text>
              <Text fontSize="md" color="gray.700">
                {data.first_verse?.turkish_meaning}
              </Text>
              <Text fontSize="sm" color="gray.600">
                (Toplam Harf Sayısı = Sure No, Toplam Ebced = Ayet No)
              </Text>
            </VStack>
          </Box>
          <Box>
            <VStack align="start" spacing={2}>
              <Text fontWeight="semibold">2. Önerilen Ayet</Text>
              <Text>Sure: {data.second_verse?.sure} - {data.second_verse?.sure_name}</Text>
              <Text>Ayet: {data.second_verse?.ayet}</Text>
              <Text fontFamily="'Noto Naskh Arabic', serif" fontSize="xl" my={2}>
                {data.second_verse?.arabic_text}
              </Text>
              <Text fontSize="md" color="gray.700">
                {data.second_verse?.turkish_meaning}
              </Text>
              <Text fontSize="sm" color="gray.600">
                (Toplam Ebced = Sure No, Toplam Harf Sayısı = Ayet No)
              </Text>
            </VStack>
          </Box>
        </SimpleGrid>
      </Box>

      {/* Harf analizleri için yeni bölüm 
      <Box bg="teal.50" p={4} borderRadius="md">
        <Text fontWeight="bold" mb={4}>Detaylı Harf Analizleri</Text>
        <SimpleGrid columns={1} spacing={4}>
          <Box>
            <Text fontWeight="semibold" mb={2}>Anne İsmi Harf Analizi</Text>
            {formatLetters(data.mother_letters)}
          </Box>
          <Box>
            <Text fontWeight="semibold" mb={2}>Çocuk İsmi Harf Analizi</Text>
            {formatLetters(data.child_letters)}
          </Box>
          <Box>
            <Text fontWeight="semibold" mb={2}>Bolluk Bereket Kelimesi Harf Analizi</Text>
            {formatLetters(data.blessing_letters)}
          </Box>
          <Box>
            <Text fontWeight="semibold" mb={2}>Rızık Kelimesi Harf Analizi</Text>
            {formatLetters(data.provision_letters)}
          </Box>
          <Box>
            <Text fontWeight="semibold" mb={2}>Şifa Kelimesi Harf Analizi</Text>
            {formatLetters(data.healing_letters)}
          </Box>
        </SimpleGrid>
      </Box>
      */}
    </VStack>
  );
};

const AnalysisSection = ({ title, result, customFormatter }: { title: string; result: AnalysisResult; customFormatter?: (analysis: any) => JSX.Element }) => {
  const filterPersonalManagerData = (data: any) => {
    if (!data) return {};
    
    // Maddi Blokaj analizi için özel işleme
    if (data.financial_blessing_analysis) {
      return data.financial_blessing_analysis.data || {};
    }
    
    // Kişisel Yönetici Esma analizi için sadece seçilen esma bilgilerini göster
    if (data.selected_esma) {
      const { lower_esma, upper_esma, differences, ...rest } = data;
      return rest;
    }
    
    return data;
  };

  // Maddi Blokaj analizi için özel kontrol
  const renderContent = () => {
    if (title.includes("Maddi Blokaj")) {
      return customFormatter ? customFormatter(result.data) : formatValue(result.data, 0);
    }

    return (
      <>
        {result.data && Object.entries(filterPersonalManagerData(result.data)).map(([key, value]) => (
          <Box key={key} mb={4}>
            <Text fontWeight="semibold" mb={2} color="blue.700">
              {translateKey(key)}
            </Text>
            <Box 
              borderRadius="md" 
              bg="gray.50" 
              p={3}
              fontSize="sm"
            >
              {customFormatter ? customFormatter(value) : formatValue(value, 0, key)}
            </Box>
          </Box>
        ))}
      </>
    );
  };

  return (
    <AccordionItem>
      <h2>
        <AccordionButton _expanded={{ bg: 'blue.50' }}>
          <Box flex="1" textAlign="left">
            <HStack spacing={2}>
              <Badge 
                colorScheme={result.success ? "green" : "red"} 
                variant="solid" 
                fontSize="0.8em"
                borderRadius="full"
              >
                {result.success ? "Başarılı" : "Hata"}
              </Badge>
              <Text fontWeight="bold">{title}</Text>
            </HStack>
          </Box>
          <AccordionIcon />
        </AccordionButton>
      </h2>
      <AccordionPanel pb={4} bg="white">
        {result.success ? (
          <Box>
            {(title.includes("anne adıyla yapılan esma analizi") || title.includes("kişinin adıyla yapılan esma analizi")) && (
              <Alert status="info" variant="left-accent" mb={4}>
                <VStack align="start" spacing={3}>
                  <Text fontWeight="bold" fontSize="lg">YÖNETİCİ ESMA NE DEMEK?</Text>
                  <Text>
                    Yönetici esma demek; kişilerin tekamülünde var olan sınavlar, başına gelen olaylar, durumlar ya da değiştirip dönüştürülmesi gereken yanlarını dengelemek ve şifalandırmak için çekebileceği esmadır.
                  </Text>
                  <Text>
                    Bu esmayı çekmek kişilerin eksik olan yanlarını tamamlar fazla olan yanlarını dengeler.
                  </Text>
                  <Text>
                    Esmalar tekâmül yolculuğunda Hak'la bir ve bütün olabilmenin yollarından sadece birisidir.
                  </Text>
                  <Box>
                    <Text fontWeight="bold">Not:</Text>
                    <Text>
                      İsminize bakan yönüyle size çıkan esmanızı en az 21 gün okuyun, bununla beraber aslında durumunuz şifalanıncaya kadar okumanız önerilir.
                    </Text>
                    <Text>
                      Esmaları okumaya en az 100 adet ile başlayın ve daha sonra zamanla esmanızı ebced değerine göre okuyabilirsiniz.
                    </Text>
                    <Text>
                      Örn: 1060 esma ebcedi olan Ya Gani ismini ilk başlarda 100 ile başlayıp zamanla sayıyı 1060'a kadar çıkarabilirsiniz.
                    </Text>
                  </Box>
                  <Box mt={4}>
                    <Text fontWeight="bold">YÖNETİCİ ESMAMIZI ÇEKMENİN FAYDALARI</Text>
                    <Text>
                      Öncelikle burada esmaları sadece sayısal değer olarak çekmek değil tecelli ettirmek üzere çalışma yapılmasından bahsedilmektedir.
                    </Text>
                    <Text>
                      Eğer yönetici esmalarımızı bilir ve bunun bizim hayatımıza tecelli etmesine çalışırsak yönetici esmamızı çekmemizin faydaları şunlar olacaktır:
                    </Text>
                    <UnorderedList mt={2} spacing={2}>
                      <ListItem>Yönetici esmamız sayesinde hayatımız düzene girer.</ListItem>
                      <ListItem>Allah'ın bizim üzerimizde murad ettiği kabiliyet ve özelliklerimiz açığa çıkar biiznillah.</ListItem>
                      <ListItem>Tekamülümüzde bilinç seviyemizi yükseltir.</ListItem>
                      <ListItem>Esmaları zikretmek sadece bir ritüel değil, aynı zamanda zihinsel bir yolculuktur.</ListItem>
                      <ListItem>Manalarına yoğunlaşmak ve derinleşmek, esmaların bizlere sunduğu ilahi sırları keşfetmenin anahtarıdır.</ListItem>
                      <ListItem>Manalarına yoğunlaşarak ve derinleşerek esmalarını hakiki manada hayatina geciren ve uygulayan kisilerin bir muddet sonra dilleri esmanin zikrini biraksa da tum hucreleri o esmayi zikretmeye devam eder biiznillah.</ListItem>
                      <ListItem>Ve o esmanin tecellilerini yasamaya baslar.</ListItem>
                    </UnorderedList>
                    <Box mt={4}>
                      <Text fontWeight="bold">Örnek:</Text>
                      <Text>
                        Ya Vedud esmasını tecelli ettirmek için; Tüm kâinata ve yaratılmışlara karşı koşulsuz sevgi beslemek ve herkese ve her şeye "yaratılmışı severiz Yaratandan ötürü" bilinciyle yaklaşmak ve bunu hayatında düstur edinip kimseyi kırmadan ve kimseye kırılmadan yaşayarak, her yaratılmışa hakkını helal ederek hayatını idame ettirmektir mesele.
                      </Text>
                      <Text>
                        Bunu başarabilen bir kul, Allah'ın izniyle bir müddet sonra ilahi aşka ve insanların gerçek sevgisine mazhar olur.
                      </Text>
                    </Box>
                  </Box>
                </VStack>
              </Alert>
            )}
            {title.includes("Yönetici Ayet") && (
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
            )}
            {renderContent()}
          </Box>
        ) : (
          <Alert status="error" variant="left-accent">
            <AlertIcon />
            <Text>{result.error}</Text>
          </Alert>
        )}
      </AccordionPanel>
    </AccordionItem>
  );
};

const ComprehensiveAnalysis: React.FC = () => {
  const [formData, setFormData] = useState({
    mother_name: '',
    child_name: '',
    disease_name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ComprehensiveResponse | null>(null);
  const toast = useToast();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.post('/comprehensive-analysis/analyze', formData);
      const data = await response.json();
      setResult(data);
      toast({
        title: 'Analiz Tamamlandı',
        description: 'Tüm analizler başarıyla gerçekleştirildi.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
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

  const handleViewReport = () => {
    if (result) {
      navigate('/analysis-report', { state: { result } });
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8}>
        <Box textAlign="center">
          <Heading as="h1" size="xl" mb={4}>
            Kapsamlı Analiz
          </Heading>
          <Text fontSize="lg" color="gray.600">
            Anne ve çocuk için detaylı analiz raporu oluşturun
          </Text>
        </Box>

        <Card width="100%">
          <CardBody>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Anne İsmi</FormLabel>
                  <Input
                    name="mother_name"
                    value={formData.mother_name}
                    onChange={handleChange}
                    placeholder="Anne ismini girin"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Çocuk İsmi</FormLabel>
                  <Input
                    name="child_name"
                    value={formData.child_name}
                    onChange={handleChange}
                    placeholder="Çocuk ismini girin"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Hastalık</FormLabel>
                  <Input
                    name="disease_name"
                    value={formData.disease_name}
                    onChange={handleChange}
                    placeholder="Hastalık ismini girin"
                  />
                </FormControl>

                <Alert status="error" variant="left-accent" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold" color="red.600">
                      LÜTFEN HASTALIK ADINI DOĞRU VE HATASIZ GİRDİĞİNİZE EMİN OLUN!
                    </Text>
                    <Text color="red.600">
                      Aksi takdirde hastalık analizi hesaplamaları yanlış olacaktır.
                    </Text>
                  </Box>
                </Alert>

                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  width="full"
                  isLoading={loading}
                  loadingText="Analiz Yapılıyor..."
                >
                  Analiz Et
                </Button>
              </VStack>
            </form>
          </CardBody>
        </Card>

        {error && (
          <Alert status="error" variant="left-accent" borderRadius="md">
            <AlertIcon />
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        {result && (
          <>
            <Button
              leftIcon={<ViewIcon />}
              colorScheme="teal"
              size="lg"
              onClick={handleViewReport}
              width="full"
              mb={4}
            >
              Raporu Görüntüle
            </Button>

            <Accordion defaultIndex={[0]} allowMultiple width="100%">
              <AnalysisSection 
                title="1. Kişinin anne adıyla yapılan esma analizi" 
                result={result.manager_esma_analysis} 
              />
              <AnalysisSection 
                title="2. Yalnızca kişinin adıyla yapılan esma analizi" 
                result={result.personal_manager_analysis} 
              />
              <AnalysisSection 
                title="3. Yönetici Ayet Analizi" 
                result={result.manager_verse_analysis} 
              />
              <AnalysisSection 
                title="4. Hastalık Analizi" 
                result={result.disease_analysis} 
              />
              <AnalysisSection 
                title="5. sihir büyü nazar vb. manevi sıkıntılara yatkınlık analizi" 
                result={result.magic_analysis} 
              />
              <AnalysisSection 
                title="6. Hastalığa Yatkınlık Analizi" 
                result={result.disease_prone_analysis} 
              />
              <AnalysisSection 
                title="7. Maddi Blokaj/Bolluk Bereket Rızık İçin Ayet Analizi" 
                result={result.financial_blessing_analysis} 
                customFormatter={formatFinancialBlessingAnalysis}
              />
            </Accordion>
          </>
        )}
      </VStack>
    </Container>
  );
};

export default ComprehensiveAnalysis; 