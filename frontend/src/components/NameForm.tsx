import { useState } from 'react'
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Radio,
  RadioGroup,
  Stack,
  useToast,
  VStack,
} from '@chakra-ui/react'
import axios from 'axios'

interface NameFormProps {
  setResult: (result: any) => void
}

const NameForm = ({ setResult }: NameFormProps) => {
  const [name, setName] = useState('')
  const [gender, setGender] = useState('erkek')
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await axios.post('http://localhost:8000/calculate', {
        name,
        gender,
      })
      setResult(response.data)
      
      // İsim veritabanında yoksa bilgi ver
      if (response.data.is_calculated) {
        toast({
          title: 'Bilgi',
          description: 'Bu isim veritabanında olmadığı için otomatik hesaplandı.',
          status: 'info',
          duration: 5000,
          isClosable: true,
        })
      }
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.response?.data?.detail || 'Bir hata oluştu',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box w="100%" p={6} borderRadius="lg" boxShadow="md" bg="white">
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl isRequired>
            <FormLabel>İsminiz</FormLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="İsminizi girin"
            />
          </FormControl>

          <FormControl as="fieldset" isRequired>
            <FormLabel as="legend">Cinsiyet</FormLabel>
            <RadioGroup value={gender} onChange={setGender}>
              <Stack direction="row">
                <Radio value="erkek">Erkek</Radio>
                <Radio value="kadın">Kadın</Radio>
              </Stack>
            </RadioGroup>
          </FormControl>

          <Button
            type="submit"
            colorScheme="blue"
            isLoading={isLoading}
            loadingText="Hesaplanıyor..."
            w="100%"
          >
            Hesapla
          </Button>
        </VStack>
      </form>
    </Box>
  )
}

export default NameForm 