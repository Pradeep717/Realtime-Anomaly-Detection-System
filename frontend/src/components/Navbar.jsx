import { Box, Button, Container, Flex, Text, useColorMode, useColorModeValue } from '@chakra-ui/react'
import React from 'react'
import { IoMoon } from 'react-icons/io5'
import { LuSun } from 'react-icons/lu'
import CreateUserModel from './CreateUserModel';

const Navbar = ({users, setUsers}) => {
    const { colorMode, toggleColorMode } = useColorMode();
  return (
    <Container maxW={"900px"} my={4}>
      <Box p={4} bg={useColorModeValue("gray.200", "gray.700")} borderRadius={4}>
        <Flex alignContent={"center"} justifyContent={"space-between"} h="16`">
            <Flex
                alignItems="center"
                justifyContent="center"
                gap={3}
                display={{ base: "none", sm: "flex" }}
            >
                <img src="/react.png" alt="react" width="50" height="50" />
                <Text fontSize="lg" fontWeight="bold">
                    +
                </Text>
                <img src="/python.png" alt="logo" width="50" height="40" />
                <Text fontSize="lg" fontWeight="bold">
                    =
                </Text>
                <img src="/explode.png" alt="explode" width="45" height="45" />
            </Flex>

            <Flex
                alignItems="center"
                gap={3}
            >
                <Text fontSize="lg" fontWeight="500" display={{ base: "none", sm: "block" }}>
                    Join with us to detect 🔥
                </Text>
                <Button onClick={toggleColorMode}>
                    {colorMode === "light" ? <IoMoon /> : <LuSun size ={20} />}
                </Button>
                {/* <CreateUserModel setUsers={setUsers}/> */}
            </Flex>
        </Flex>
      </Box>
    </Container>
  )
};

export default Navbar