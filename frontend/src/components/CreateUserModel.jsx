import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  ModalFooter,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  RadioGroup,
  Radio,
  Stack,
  useToast,
} from "@chakra-ui/react";
import React, { useState } from "react";
import { BiAddToQueue } from "react-icons/bi";
import { BASE_URL } from "../App";

const CreateUserModel = ({setUsers}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const [inputs, setInputs] = useState({
    name: "",
    role: "",
    description: "",
    gender: "",
  })

  const handleCreateUser = async (e) => {
    e.preventDefault(); // Prevents the default behavior of the form
    setIsLoading(true);
    try {
      const res = await fetch(BASE_URL + "/friends", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inputs),
      });

      const data = await res.json();
      console.log(data)
      if (!res.ok) {
        throw new Error(data.error);
      }
      toast({
        title: 'Yay! 🎉',
        description: "Friend created successfully",
        status: 'success',
        duration: 2000,
        position: 'top-center',
        isClosable: true,
      })
      onClose();
      setUsers((prevUsers) => [...prevUsers, data]);
      setInputs({
        name: "",
        role: "",
        description: "",
        gender: "",
      });
    } catch (error) {
      console.log("Error occured")
      console.log(error);
      toast({
        title: 'Oops! 😢',
        description: error.message,
        status: 'error',
        duration: 4000,
        position: 'top-center',
        isClosable: true,
      })
    } finally {
      console.log("All done");
      setIsLoading(false);
    }
  }

  return (
    <>
      <Button onClick={onOpen}>
        <BiAddToQueue size={20} />
      </Button>

      <Modal onClose={onClose} isOpen={isOpen} isCentered>
        <ModalOverlay />
        <form onSubmit={handleCreateUser}>
        <ModalContent>
          <ModalHeader>My New BFF 😍</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Flex alignItems={"center"} gap={4}>
              <FormControl>
                <FormLabel>Full name</FormLabel>
                <Input 
                placeholder="Jone Doe" 
                value={inputs.name}
                onChange={(e) => setInputs({...inputs, name: e.target.value})}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Role</FormLabel>
                <Input 
                placeholder="Software Engineer"
                value={inputs.role}
                onChange={(e) => setInputs({...inputs, role: e.target.value})} 
                />
              </FormControl>
            </Flex>
            <FormControl mt={4}>
              <FormLabel>Description</FormLabel>
              <Textarea
                placeholder="He's a software engineer who loves to code and build things."
                resize={"none"}
                overflow={"hidden"}
                value={inputs.description}
                onChange={(e) => setInputs({...inputs, description: e.target.value})}
              />
            </FormControl>
            <RadioGroup mt={4}>
              <Flex gap={5}>
                <Radio 
                value="male"
                onChange={(e) => setInputs({...inputs, gender: e.target.value})}
                >Male</Radio>
                <Radio 
                value="female"
                onChange={(e) => setInputs({...inputs, gender: e.target.value})}
                >Female</Radio>
              </Flex>
            </RadioGroup>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} type="submit"
            isLoading={isLoading}
            >
              Add
            </Button>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
        </form>
      </Modal>
    </>
  );
};

export default CreateUserModel;
