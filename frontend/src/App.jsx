import { Button, Container, Flex, Stack, Text } from "@chakra-ui/react";
import Navbar from "./components/Navbar";
import UserGrid from "./components/UserGrid";
import { useState } from "react";
import VideoGrid from "./components/VideoGrid";

export const BASE_URL = import.meta.env.MODE === "development" ? "http://127.0.0.1:5000/api" : "/api";

function App() {

  const [users, setUsers] = useState([])

  return (
    <Stack minH={"100vh"}>
      {/* <Navbar users={users} setUsers={setUsers}  /> */}
      <Container maxW={"1200px"} my={4}>
        <Text
          fontSize={{ base: "3xl", md: "50" }}
          fontWeight={"bold"}
          letterSpacing={"2px"}
          textTransform={"uppercase"}
          textAlign={"center"}
        >
          <Text
            as={"span"}
            bgGradient="linear(to-l, #7928CA, #FF0080)"
            bgClip="text"
          >
            Abnormal Event Detection
          </Text>
          🚀
        </Text>

        <UserGrid users={users} setUsers={setUsers} />

        <VideoGrid />

      </Container>
          
    </Stack>
  );
}

export default App
