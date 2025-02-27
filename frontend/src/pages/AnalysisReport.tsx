import React, { useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Divider,
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

const AnalysisReport: React.FC = () => {
  const location = useLocation();
  const result = location.state?.result;

  // Detailed debug logs
  useEffect(() => {
    if (result) {
      console.log("=== DETAILED DEBUG INFORMATION ===");
      console.log("Tüm result objesi:", JSON.stringify(result, null, 2));
      console.log("Result keys:", Object.keys(result));
      console.log("Manager Verse Analysis Detailed:", JSON.stringify(result.manager_verse_analysis, null, 2));
      console.log("Manager Verse Analysis Data:", result.manager_verse_analysis?.data);
      console.log("=== DISEASE ANALYSIS DEBUG ===");
      console.log("Disease Analysis Full:", JSON.stringify(result.disease_analysis, null, 2));
      console.log("Disease Analysis Success:", result.disease_analysis?.success);
      console.log("Disease Analysis Data:", result.disease_analysis?.data);
      console.log("Disease Analysis Selected Esma:", result.disease_analysis?.data?.selected_esma);
      console.log("Disease Analysis Verse:", result.disease_analysis?.data?.verse);
      console.log("=== METHOD VERSES DEBUG ===");
      console.log("Method 1 Verses:", result.disease_analysis?.data?.method1_verses);
      console.log("Method 2 Verses:", result.disease_analysis?.data?.method2_verses);
      console.log("=== MAGIC ANALYSIS DEBUG ===");
      console.log("Magic Analysis Full:", JSON.stringify(result.magic_analysis, null, 2));
      console.log("Magic Analysis Success:", result.magic_analysis?.success);
      console.log("Magic Analysis Data:", result.magic_analysis?.data);
      console.log("Magic Analysis General Analysis:", result.magic_analysis?.data?.general_analysis);
      console.log("Magic Analysis Recommended Esma:", result.magic_analysis?.data?.recommended_esma);
      console.log("Magic Analysis Recommended Verse:", result.magic_analysis?.data?.recommended_verse);
      console.log("Magic Analysis Warning Message:", result.magic_analysis?.data?.warning_message);
      console.log("=== DISEASE PRONE ANALYSIS DEBUG ===");
      console.log("Disease Prone Analysis Full:", JSON.stringify(result.disease_prone_analysis, null, 2));
      console.log("Disease Prone Analysis Success:", result.disease_prone_analysis?.success);
      console.log("Disease Prone Analysis Data:", result.disease_prone_analysis?.data);
      console.log("Disease Prone Analysis Data Structure:", JSON.stringify(result.disease_prone_analysis?.data, null, 2));
      console.log("Disease Prone Analysis Keys:", result.disease_prone_analysis?.data ? Object.keys(result.disease_prone_analysis.data) : "No data");
      console.log("=== END DEBUG ===");
    }
  }, [result]);

  // Debug için financial_blessing_analysis verilerini logla
  console.log("Financial Blessing Analysis - Full Result:", result);
  console.log("Financial Blessing Analysis Data:", result?.financial_blessing_analysis);
  console.log("Recommended Verses:", result?.financial_blessing_analysis?.data?.recommended_verses);

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
            <Heading size="md">Analiz Raporu</Heading>
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
              EBCED YÖNTEMİ İLE KİŞİYE ÖZEL İSİM ANALİZ SONUCU
            </Heading>
            <Text fontSize="lg" color="gray.600">
              {currentDate}
            </Text>
          </Box>
          {/* Kişi Bilgileri */}
          <Box className="report-section" mb={8}>
            <Table variant="simple">
              <Tbody>
              <Tr>
                  <Td width="300px" fontWeight="bold">KİŞİNİN ANNE ADI:</Td>
                  <Td>{result.mother_name || ''}</Td>
                </Tr>
                <Tr>
                  <Td width="300px" fontWeight="bold">KİŞİNİN ADI:</Td>
                  <Td>{result.child_name || ''}</Td>
                </Tr>
                <Tr>
                  <Td fontWeight="bold">TOPLAM EBCED DEĞERİ:</Td>
                  <Td>
                    {result.personal_manager_analysis?.data?.total_ebced || result.magic_analysis?.data?.total_ebced || result.disease_prone_analysis?.data?.total_ebced || 'Hesaplanamadı'}
                  </Td>
                </Tr>
                <Tr>
                  <Td fontWeight="bold">TOPLAM ESMA DEĞERİ VE ESMASI:</Td>
                  <Td>
                    {(() => {
                      console.log("Total Esma Debug:", {
                        selected_esma: result.manager_esma_analysis?.data?.selected_esma,
                        selected_esma_ebced: result.manager_esma_analysis?.data?.selected_esma_ebced,
                        manager_esma_analysis: result.manager_esma_analysis,
                        full_result: result
                      });
                      if (result.manager_esma_analysis?.data?.selected_esma && result.manager_esma_analysis?.data?.selected_esma_ebced) {
                        return `${result.manager_esma_analysis.data.selected_esma} (${result.manager_esma_analysis.data.selected_esma_ebced})`;
                      }
                      return 'Hesaplanamadı';
                    })()}
                  </Td>
                </Tr>
              </Tbody>
            </Table>
          </Box>


          {/* Yönetici Esma Ne Demek? */}
          <Box className="report-section" mb={8} p={6} bg="gray.50" borderRadius="md">
            <Heading as="h2" size="lg" mb={4}>
              YÖNETİCİ ESMA NE DEMEK?
            </Heading>
            <Text mb={4}>
              Yönetici esma demek; kişilerin tekamülünde var olan sınavlar, başına gelen olaylar, durumlar ya da değiştirip dönüştürülmesi gereken yanlarını dengelemek ve şifalandırmak için çekebileceği esmadır.
            </Text>
            <Text mb={4}>
              Bu esmayı çekmek kişilerin eksik olan yanlarını tamamlar fazla olan yanlarını dengeler.
            </Text>
            <Text mb={4}>
              Esmalar tekâmül yolculuğunda Hak'la bir ve bütün olabilmenin yollarından sadece birisidir.
            </Text>
            <Text fontWeight="bold" mb={4}>
              Not: İsminize bakan yönüyle size çıkan esmanızı en az 21 gün okuyun, bununla beraber aslında durumunuz şifalanıncaya kadar okumanız önerilir.
            </Text>
            <Text mb={4}>
              Esmaları okumaya en az 100 adet ile başlayın ve daha sonra zamanla esmanızı ebced değerine göre okuyabilirsiniz.
            </Text>
            <Text fontStyle="italic">
              Örn: 1060 esma ebcedi olan Ya Gani ismini ilk başlarda 100 ile başlayıp zamanla sayıyı 1060'a kadar çıkarabilirsiniz.
            </Text>
          </Box>

          {/* Yönetici Esma Faydaları */}
          <Box className="report-section" mb={8} p={6} bg="gray.50" borderRadius="md">
            <Heading as="h2" size="lg" mb={4}>
              YÖNETİCİ ESMAMIZI ÇEKMENİN FAYDALARI
            </Heading>
            <Text mb={4}>
              Öncelikle burada esmaları sadece sayısal değer olarak çekmek değil tecelli ettirmek üzere çalışma yapılmasından bahsedilmektedir.
            </Text>
            <Text mb={4}>
              Eğer yönetici esmalarımızı bilir ve bunun bizim hayatımıza tecelli etmesine çalışırsak yönetici esmamızı çekmemizin faydaları şunlar olacaktır:
            </Text>
            <Text mb={2}>• Yönetici esmamız sayesinde hayatımız düzene girer.</Text>
            <Text mb={2}>• Allah'ın bizim üzerimizde murad ettiği kabiliyet ve özelliklerimiz açığa çıkar biiznillah.</Text>
            <Text mb={2}>• Tekamülümüzde bilinç seviyemizi yükseltir.</Text>
            <Text mb={4}>• Esmaları zikretmek sadece bir ritüel değil, aynı zamanda zihinsel bir yolculuktur.</Text>
            <Text mb={4}>
              Manalarına yoğunlaşmak ve derinleşmek, esmaların bizlere sunduğu ilahi sırları keşfetmenin anahtarıdır.
            </Text>
            <Text mb={4}>
              Manalarına yoğunlaşarak ve derinleşerek esmalarını hakiki manada hayatına geçiren ve uygulayan kişilerin bir müddet sonra dilleri esmanın zikrini bıraksa da tüm hücreleri o esmayı zikretmeye devam eder biiznillah.
            </Text>
            <Text mb={4}>
              Ve o esmanın tecellilerini yaşamaya başlar.
            </Text>
            <Text fontStyle="italic">
              Örneklendirecek olursak: Ya Vedud esmasını tecelli ettirmek için; Tüm kâinata ve yaratılmışlara karşı koşulsuz sevgi beslemek ve herkese ve her şeye "yaratılmışı severiz Yaratandan ötürü" bilinciyle yaklaşmak ve bunu hayatında düstur edinip kimseyi kırmadan ve kimseye kırılmadan yaşayarak, her yaratılmışa hakkını helal ederek hayatını idame ettirmektir mesele.
            </Text>
            <Text mt={4}>
              Bunu başarabilen bir kul, Allah'ın izniyle bir müddet sonra ilahi aşka ve insanların gerçek sevgisine mazhar olur.
            </Text>
          </Box>

          {/* Yönetici Sure-Ayet Analiz Sonucu */}
          <Box className="report-section" mb={8}>
            <Heading as="h2" size="lg" mb={6} textAlign="center">
              YÖNETİCİ SURE-AYET ANALİZ SONUCU
            </Heading>

            {/* 1. Yönetici Sure ve Ayet */}
            <Box mb={8} p={6} borderWidth="1px" borderRadius="lg">
              <Heading as="h3" size="md" mb={4}>
                KİŞİNİN 1. YÖNETİCİ SURE VE AYETİ
              </Heading>
              {result.manager_verse_analysis?.data?.method1_verses?.[0] ? (
                <>
                  <Text mb={4}>
                    <strong>Sure/Ayet:</strong> {result.manager_verse_analysis.data.method1_verses[0].surah_name}, {result.manager_verse_analysis.data.method1_verses[0].verse_number}. Ayet
                  </Text>
                  <Text mb={4} fontFamily="'Noto Naskh Arabic', serif" fontSize="xl" textAlign="right">
                    {result.manager_verse_analysis.data.method1_verses[0].arabic_text}
                  </Text>
                  <Text>
                    <strong>Anlam:</strong> {result.manager_verse_analysis.data.method1_verses[0].turkish_meaning}
                  </Text>
                </>
              ) : (
                <Text>Yönetici ayet bilgisi bulunamadı.</Text>
              )}
            </Box>

            {/* 2. Yönetici Sure ve Ayet */}
            <Box mb={8} p={6} borderWidth="1px" borderRadius="lg">
              <Heading as="h3" size="md" mb={4}>
                KİŞİNİN 2. YÖNETİCİ SURE VE AYETİ
              </Heading>
              {result.manager_verse_analysis?.data?.method2_verses?.[0] ? (
                <>
                  <Text mb={4}>
                    <strong>Sure/Ayet:</strong> {result.manager_verse_analysis.data.method2_verses[0].surah_name}, {result.manager_verse_analysis.data.method2_verses[0].verse_number}. Ayet
                  </Text>
                  <Text mb={4} fontFamily="'Noto Naskh Arabic', serif" fontSize="xl" textAlign="right">
                    {result.manager_verse_analysis.data.method2_verses[0].arabic_text}
                  </Text>
                  <Text>
                    <strong>Anlam:</strong> {result.manager_verse_analysis.data.method2_verses[0].turkish_meaning}
                  </Text>
                </>
              ) : (
                <Text>Yönetici ayet bilgisi bulunamadı.</Text>
              )}
            </Box>
          </Box>

          {/* Yönetici Sure-Ayet Bilgilendirme */}
          <Box className="report-section" mb={8} p={6} bg="gray.50" borderRadius="md">
            <Heading as="h2" size="lg" mb={4}>
              YÖNETİCİ SURE-AYET NE DEMEK?
            </Heading>
            <Text mb={4}>
              Yönetici sure ve ayetlerde esmalar gibidir.
            </Text>
            <Text mb={4}>
              Kişiler tekamülünde var olan sınavlar, başına gelen olaylar, durumlar ya da değiştirip dönüştürülmesi gereken yanlarını dengelemek ve şifalandırmak için okuyabilir ve kendi öz farkındalığına varabilir.
            </Text>
            <Text mb={4}>
              Surelerin ve ayetlerin anlattığı olay ve değindiği konularla ilgili, kişilerin kendinde veya hayatında farkındalığa varması ve bu konular üzerinde çalışma yapması kişilerin ya da hayatlarının akışının düzene girmesi ve dengelenmesi için önemlidir.
            </Text>
            <Text mb={4}>
              Hayatında belli konularda blokaj olduğunu, hep aynı döngüleri yaşadığını düşünen kişiler eğer kendilerine bakan yönüyle ayetlerini ele alırlarsa bu blokajı veya döngüyü neden yaşadıklarını anlayabilirler.
            </Text>
            <Text mb={4} fontStyle="italic">
              Örneğin; kendisine zekatla ilgili ayetlerin çıkıyor olması kişinin maddi blokajlarının neden kaynaklandığını gösterir. (Ancak bu blokajın sebeplerinden sadece 1 tanesi olabilir burada dikkatli olunmalı)
            </Text>
            <Text fontWeight="bold" mb={4}>
              Not: İsminize bakan yönüyle size çıkan ayetleri en az 21 gün okuyun, bununla beraber aslında durumunuz şifalanıncaya kadar okumanız önerilir.
            </Text>
            <Text mb={4}>
              Ayetleri okumaya en az 7-11-22 veya 33 adet gibi düşük adetler ile başlayın ve daha sonra zamanla istediğiniz sayıda yükselterek okuyabilirsiniz.
            </Text>
            <Text color="red.500" fontWeight="bold">
              (Kadınlar özel hallerinde ayet okuması yapamaz.)
            </Text>
          </Box>

          {/* Kişiye Özel Hastalık Analiz Sonucu */}
          <Box className="report-section" mb={8}>
            <Heading as="h2" size="lg" mb={6} textAlign="center">
              KİŞİYE ÖZEL HASTALIK ANALİZ SONUCU
            </Heading>

            {/* Önerilen Esma */}
            <Box mb={8} p={6} borderWidth="1px" borderRadius="lg">
              <Heading as="h3" size="md" mb={4}>
                ÖNERİLEN ESMA
              </Heading>
              {result.disease_analysis?.data?.recommended_esmas?.[0] ? (
                <>
                  <Text mb={2} fontSize="xl">{result.disease_analysis.data.recommended_esmas[0].name}</Text>
                  <Text mb={4} fontFamily="'Noto Naskh Arabic', serif" fontSize="xl" textAlign="right">
                    {result.disease_analysis.data.recommended_esmas[0].arabic}
                  </Text>
                  <Text mb={2}><strong>Ebced değeri:</strong> {result.disease_analysis.data.recommended_esmas[0].ebced}</Text>
                  <Text><strong>Anlamı:</strong> {result.disease_analysis.data.recommended_esmas[0].meaning}</Text>
                </>
              ) : (
                <Text>Önerilen esma bilgisi bulunamadı.</Text>
              )}
            </Box>

            {/* Önerilen Ayetler */}
            <Box mb={8} p={6} borderWidth="1px" borderRadius="lg">
              <Heading as="h3" size="md" mb={4}>
                ÖNERİLEN AYETLER
              </Heading>

              {/* 1. Yöntem Ayetleri */}
              <Box mb={6}>
                {(() => {
                  // Split recommended verses into two methods
                  const recommendedVerses = result.disease_analysis?.data?.recommended_verses || [];
                  const halfLength = Math.ceil(recommendedVerses.length / 2);
                  const method1Verses = recommendedVerses.slice(0, halfLength);
                  const method2Verses = recommendedVerses.slice(halfLength);

                  console.log("=== VERSES DEBUG ===");
                  console.log("Recommended Verses:", recommendedVerses);
                  console.log("Method 1 Verses:", method1Verses);
                  console.log("Method 2 Verses:", method2Verses);
                  
                  return (
                    <>
                      <Heading as="h4" size="sm" mb={4} color="blue.600">
                        1. YÖNTEMLE HESAPLANAN AYETLER
                      </Heading>
                      {method1Verses?.length > 0 ? (
                        <>
                          {method1Verses.map((verse: any, index: number) => (
                            <Box key={index} mb={index < method1Verses.length - 1 ? 6 : 0}>
                              <Text mb={4}>
                                <strong>Sure adı:</strong> {verse.surah_name}{' '}
                                <strong>Ayet no:</strong> {verse.verse_number}
                              </Text>
                              <Text mb={4} fontFamily="'Noto Naskh Arabic', serif" fontSize="xl" textAlign="right">
                                {verse.arabic_text}
                              </Text>
                              <Text mb={4}>
                                <strong>Anlam:</strong> {verse.turkish_meaning}
                              </Text>
                              {index < method1Verses.length - 1 && (
                                <Divider my={4} borderColor="gray.300" />
                              )}
                            </Box>
                          ))}
                        </>
                      ) : (
                        <Text>1. yöntem için ayet bilgisi bulunamadı.</Text>
                      )}
                    </>
                  );
                })()}
              </Box>

              {/* 2. Yöntem Ayetleri */}
              <Box>
                {(() => {
                  const recommendedVerses = result.disease_analysis?.data?.recommended_verses || [];
                  const halfLength = Math.ceil(recommendedVerses.length / 2);
                  const method2Verses = recommendedVerses.slice(halfLength);

                  return (
                    <>
                      <Heading as="h4" size="sm" mb={4} color="blue.600">
                        2. YÖNTEMLE HESAPLANAN AYETLER
                      </Heading>
                      {method2Verses?.length > 0 ? (
                        <>
                          {method2Verses.map((verse: any, index: number) => (
                            <Box key={index} mb={index < method2Verses.length - 1 ? 6 : 0}>
                              <Text mb={4}>
                                <strong>Sure adı:</strong> {verse.surah_name}{' '}
                                <strong>Ayet no:</strong> {verse.verse_number}
                              </Text>
                              <Text mb={4} fontFamily="'Noto Naskh Arabic', serif" fontSize="xl" textAlign="right">
                                {verse.arabic_text}
                              </Text>
                              <Text mb={4}>
                                <strong>Anlam:</strong> {verse.turkish_meaning}
                              </Text>
                              {index < method2Verses.length - 1 && (
                                <Divider my={4} borderColor="gray.300" />
                              )}
                            </Box>
                          ))}
                        </>
                      ) : (
                        <Text>2. yöntem için ayet bilgisi bulunamadı.</Text>
                      )}
                    </>
                  );
                })()}
              </Box>
            </Box>

            {/* Uyarı Mesajı */}
            <Box p={6} bg="gray.50" borderRadius="md">
              <Heading as="h3" size="md" mb={4}>
                UYARI MESAJI
              </Heading>
              <Text mb={4}>
                {
                  "Hastalığınızın daha hızlı şifalanabilmesi için 2 farklı yöntemle hesaplama yapılmıştır. Sadece tek bir yöntemle hesaplanmış ayetler, günlük olarak istediğiniz sayıda okunabilir ancak her 2 yöntemle bulunan ayetlerin hepsini günlük olarak okumak durumunuzu daha hızlı şifalandıracaktır biiznillah."}
              </Text>
              <Text mb={4}>
                {result.disease_analysis?.data?.warning_message || 
                  "Şifalanmak için esmaları ve ayetleri en az 21 gün, devamlı okuyabileceğiniz bir sayıdan başlayarak okuyabilirsiniz."}
              </Text>
              
              <Heading as="h4" size="md" mt={6} mb={4}>
                NOT:
              </Heading>
              <Text mb={4}>
                Ayetleri tek başına okumak yeterli değildir. Ayet okuma çalışmalarında "birkaç tekrarla ayet okuması yapalım hayatımız düzelsin" gibi yaklaşım doğru değildir. Burada yapılan çalışmanın ana unsurunu oluşturan şey; sizin hayatınıza bakan yönüyle bulmuş olduğunuz ayetin size ne anlatmak istediğine odaklanmaktır.
              </Text>
              <Text mb={4}>
                Örneğin; ayetiniz faizle ilgili çıkmış olsun. Ve siz de hayat boyu maddi sıkıntılar ve blokajlar yaşayan birisi olun. 
                Faizle ilgili bir ayetin çıkmasının benim maddi blokajımla ne ilgisi var? diye düşünebilirsiniz. 
                Ancak Allah'u Teala ayetlerinde açık açık faizin öneminden ve yenilen faizlerin rızkın bereketini kaldıracağından bahsetmektedir.
              </Text>
              <Text mb={4}>
                Ya da diyelim ki mide yanması hastalığı için analiz yaptınız ve Nisa suresi 10. Ayet çıktı. Burada size aslında hastalığınızın kaynağı gösteriliyor olabilir. Çünkü bu ayetin meali şudur; "Yetimlerin mallarını haksız yere yiyenler, ancak karınlarında ateş yemiş olurlar."
              </Text>
              <Text>
                Dolayısıyla burada yapacağımız şey hemen kendimizin veya soyumuzun hak yemiş olma ihtimaline karşı tevbe etmek ve kefaretlerimizi yerine getirmektir. Bununla beraber yapılan ayet okuma çalışmaları da biiznillah sizi şifaya kavuşturacaktır.
              </Text>
            </Box>
          </Box>

          {/* Maddi Blokaj/Bolluk Bereket Rızık İçin Ayet Analizi */}
          <Box className="report-section" mb={8} p={6} bg="gray.50" borderRadius="md">
            <Heading as="h2" size="lg" mb={6} textAlign="center">
              MADDİ BLOKAJ/BOLLUK BEREKET RIZIK İÇİN AYET ANALİZİ
            </Heading>

            {/* Önerilen Ayetler */}
            <Box mb={6}>
              <Heading as="h3" size="md" mb={4}>
                ÖNERİLEN AYETLER
              </Heading>
              
              {/* 1. Önerilen Ayet */}
              <Box mb={4} p={4} borderWidth="1px" borderRadius="md" bg="white">
                <Text mb={2}>
                  <strong>1. ÖNERİLEN SURE ADI:</strong> {result.financial_blessing_analysis?.data?.data?.first_verse?.sure_name || '...'} 
                  <strong style={{ marginLeft: '1rem' }}>AYET NO:</strong> {result.financial_blessing_analysis?.data?.data?.first_verse?.ayet || '...'}
                </Text>
                <Text mb={2} fontFamily="'Noto Naskh Arabic', serif" fontSize="xl" textAlign="right">
                  {result.financial_blessing_analysis?.data?.data?.first_verse?.arabic_text || '...'}
                </Text>
                <Text>
                  {result.financial_blessing_analysis?.data?.data?.first_verse?.turkish_meaning || '...'}
                </Text>
              </Box>

              {/* 2. Önerilen Ayet */}
              <Box mb={4} p={4} borderWidth="1px" borderRadius="md" bg="white">
                <Text mb={2}>
                  <strong>2. ÖNERİLEN SURE ADI:</strong> {result.financial_blessing_analysis?.data?.data?.second_verse?.sure_name || '...'} 
                  <strong style={{ marginLeft: '1rem' }}>AYET NO:</strong> {result.financial_blessing_analysis?.data?.data?.second_verse?.ayet || '...'}
                </Text>
                <Text mb={2} fontFamily="'Noto Naskh Arabic', serif" fontSize="xl" textAlign="right">
                  {result.financial_blessing_analysis?.data?.data?.second_verse?.arabic_text || '...'}
                </Text>
                <Text>
                  {result.financial_blessing_analysis?.data?.data?.second_verse?.turkish_meaning || '...'}
                </Text>
              </Box>
            </Box>

            {/* Maddi Blokaj Sebepleri */}
            <Box>
              <Heading as="h3" size="md" mb={4}>
                MADDİ BLOKAJ SEBEPLERİ
              </Heading>
              <Text mb={4}>
                Hayatımızda var olan maddi blokajların birçok nedeni vardır. Bu nedenlerden bazıları; kıtlık bilinci, cimrilik, para ile ilgili "Para kazanmak zordur, para bizi bulmaz, para geldiği gibi gidiyor, paranın bereketi yok, insanlar bana param için gelir, para kaybetme korkum var, yeteri kadar para kazanamıyorum, çok mal haramsız olmaz, dürüstlükle zengin olunmaz, para mutluluk getirmez, para elinin kiri, paramın kıymetini bilmiyorum…" gibi olumsuz inançlar veya yoksul bir ailede dünyaya gelmiş olmak, küçükken ebeveynlerimizden duymuş olduğumuz para ile ilgili olumsuz sözler, miras konusunda yapılan haksızlıklar, iflaslar, haksız kazançlar, kumar, dolandırıcılık, servet kayıpları, reddedişler, aileden birinin finansal açıdan yaşadığı / yaşattığı sıkıntılar, verilmemiş zekatlar ve en önemlisi faiz ve haram yolla elde edilmiş kazançlar maddi açıdan kazanç ve kayıplarımızı etkiler.
              </Text>
              <Text mb={4}>
                Dolayısıyla birçok etkene bağlı olarak gelişen maddi blokajlarımızı kaldırabilmenin en etkili yolu blokaja neden olan sebepleri ortadan kaldırmaktır.
              </Text>
              <Text mb={4}>
                Bu nedenle maddi blokaj için ayet çalışması yapmadan önce size önerimiz şudur:
              </Text>
              <Text mb={4}>
                Öncelikle bu blokajın nedenleri üzerinde bir tefekkür çalışması yapmanız ve bu nedenleri tek tek not almanızdır.
                Daha sonra bu nedenler hakkında çalışma yapmaya başlayabilirsiniz.
              </Text>
              <Text mb={4}>
                Bununla beraber hem psikolojik açıdan değişim dönüşüm çalışması yaparken hem de manevi açıdan var olan sebepleri ortan kaldırmaya yönelik çalışmalarınız ve diğer taraftan da ayetlerle çalışma yapmanız sizi hedefinize daha hızlı ulaştıracaktır biiznillah.
              </Text>
              <Text mb={4}>
                Örnek verecek olursak; yukarıda saydığımız nedenlerin tamamı bizde varsayalım.
                Öncelikle; eğer verilmemiş zekât, faiz ya da hak yeme durumları varsa bu konuda çalışma yapmalı diğer taraftan para ile ilgili olumsuz bakış açılarımızı, bilinçaltı kodlarımızı değiştirip dönüştürmeye gayret etmeli bununla beraber de ayet okuma çalışmalarımızı yapmalıyız.
              </Text>
              <Text mb={4}>
                Bu durumu tıpkı bir astım hastasının durumuna benzetecek olursak, astım hastası bir kişiye doktor tedavisine ek olarak sigarayı bırakmasını söylerse ve kişi ilaç kullanmasına rağmen eğer sigarayı bırakmazsa tekrar hastalanacaktır. Ayetlerle çalışmada tıpkı böyledir. Sadece ayet okumak ilaç kullanmaya benzer. Evet belki anlık olarak ilaç sizi iyileştirir fakat bu durumun kalıcı olması için hastalığı yani blokajı meydana getiren nedenlerin ortadan kaldırılması gerekmektedir ki sonuç kalıcı olabilsin.
              </Text>
              <Text fontWeight="bold">
                Not: İsminize bakan yönüyle size çıkan ayetleri en az 21 gün okuyun, bununla beraber aslında durumunuz düzelinceye, blokajınız kalkıncaya kadar okumanız önerilir. Ayetleri okumaya en az 7-11-22 veya 33 adet gibi düşük adetler ile başlayın ve daha sonra zamanla istediğiniz sayıda yükselterek okuyabilirsiniz.(Kadınlar özel hallerinde ayet okuması yapamaz.)
              </Text>
            </Box>
          </Box>

          {/* Sihir Büyü Nazar vb. Manevi Sıkıntılara Yatkınlık Analizi */}
          <Box className="report-section" mb={8}>
            <Heading as="h2" size="lg" mb={6} textAlign="center">
              SİHİR BÜYÜ NAZAR VB. MANEVİ SIKINTILARA YATKINLIK ANALİZİ SONUCU
            </Heading>

            <Box p={6} borderWidth="1px" borderRadius="lg">
              {result.magic_analysis?.data ? (
                <>
                                  {/* Ebced Değerleri */}
                                  <Box mb={6}>
                    <Heading as="h3" size="md" mb={4}>
                      EBCED DEĞERLERİ
                    </Heading>
                    <Text mb={2}><strong>Anne İsmi:</strong> {result.magic_analysis.data.mother_name} ({result.magic_analysis.data.mother_ebced})</Text>
                    <Text mb={2}><strong>Çocuk İsmi:</strong> {result.magic_analysis.data.child_name} ({result.magic_analysis.data.child_ebced})</Text>
                    <Text><strong>Toplam Ebced:</strong> {result.magic_analysis.data.total_ebced}</Text>
                  </Box>
                  {/* Tespit Edilen Sorun */}
                  <Box mb={6}>
                    <Heading as="h3" size="md" mb={4}>
                      TESPİT EDİLEN SORUN
                    </Heading>
                    <Text mb={2} fontWeight="bold">Sorun Tipi: {result.magic_analysis.data.issue_type}</Text>
                    <Text whiteSpace="pre-wrap">{result.magic_analysis.data.issue_description}</Text>
                  </Box>



                  {/* Banyo ve Tuvalet Tavsiyeleri */}
                  <Box mb={6}>
                    <Heading as="h3" size="md" mb={4}>
                      BANYO VE TUVALETTE DİKKAT EDİLECEK HUSUSLAR
                    </Heading>
                    <Text mb={2}>• Banyoda çıplak ve uzun süre kalmamak.</Text>
                    <Text mb={2}>• Yıkanılan yere bevl etmemek.</Text>
                    <Text mb={2}>• Gusülde çok dikkatli davranmak.</Text>
                    <Text mb={2}>• Tuvalette konuşmamak.</Text>
                    <Text mb={2}>• Tuvalet ve banyoda kısa süreli kalmak.</Text>
                    <Text mb={6}>• Taharete ihtimam göstermektir.</Text>
                  </Box>

                  {/* Mutfak Tavsiyeleri */}
                  <Box>
                    <Heading as="h3" size="md" mb={4}>
                      MUTFAKTA DİKKAT EDİLMESİ GEREKEN HUSUSLAR
                    </Heading>
                    <Text mb={2}>• Lavaboya kaynar su dökmemek.</Text>
                    <Text mb={2}>• Su dökerken soğuk suyu da açmak.</Text>
                    <Text mb={2}>• Su dökerken destur demek.</Text>
                    <Text mb={2}>• Lavabo içerisine yemek artıkları dökmemek.</Text>
                    <Text mb={2}>• Yemek yenilen alanı yemekten sonra mutlaka süpürmek.</Text>
                    <Text mb={2}>• Tavuk kemiklerini diğer çöplerle karıştırmamak.</Text>
                    <Text>• Mutfakta çöp ve bulaşık bırakmamak.</Text>
                  </Box>
                </>
              ) : (
                <Text>Manevi sıkıntılara yatkınlık analizi sonucu bulunamadı.</Text>
              )}
            </Box>
          </Box>

          {/* Hastalığa Yatkınlık Analizi */}
          <Box className="report-section" mb={8}>
            <Heading as="h2" size="lg" mb={6} textAlign="center">
              HASTALIĞA YATKINLIK ANALİZİ SONUCU
            </Heading>

            <Box p={6} borderWidth="1px" borderRadius="lg">
              {result.disease_prone_analysis?.success && result.disease_prone_analysis?.data ? (
                <>
                  {/* Kişi Bilgileri ve Ebced Değerleri */}
                  <Box mb={6}>
                    <Heading as="h3" size="md" mb={4}>
                      KİŞİ BİLGİLERİ VE EBCED DEĞERLERİ
                    </Heading>
                    <Text mb={2}><strong>Anne İsmi:</strong> {typeof result.disease_prone_analysis.data.mother === 'object' ? result.disease_prone_analysis.data.mother.name : result.disease_prone_analysis.data.mother}</Text>
                    <Text mb={2}><strong>Çocuk İsmi:</strong> {typeof result.disease_prone_analysis.data.child === 'object' ? result.disease_prone_analysis.data.child.name : result.disease_prone_analysis.data.child}</Text>
                    <Text mb={2}><strong>Toplam Ebced Değeri:</strong> {result.disease_prone_analysis.data.total_ebced}</Text>
                    <Text><strong>Kalan Değer:</strong> {result.disease_prone_analysis.data.remainder}</Text>
                  </Box>

                  {/* Hastalık Analizi */}
                  <Box mb={6}>
                    <Heading as="h3" size="md" mb={4}>
                      HASTALIK ANALİZİ
                    </Heading>
                    <Text mb={2}><strong>Hastalık Tipi:</strong> {typeof result.disease_prone_analysis.data.disease_type === 'object' ? JSON.stringify(result.disease_prone_analysis.data.disease_type) : result.disease_prone_analysis.data.disease_type}</Text>
                    <Text whiteSpace="pre-wrap">
                      <strong>Detaylı Açıklama:</strong><br/>
                      {typeof result.disease_prone_analysis.data.disease_description === 'object' ? JSON.stringify(result.disease_prone_analysis.data.disease_description) : result.disease_prone_analysis.data.disease_description}
                    </Text>
                  </Box>

                  {/* Uyarı Notu */}
                  <Box p={4} bg="gray.50" borderRadius="md">
                    <Text fontStyle="italic" color="gray.600">
                      Not: Bu analiz sonuçları yalnızca olası yatkınlıkları gösterir ve kesin teşhis niteliği taşımaz. 
                      Herhangi bir sağlık sorunu yaşamanız durumunda mutlaka bir sağlık kuruluşuna başvurunuz.
                    </Text>
                  </Box>
                </>
              ) : (
                <Text mb={4}>Hastalığa yatkınlık analizi sonucu bulunamadı.</Text>
              )}
            </Box>
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

export default AnalysisReport; 