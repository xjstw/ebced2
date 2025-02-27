import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Flex,
  Link,
  useColorModeValue,
} from '@chakra-ui/react';

const Navbar = () => {
  const location = useLocation();
  const bgColor = useColorModeValue('white', 'gray.800');
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const activeColor = useColorModeValue('blue.600', 'blue.200');

  const navItems = [
    { path: '/', label: 'Kapsamlı Analiz' },
    { path: '/couple-match', label: 'Çift Uyumu' },
    { path: '/name-coaching', label: 'İsim Koçluğu' },
    {
      name: 'Maddi Blokaj/Bolluk Bereket Rızık',
      href: '/financial-blessing',
    },
  ];

  return (
    <Box bg={bgColor} boxShadow="sm" position="sticky" top={0} zIndex={1}>
      <Container maxW="container.xl">
        <Flex
          as="nav"
          py={4}
          gap={4}
          overflowX="auto"
          flexWrap="wrap"
          justifyContent="center"
          css={{
            '&::-webkit-scrollbar': {
              display: 'none'
            }
          }}
        >
          {navItems.map((item) => (
            <Link
              key={item.path}
              as={RouterLink}
              to={item.path}
              px={3}
              py={2}
              rounded="md"
              fontWeight="medium"
              color={location.pathname === item.path ? activeColor : 'gray.600'}
              bg={location.pathname === item.path ? activeBg : 'transparent'}
              _hover={{
                bg: activeBg,
                color: activeColor
              }}
              whiteSpace="nowrap"
            >
              {item.label}
            </Link>
          ))}
        </Flex>
      </Container>
    </Box>
  );
};

export default Navbar; 