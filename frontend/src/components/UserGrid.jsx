import { Flex, Grid, Spinner, Text } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import UserCard from "./UserCard";
import { USERS } from "../dummy/dummy";
import { BASE_URL } from "../App";

const UserGrid = ({ users, setUsers }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUsers = async () => {
      try {
        const res = await fetch(BASE_URL + "/friends", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error);
        }
        setUsers(data);
      } catch (error) {
        console.log(error);
      } finally {
        console.log("All done");
        setIsLoading(false);
      }
    };

    getUsers();
  }, []);

  return (
    <>
      <Grid
        templateColumns={{
          base: "repeat(1, 1fr)",
          md: "repeat(2, 1fr)",
          lg: "repeat(3, 1fr)",
        }}
        gap={5}
      >
        {users.map((user) => {
          return <UserCard key={user.id} user={user} setUsers={setUsers} />;
        })}
      </Grid>

      {isLoading && (
        <Flex justifyContent={"center"}>
          <Spinner size="xl" />
        </Flex>
      )}

      {users.length === 0 && !isLoading && (
        <Flex justifyContent={"center"} my={5}>
          <Text fontSize="xl">
            <Text as={"span"} fontWeight="bold">
              CCTV in operation 🚨
            </Text>
          </Text>
        </Flex>
      )}


    </>
  );
};

export default UserGrid;
