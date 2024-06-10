import express from "express";
import cors from "cors";
import simpleGit from "simple-git";
import { generate } from "./utils";
import { getAllFiles } from "./file";
import path from "path";
import { uploadFile } from "./aws";
import { createClient } from "redis";

const publisher = createClient();
const subscriber = createClient();

(async () => {
  try {
    await publisher.connect();
    await subscriber.connect();
  } catch (err) {
    console.error("Failed to connect to Redis:", err);
  }
})();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/deploy", async (req, res) => {
  try {
    const repoUrl = req.body.repoUrl;
    const id = generate(); // asd12

    // Clone repository
    await simpleGit().clone(repoUrl, path.join(__dirname, `output/${id}`));

    // Get all files
    const files = getAllFiles(path.join(__dirname, `output/${id}`));

    // Upload files
    await Promise.all(files.map(file => uploadFile(file.slice(__dirname.length + 1), file)));

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Add to Redis queue
    await publisher.lPush("build-queue", id);

    // Set status in Redis
    await publisher.hSet("status", id, "uploaded");

    res.json({ id });
  } catch (err) {
    console.error("Error in /deploy:", err);
    res.status(500).json({ error: "Deployment failed" });
  }
});

app.get("/status", async (req, res) => {
  try {
    const id = req.query.id;
    const response = await subscriber.hGet("status", id as string);
    res.json({ status: response });
  } catch (err) {
    console.error("Error in /status:", err);
    res.status(500).json({ error: "Failed to get status" });
  }
});

process.on("SIGINT", async () => {
  await publisher.quit();
  await subscriber.quit();
  process.exit();
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
