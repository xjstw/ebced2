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
  VStack,
  Divider,
  List,
  ListItem,
  useToast
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

const NameCoachingReport: React.FC = () => {
  const location = useLocation();
  const childNameData = JSON.parse(localStorage.getItem('childNameData') || '{}');
  const personalNameData = JSON.parse(localStorage.getItem('personalNameData') || '{}');

  console.log("Personal Name Data:", personalNameData); // Debug için

  // Cinsiyet çevirisi için yardımcı fonksiyon
  const translateGender = (gender: string) => {
    return gender === 'male' ? 'Erkek' : 'Kadın';
  };

  // Değişiklik kriteri çevirisi için yardımcı fonksiyon
  const translateCriteria = (criteria: string) => {
    switch (criteria) {
      case 'gender':
        return 'Cinsiyet Enerjisi';
      case 'element':
        return 'Element';
      case 'nurani':
        return 'Nurani/Zulmani';
      default:
        return criteria;
    }
  };

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

      {/* Header */}
      <Box className="no-print" p={4} bg="blue.500" color="white" mb={8}>
        <Container maxW="container.xl">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Heading size="md">İsim Koçluğu Analiz Raporu</Heading>
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
              İSİM KOÇLUĞU ANALİZİ
            </Heading>
            <Text fontSize="lg" color="gray.600">
              {currentDate}
            </Text>
          </Box>

          {/* Çocuk İsmi Seçimi Analiz Sonucu */}
          {childNameData.motherName && (
            <Box className="report-section" mb={8}>
              <Heading as="h2" size="lg" mb={6} textAlign="center">
                ÇOCUK İSMİ SEÇİMİ ANALİZ SONUCU
              </Heading>

              <Box mb={6}>
                <Table variant="simple">
                  <Tbody>
                    <Tr>
                      <Td width="200px" fontWeight="bold">Anne ismi:</Td>
                      <Td>{childNameData.motherName}</Td>
                    </Tr>
                  </Tbody>
                </Table>
              </Box>

              <Box mb={6}>
                <Heading as="h3" size="md" mb={4}>
                  Önerilen çocuk isimleri:
                </Heading>
                {childNameData.analysisResult?.suggestedNamesAnalysis && 
                 childNameData.analysisResult.suggestedNamesAnalysis.length > 0 ? (
                  <List spacing={2}>
                    {childNameData.analysisResult.suggestedNamesAnalysis.map((analysis: any, index: number) => (
                      <ListItem key={index}>
                        {index + 1}- {analysis.name}
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Text color="gray.500">Önerilen isim bulunamadı.</Text>
                )}
              </Box>

              <Text mb={4} fontStyle="italic">
                Bu isimler anne ismine kriter olarak en uygun olarak sıralanmıştır. Ve sadece bir tavsiye
                niteliği taşımaktadır.
              </Text>

              <Box p={6} bg="gray.50" borderRadius="md">
                <Heading as="h3" size="md" mb={4}>
                  Çocuk için isim analizi sonucu
                </Heading>
                <VStack spacing={4} align="stretch">
                  <Text>
                    İsim koçluğunda amaç; annenin ve çocuğun isimlerinin uyumlu olmasıdır. Uyumsuz anne
                    çocuk isminde ileride çatışmalar yaşanabilir.
                  </Text>
                  <Text>
                    İsminde ateş baskın biri muhtemelen aceleci, tez canlı ve sabırsız bir anne olacaktır.
                    Eğer böyle bir annenin çocuğunun isminde su elementi baskın olursa bu çocukta
                    muhtemelen sakin, dingin ve rahatı seven bir çocuk olacaktır.
                  </Text>
                  <Text>
                    Anne her sabah "hadi çocuğum acele et geç kalacaksın" diye kendi kendini yiyip bitirirken,
                    çocuk gayet sakin ve yavaş bir şekilde hazırlanmaya devam eder ve anne bir taraftan her gün
                    bu hengamede yıpranırken diğer taraftan da çocuğuyla çatışmaya başlar.
                  </Text>
                  <Text>
                    Ancak şunu da unutmamak lazım; sadece isimler uyumsuz diye insanlar çatışmazlar. Aslında
                    kişilerin mizacı, bakış açıları, davranış modelleri ve hayatlarında dengede olup olmadıkları da
                    önemlidir.
                  </Text>
                </VStack>
              </Box>
            </Box>
          )}

          <Divider my={8} />

          {/* Kişisel İsim Değişikliği Analiz Sonucu */}
          {personalNameData.currentName && (
            <Box className="report-section" mb={8}>
              <Heading as="h2" size="lg" mb={6} textAlign="center">
                KİŞİSEL İSİM DEĞİŞİKLİĞİ ANALİZ SONUCU
              </Heading>

              <Box mb={6}>
                <Table variant="simple">
                  <Tbody>
                    <Tr>
                      <Td width="200px" fontWeight="bold">Mevcut isim:</Td>
                      <Td>{personalNameData.currentName}</Td>
                    </Tr>
                    <Tr>
                      <Td fontWeight="bold">Cinsiyet:</Td>
                      <Td>{translateGender(personalNameData.gender)}</Td>
                    </Tr>
                    <Tr>
                      <Td fontWeight="bold">Değişiklik kriteri:</Td>
                      <Td>{translateCriteria(personalNameData.criteria)}</Td>
                    </Tr>
                  </Tbody>
                </Table>
              </Box>

              {/* İsim Önerileri */}
              <Box mb={6}>
                <Heading as="h3" size="md" mb={4}>
                  İsim önerileri:
                </Heading>
                {personalNameData.analysisResult?.suggestedNamesAnalysis && 
                 personalNameData.analysisResult.suggestedNamesAnalysis.length > 0 ? (
                  <List spacing={2}>
                    {personalNameData.analysisResult.suggestedNamesAnalysis.map((analysis: any, index: number) => (
                      <ListItem key={index}>
                        {index + 1}- {analysis.name}
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Text color="gray.500">Önerilen isim bulunamadı.</Text>
                )}
              </Box>

              {personalNameData.analysisResult?.recommendationReason && (
                <Text mb={4}>
                  {personalNameData.analysisResult.recommendationReason}
                </Text>
              )}

              {personalNameData.analysisResult?.warningMessage && (
                <Box p={4} bg="yellow.50" borderRadius="md" mb={6}>
                  <Text color="yellow.800">
                    {personalNameData.analysisResult.warningMessage}
                  </Text>
                </Box>
              )}

              <Text mb={6} fontWeight="bold">
                Yeni alacağınız ismin sizi dengeye getirip enerjisinin çalışması için bu ismin günlük hayatta
                kullanılması gerekir. Aksi halde enerji geçişi sağlanmaz.
              </Text>

              <Box p={6} bg="gray.50" borderRadius="md">
                <Heading as="h3" size="md" mb={4}>
                  Kişisel isim değişikliği analiz sonucu
                </Heading>
                <VStack spacing={4} align="stretch">
                  <Text>
                    Öncelikle merhaba. Muhtemelen hayatınızdaki bazı sıkıntılardan dolayı bir arayış
                    içindeydiniz ve yolunuz isim koçluğuna çıktı.
                  </Text>
                  <Text>
                    Hayatınızdaki bu blokajların bir nedeninin isminizde saklı olduğu gerçeğiyle yüzleştiniz.
                    Evet bu doğru. İsimlerin enerjisinin insanlar üzerinde çok büyük etkileri vardır.
                  </Text>
                  <Text>
                    Örneğin; Duran, Dursun ya da Sabit isminde olan birinin işlerinin durağan olması ve
                    ilerlememesi kadar normal bir şey yoktur.
                  </Text>
                  <Text>
                    Ya da Savaş, Ateş, Sarp gibi anlam bakımından zorlu isimleri olan kişilerin de hayatları boyu
                    zorluklarla sınanması gayet normaldir.
                  </Text>
                  <Text>
                    Ancak isimler insanlar üzerinde etkiler bıraksa da sadece isimleri nedeniyle hayatları
                    böylesine etkilenmez.
                  </Text>
                </VStack>
              </Box>
            </Box>
          )}

          {/* Önemli Not */}
          <Box className="report-section" mb={8} p={6} bg="orange.50" borderRadius="md">
            <Heading as="h3" size="md" mb={4}>
              ÖNEMLİ NOT
            </Heading>
            <VStack spacing={4} align="stretch">
              <Text>
                Enerjiler insanlar üzerine her alandan gelebilir. İsim enerjisi bunlardan sadece bir tanesidir.
                Bununla beraber aile ilişkilerinde baba ile annenin ve baba ile çocuğunda ilişkisi önem arz
                eder.
              </Text>
              <Text>
                Sadece uyumlu isim koymayla ailede her şey çözümlenmez.
              </Text>
              <Text>
                İsim koçluğunun yapılmasındaki maksat çocuğun isminin enerjisinin çocuğa hayat boyu iyi
                gelmesini sağlamaktır.
              </Text>
              <Text>
                Bilindiği üzere bazı çocuklara "ismi ağır gelmiş" diye kullanılan bir deyim vardır. Bunun da
                birkaç nedeni vardır. Bu nedenlerden bazıları ismin anne ismi ile uyumlu olmaması, ismin
                anlamı ya da içindeki zulmani harf sayısının çok olması gibi sebeplerdir.
              </Text>
            </VStack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default NameCoachingReport; 