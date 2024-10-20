import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  Button,
  Text,
  Image,
  Grid,
} from "@chakra-ui/react";
import { GiCctvCamera } from "react-icons/gi";
import { useSocket } from "../context/SocketContext";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const VideoCard = () => {
  const { socket } = useSocket();
  const [videoData, setVideoData] = useState({
    frame: "https://bit.ly/naruto-sage",
  });
  const [isStreaming, setIsStreaming] = useState(false);
  const [graphData, setGraphData] = useState([]);
  const abnormalCountRef = useRef(0);
  const lastNotificationTimeRef = useRef(0);

  useEffect(() => {
    if (socket) {
      socket.on("frame_data", (data) => {
        setVideoData(data);
        setGraphData((prevData) => [
          ...prevData,
          { frameNumber: data.frame_number, anomalyScore: data.anomaly_score },
        ]);

        // Check if the frame is abnormal
        if (data.label === "Abnormal") {
          abnormalCountRef.current += 1;
        } else {
          abnormalCountRef.current = 0;
        }

        // If 5 consecutive frames are abnormal and 10 minutes have passed since the last notification
        const currentTime = Date.now();
        if (
          abnormalCountRef.current >= 5 &&
          currentTime - lastNotificationTimeRef.current >= 10 * 60 * 1000
        ) {
          sendNotification();
          lastNotificationTimeRef.current = currentTime;
          abnormalCountRef.current = 0; // reset the count after sending notification
        }
      });
    }
    return () => {
      if (socket) {
        socket.off("frame_data");
      }
    };
  }, [socket]);

  const sendNotification = async () => {
    try {
      const response = await fetch("http://localhost:5000/send-notification");
      if (response.ok) {
        console.log("Notification sent");
      } else {
        console.error("Failed to send notification");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  const handleStartDetecting = async () => {
    try {
      const response = await fetch("http://localhost:5000/start-video");
      if (response.ok) {
        setIsStreaming(true);
      } else {
        console.error("Failed to start video processing");
      }
    } catch (error) {
      console.error("Error starting video processing:", error);
    }
  };

  const handleStopDetecting = async () => {
    try {
      const response = await fetch("http://localhost:5000/stop-video");
      if (response.ok) {
        setIsStreaming(false);
      } else {
        console.error("Failed to stop video processing");
      }
    } catch (error) {
      console.error("Error stopping video processing:", error);
    }
  };

  return (
    <Grid
      templateColumns={{
        base: "repeat(1, 1fr)",
        md: "repeat(2, 1fr)",
        lg: "repeat(2, 1fr)",
      }}
      gap={5}
    >
      <Card>
        <CardHeader>
          <Flex>
            <Flex alignItems="center" flex="1" gap={4}>
              <GiCctvCamera size={40} />
              <Box>
                <Heading size="md">Attention on Video</Heading>
                <Text>
                  {isStreaming
                    ? "Streaming Under VAE"
                    : "We are watching your CCTV footages"}
                </Text>
              </Box>
            </Flex>
            <Flex>
              {isStreaming ? (
                <Button
                  colorScheme="red"
                  size="sm"
                  onClick={handleStopDetecting}
                >
                  Stop Video Stream
                </Button>
              ) : (
                <Button
                  colorScheme="teal"
                  size="sm"
                  onClick={handleStartDetecting}
                >
                  Start Video Stream
                </Button>
              )}
            </Flex>
          </Flex>
        </CardHeader>

        <CardBody>
          <Text>Real Time Video Streaming</Text>
          <Flex justify="center" mb={4}>
            <Text fontSize="sm" color="gray.500">
              {videoData.label === "Abnormal"
                ? "Anomaly Detected"
                : "No Anomaly Detected"}
            </Text>
          </Flex>
          {isStreaming && (
            <Image
              src={
                videoData.frame
                  ? `data:image/jpeg;base64,${videoData.frame}`
                  : "/public/live.png"
              }
              alt="Video Stream"
              objectFit="cover"
              width={"100%"}
              border={
                videoData.label === "Abnormal"
                  ? "5px solid red"
                  : "5px solid green"
              }
            />
          )}
          {!isStreaming && (
            <Image
              src="/public/live_on.png"
              alt="Video Stream"
              objectFit="cover"
              width="100%"
            />
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader>
          <Flex>
            <Flex alignItems="center" flex="1" gap={4}>
              <GiCctvCamera size={40} />
              <Box>
                <Heading size="md">Frame Analysis</Heading>
                <Text>
                  {isStreaming
                    ? "Streaming Under VAE"
                    : "We are watching your CCTV footages"}
                </Text>
              </Box>
            </Flex>
            <Flex>
              {isStreaming ? (
                <Button
                  colorScheme="red"
                  size="sm"
                  onClick={handleStopDetecting}
                >
                  Stop Video Stream
                </Button>
              ) : (
                <Button
                  colorScheme="teal"
                  size="sm"
                  onClick={handleStartDetecting}
                >
                  Start Video Stream
                </Button>
              )}
            </Flex>
          </Flex>
        </CardHeader>

        <CardBody>
          <Text>Frame Number vs Anomaly Score</Text>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={graphData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="frameNumber" />
              <YAxis domain={[0.3, 25]} />
              <Tooltip />
              <ReferenceLine y={13} stroke="black" label="Threshold" />
              <Area
                type="monotone"
                dataKey="anomalyScore"
                stroke="#8884d8"
                fillOpacity={1}
                fill="url(#colorAnomaly)"
                isAnimationActive={false}
              />
              <defs>
                <linearGradient id="colorAnomaly" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="red" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="green" stopOpacity={0.4} />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
    </Grid>
  );
};

export default VideoCard;
