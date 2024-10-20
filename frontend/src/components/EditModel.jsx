import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Radio,
  RadioGroup,
  Textarea,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { BiEditAlt } from "react-icons/bi";
import { BASE_URL } from "../App";
import { useState } from "react";

function EditModal({ user, setUsers }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast()
  const [inputs, setInputs] = useState({
    name: user.name,
    role: user.role,
    description: user.description,
  });

  const handleUpdateUser = async (e) => {
	e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(BASE_URL + "/friends/" + user.id, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inputs),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error);
      }

	  setUsers((prevUsers)=> prevUsers.map((u)=> u.id === user.id ? data : u));
	  toast({
		title: 'Yay! 🎉',
		description: "Friend updated successfully",
		status: 'success',
		duration: 2000,
		position: 'top-center',
		isClosable: true,
	  })
	  onClose();
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <IconButton
        onClick={onOpen}
        variant="ghost"
        colorScheme="blue"
        aria-label="See menu"
        size={"sm"}
        icon={<BiEditAlt size={20} />}
      />

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <form onSubmit={handleUpdateUser}>
          <ModalContent>
            <ModalHeader>My new BFF 😍</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <Flex alignItems={"center"} gap={4}>
                <FormControl>
                  <FormLabel>Full Name</FormLabel>
                  <Input placeholder="John Doe" 
					value={inputs.name}
					onChange={(e) => setInputs({...inputs, name: e.target.value})}
				  />
                </FormControl>

                <FormControl>
                  <FormLabel>Role</FormLabel>
                  <Input placeholder="Software Engineer" 
					value={inputs.role}
					onChange={(e) => setInputs({...inputs, role: e.target.value})}
				  />
                </FormControl>
              </Flex>
              <FormControl mt={4}>
                <FormLabel>Description</FormLabel>
                <Textarea
                  resize={"none"}
                  overflowY={"hidden"}
                  placeholder="He's a software engineer who loves to code and build things."
				  value={inputs.description}
				  onChange={(e) => setInputs({...inputs, description: e.target.value})}
                />
              </FormControl>
            </ModalBody>

            <ModalFooter>
              <Button colorScheme="blue" mr={3} type="submit" isLoading={isLoading}>
                Update
              </Button>
              <Button onClick={onClose}>Cancel</Button>
            </ModalFooter>
          </ModalContent>
        </form>
      </Modal>
    </>
  );
}

export default EditModal;
