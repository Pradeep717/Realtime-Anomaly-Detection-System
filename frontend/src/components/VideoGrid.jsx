import { Grid } from '@chakra-ui/react'
import React from 'react'
import VideoCard from './VideoCard'

const VideoGrid = () => {
  return (
    <>
      <Grid
        templateColumns={{
          base: "repeat(1, 1fr)",
          md: "repeat(1, 1fr)",
          lg: "repeat(1, 1fr)",
        }}
        gap={5}
      >
        <VideoCard />
      </Grid>
    </>
  )
}

export default VideoGrid