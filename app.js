const ytdl = require("ytdl-core");
const express = require("express");
const fs = require("fs");
const path = require("path");
const ytpl = require("ytpl");
const cors = require("cors");
const axios = require("axios");

const app = express();
const port = 5000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.use(cors());
// Get video info
app.get("/info", async (req, res) => {
  const videoUrl = req.query.url;

  if (!videoUrl) {
    return res.status(400).send("No URL provided.");
  }

  try {
    const videoInfo = await ytdl.getInfo(videoUrl);
    res.send(videoInfo);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while retrieving the video info.");
  }
});

// Download Single video
app.get("/download", async (req, res) => {
  const videoUrl = req.query.url;

  if (!videoUrl) {
    return res.status(400).send("No URL provided.");
  }

  try {
    const videoInfo = await ytdl.getInfo(videoUrl);
    const videoTitle = videoInfo.videoDetails.title.replace(
      /[^a-zA-Z0-9]/g,
      "_"
    );

    // Choose the highest quality format that includes both video and audio
    const videoFormat = ytdl.chooseFormat(videoInfo.formats, {
      quality: "highestvideo",
      filter: "audioandvideo",
    });

    // Set headers for immediate download start
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${videoTitle}.mp4"`
    );
    res.setHeader("Content-Type", "video/mp4");

    // Stream the video with a high buffer size for faster throughput
    ytdl(videoUrl, {
      format: videoFormat,
      highWaterMark: 64 * 1024 * 1024,
    }).pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while downloading the video.");
  }
});

// Download all videos from playlist
/* add soon */

// Get playlist info
app.get("/playlist", async (req, res) => {
  const playlistUrl = req.query.url;

  if (!playlistUrl) {
    return res.status(400).send("No URL provided.");
  }

  try {
    const playlistId = await ytpl.getPlaylistID(playlistUrl);
    const playlistInfo = await ytpl(playlistId);
    res.send(playlistInfo);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send("An error occurred while retrieving the playlist info.");
  }
});

// Download thumbnail by URL
app.get("/download-thumbnail", async (req, res) => {
  const thumbnailUrl = req.query.url;

  if (!thumbnailUrl) {
    return res.status(400).send("No URL provided.");
  }

  try {
    const response = await axios({
      url: thumbnailUrl,
      responseType: "stream",
    });

    // Set headers for immediate download start
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="thumbnail.jpg"`
    );
    res.setHeader("Content-Type", "image/jpeg");

    response.data.pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while downloading the thumbnail.");
  }
});

app.use((req, res, next) => {
  res.status(404).send("Sorry, that route doesn't exist.");
});

app.use((error, req, res, next) => {
  console.error(error.stack);
  res.status(500).send("Something broke!");
});

// endpoint example
//http://localhost:5000/info?url=https://www.youtube.com/watch?v=TO-hT6jyDKU
