import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  Table,
  Tbody,
  Tr,
  Td,
} from '@chakra-ui/react';
import { useLocation } from 'react-router-dom';
import { FaPrint } from 'react-icons/fa';

// Print styles
const printStyles = `
  @media print {
    .no-print {
      display: none !important;
    }
    .print-content {
      padding: 0 !important;
    }
    @page {
      size: A4;
      margin: 20mm;
    }
    body {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
`;

const CoupleAnalysisReport: React.FC = () => {
  const location = useLocation();
  const result = location.state?.result;

  if (!result) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text>Rapor bulunamadı.</Text>
      </Container>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  // Tarih formatını ayarla
  const currentDate = new Date().toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <Box>
      {/* Print styles */}
      <style>{printStyles}</style>

      {/* Header (yazdırmada gizlenecek) */}
      <Box className="no-print" p={4} bg="blue.500" color="white" mb={8}>
        <Container maxW="container.xl">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Heading size="md">Çift Analiz Raporu</Heading>
            <Button
              leftIcon={<FaPrint />}
              onClick={handlePrint}
              colorScheme="whiteAlpha"
            >
              Yazdır
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Rapor içeriği */}
      <Container maxW="container.xl" className="print-content">
        <Box className="report-container" bg="white" p={8} borderRadius="lg" boxShadow="md">
          <Box className="report-header" textAlign="center" mb={8}>
            <Heading as="h1" size="xl" mb={4}>
              EVLENECEK ÇİFTLER VEYA EŞLER ARASINDA UYUM ANALİZİ SONUCU
            </Heading>
            <Text fontSize="lg" color="gray.600">
              {currentDate}
            </Text>
          </Box>

          {/* Çift Bilgileri */}
          <Box className="report-section" mb={8}>
            <Table variant="simple">
              <Tbody>
                <Tr>
                  <Td width="300px" fontWeight="bold">1. KİŞİNİN ADI:</Td>
                  <Td>{result.female?.name || result.female_name || ''}</Td>
                </Tr>
                <Tr>
                  <Td fontWeight="bold">2. KİŞİNİN ADI:</Td>
                  <Td>{result.male?.name || result.male_name || ''}</Td>
                </Tr>
              </Tbody>
            </Table>
          </Box>

          {/* Analiz Sonucu */}
          <Box className="report-section" mb={8} p={6} bg="orange.50" borderRadius="md" borderWidth="1px" borderColor="orange.200">
            <Heading as="h2" size="lg" mb={6} color="orange.700">
              ANALİZ SONUCU
            </Heading>
            <Text mb={4} fontWeight="bold">
              Birbirlerini yıpratabilirler o nedenle çok fazla önerilmez!
            </Text>
            <Text mb={4}>
              Sonuç olumsuz gibi görünebilir ancak bu sonuçlar yalnızca ihtimalleri verir.
              O nedenle sonuçlara bakarak endişeye kapılmamalısınız.
            </Text>
            <Text mb={4}>
              Sadece dikkatli olunması gerektiğini gösterir.
            </Text>
            <Text mb={4}>
              Bununla beraber eğer çiftler ilişkilerinde öz verili ve dengeli olurlarsa Allah'ın izniyle her şeyin üstesinden gelebilirler.
            </Text>
            <Text color="red.600" fontWeight="bold">
              Kimseye olumsuz yorum yaparak ilişkilerine müdahale de bulunmayın.
              Aksi takdirde kişilerin kaderine (karmasına) müdahale etmiş olursunuz.
            </Text>
          </Box>

          {/* Önemli Not */}
          <Box className="report-section" mb={8} p={6} bg="red.50" borderRadius="md" border="2px" borderColor="red.500">
            <Heading as="h2" size="lg" mb={4} color="red.700">
              ÖNEMLİ!
            </Heading>
            <Text mb={4}>
              İster esma çalışması olsun ister ayet bu yaptığımız çalışmalara başlamadan önce;
              <Text as="span" fontWeight="bold"> "Niyet ettim Ya Rabbi yalnız Senin rızan için esma / ayet okumaya" </Text>
              diyerek niyet ederiz.
            </Text>
            <Text mb={4}>
              Ve amacımız hastalık şifası, ev alma, araba alma, evlat sahibi olma, işlerin açılması veya mal,
              mülk vs sahibi olmak değil, bu esma ve ayetlerle hayatımızın değişip dönüşmesi gereken
              yanlarını bulmak ve yaşadığımız döngülerden çıkarak, başımıza gelen olaylarda görmemiz
              gerekenleri görmeye çalışmak ve Allah'a salih bir kulluk yapmak olmalıdır.
            </Text>
            <Text>
              Bizler bunu hedeflediğimiz sürece zaten Rabbimiz bize lütuf ve ihsanından verecek ve mal,
              mülk, evlat, iş, eş, şifa ne istiyorsak bize nasip edecektir inşallah. Yeter ki bizler ihlasla ibadet
              edip zikir etmekten vazgeçemeyelim.
            </Text>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default CoupleAnalysisReport; 