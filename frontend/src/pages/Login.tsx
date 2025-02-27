import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  useToast,
  VStack,
  InputGroup,
  InputRightElement,
  IconButton,
  useColorModeValue,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await login(username, password);
      navigate('/', { replace: true });
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'Giriş hatası',
        description: error.message || 'Giriş yapılamadı',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Container maxW="lg" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
      <Stack spacing="8">
        <Stack spacing="6" textAlign="center">
          <Stack spacing={{ base: '2', md: '3' }} textAlign="center">
            <Heading size={{ base: 'xs', md: 'sm' }}>
              Ebced Hesaplama Sistemine Hoş Geldiniz
            </Heading>
            <Text color="gray.500">
              Lütfen hesabınıza giriş yapın
            </Text>
          </Stack>
        </Stack>

        <Box
          py={{ base: '0', sm: '8' }}
          px={{ base: '4', sm: '10' }}
          bg={bgColor}
          boxShadow={{ base: 'none', sm: 'md' }}
          borderRadius={{ base: 'none', sm: 'xl' }}
          borderWidth={{ base: '0', sm: '1px' }}
          borderColor={borderColor}
        >
          <VStack spacing="6" as="form" onSubmit={handleLogin}>
            <Heading size="lg">Ebced Hesaplayıcı</Heading>

            <Stack spacing="6" width="100%">
              <FormControl isRequired>
                <FormLabel>Kullanıcı Adı</FormLabel>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Kullanıcı adınızı girin"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Şifre</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Şifrenizi girin"
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                      icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      onClick={() => setShowPassword(!showPassword)}
                      variant="ghost"
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              <Button
                type="submit"
                colorScheme="blue"
                width="full"
                isLoading={isLoading}
                loadingText="Giriş yapılıyor..."
              >
                Giriş Yap
              </Button>
            </Stack>
          </VStack>
        </Box>

        <Text textAlign="center" fontSize="sm" color="gray.500">
          © {new Date().getFullYear()} Ebced Hesaplama. Tüm hakları saklıdır.
        </Text>
      </Stack>
    </Container>
  );
};

export default Login; 