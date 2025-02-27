import {
  Box,
  Heading,
  Text,
  VStack,
  Divider,
  Badge,
} from '@chakra-ui/react'

interface EsmaInfo {
  ebced: number
  name: string
  arabic: string
  meaning: string
}

interface Result {
  name: string
  arabic: string
  ebced: number
  is_calculated: boolean
  exact_match: EsmaInfo | null
  nearest_lower: EsmaInfo | null
  nearest_upper: EsmaInfo | null
}

interface ResultCardProps {
  result: Result
}

const EsmaSection = ({ title, esma }: { title: string; esma: EsmaInfo }) => (
  <Box>
    <Heading size="sm" color="blue.600" mb={2}>
      {title}
    </Heading>
    <Text>
      <strong>Esma:</strong> {esma.name}
    </Text>
    <Text className="arabic-text">
      <strong>Arapça:</strong> {esma.arabic}
    </Text>
    <Text>
      <strong>Ebced:</strong> {esma.ebced}
    </Text>
    <Text fontStyle="italic">
      <strong>Anlamı:</strong> {esma.meaning}
    </Text>
  </Box>
)

const ResultCard = ({ result }: ResultCardProps) => {
  return (
    <Box w="100%" p={6} borderRadius="lg" boxShadow="md" bg="white">
      <VStack spacing={4} align="stretch">
        {/* İsim Bilgileri */}
        <Box>
          <Heading size="md" color="blue.600" mb={3}>
            İsim Bilgileri
            {result.is_calculated && (
              <Badge ml={2} colorScheme="orange">
                Otomatik Hesaplandı
              </Badge>
            )}
          </Heading>
          <Text>
            <strong>İsim:</strong> {result.name}
          </Text>
          <Text className="arabic-text">
            <strong>Arapça Yazılışı:</strong> {result.arabic}
          </Text>
          <Text color="green.600" fontSize="lg">
            <strong>Ebced Değeri:</strong> {result.ebced}
          </Text>
        </Box>

        {/* Tam Eşleşme */}
        {result.exact_match && (
          <>
            <Divider />
            <EsmaSection title="Eşleşen Esma" esma={result.exact_match} />
          </>
        )}

        {/* En Yakın Değerler */}
        {!result.exact_match && (result.nearest_lower || result.nearest_upper) && (
          <>
            <Divider />
            <Heading size="md" color="blue.600" mb={3}>
              En Yakın Esma Değerleri
            </Heading>
            <VStack spacing={4} align="stretch">
              {result.nearest_lower && (
                <EsmaSection
                  title={`Alt Değer (${result.nearest_lower.ebced})`}
                  esma={result.nearest_lower}
                />
              )}
              {result.nearest_upper && (
                <>
                  {result.nearest_lower && <Divider />}
                  <EsmaSection
                    title={`Üst Değer (${result.nearest_upper.ebced})`}
                    esma={result.nearest_upper}
                  />
                </>
              )}
            </VStack>
          </>
        )}
      </VStack>
    </Box>
  )
}

export default ResultCard 