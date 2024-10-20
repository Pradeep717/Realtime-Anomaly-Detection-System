import {
  Avatar,
  Box,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  Icon,
  IconButton,
  Text,
  useToast,

} from "@chakra-ui/react";
import React from "react";
import { BiTrash } from "react-icons/bi";
import EditModel from "./EditModel";
import { BASE_URL } from "../App";

const UserCard = ({ user, setUsers }) => {

  const toast = useToast()

  const handleDeleteUser = async () => {
    try {
      const res = await fetch(BASE_URL + "/friends/" + user.id, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error);
      }
      setUsers((prevUsers) => prevUsers.filter((u) => u.id !== user.id));
      toast({
        title: "Yay! 🎉",
        description: "Friend deleted successfully",
        status: "success",
        duration: 2000,
        position: "top-center",
        isClosable: true,
      });
    } catch (error) {
      console.log(error);
      toast({
        title: "Oops! 😢",
        description: error.message,
        status: "error",
        duration: 4000,
        position: "top-center",
        isClosable: true,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <Flex>
          <Flex
            alignItems="center"
            flex="1"
            gap={4} 
          >
            <Avatar src={user.imgUrl} size="md" name={user.name} />
            <Box>
              <Heading size="md">{user.name}</Heading>
              <Text>{user.role}</Text>
            </Box>
          </Flex>
          <Flex>
            <EditModel user={user} setUsers={setUsers} />
            <IconButton
              variant="ghost"
              colorScheme="red"
              size={"sm"}
              aria-label="Delete User"
              icon={<BiTrash size={20} />}
              onClick={handleDeleteUser}
            />
          </Flex>
        </Flex>
      </CardHeader>

      <CardBody>
        <Text>{user.description}</Text>
      </CardBody>
    </Card>
  );
};

export default UserCard;
