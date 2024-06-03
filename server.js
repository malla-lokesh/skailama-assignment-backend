import express from "express";
import cors from "cors";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";

const PORT = process.env.PORT || 5050;
const URI = process.env.URI || "";

const app = express();
app.use(cors());
app.use(express.json());

const client = new MongoClient(URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db;

async function connectToDB() {
  try {
    await client.connect();
    db = client.db("users");
    console.log("Successfully connected to MongoDB");
  } catch (error) {
    console.error(error);
  }
}

connectToDB();

app.post("/api/check-email", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await db.collection("users").findOne({ email });
    console.log(user);
    if (user) {
      return res.json({ exists: true, user });
    } else {
      const result = await db
        .collection("users")
        .insertOne({ email, projects: [] });
      return res.json({ exists: false, userId: result.insertedId });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server error");
  }
});

// Create Project
app.post("/api/projects", async (req, res) => {
  const { userId, projectName } = req.body;
  try {
    const newProject = {
      projectId: new ObjectId(),
      name: projectName,
      files: [],
    };
    const result = await db
      .collection("users")
      .updateOne(
        { _id: new ObjectId(userId) },
        { $push: { projects: newProject } }
      );
    res.json(newProject);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

// Upload File
app.post("/api/files", async (req, res) => {
  const { userId, projectId, title, description } = req.body;
  try {
    const newFile = {
      fileId: new ObjectId(),
      title,
      description,
    };
    const result = await db.collection("users").updateOne(
      {
        _id: new ObjectId(userId),
        "projects.projectId": new ObjectId(projectId),
      },
      { $push: { "projects.$.files": newFile } }
    );
    res.json(newFile);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

// Get Files for a Project
app.get("/api/users/:userId/projects/:projectId/files", async (req, res) => {
  const { userId, projectId } = req.params;
  try {
    const user = await db.collection("users").findOne(
      {
        _id: new ObjectId(userId),
        "projects.projectId": new ObjectId(projectId),
      },
      { projection: { "projects.$": 1 } }
    );
    if (user) {
      res.json(user.projects[0].files);
    } else {
      res.status(404).send("Project not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

// Edit File
app.put("/api/files/:userId/:projectId/:fileIndex", async (req, res) => {
  const { userId, projectId, fileIndex } = req.params;
  const { title, description } = req.body;
  try {
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userId) });
    if (user) {
      const project = user.projects.find((p) => {
        return p.projectId.toString() === projectId;
      });
      if (project && project.files[fileIndex]) {
        project.files[fileIndex].title = title;
        project.files[fileIndex].description = description;
        await db
          .collection("users")
          .updateOne(
            { _id: new ObjectId(userId) },
            { $set: { projects: user.projects } }
          );
        res.json(project.files[fileIndex]);
      } else {
        res.status(404).send("File not found");
      }
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

// Delete File
app.delete("/api/files/:userId/:projectId/:fileIndex", async (req, res) => {
  const { userId, projectId, fileIndex } = req.params;
  try {
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userId) });
    if (user) {
      const project = user.projects.find(
        (p) => p.projectId.toString() === projectId
      );
      if (project && project.files[fileIndex]) {
        project.files.splice(fileIndex, 1);
        await db
          .collection("users")
          .updateOne(
            { _id: new ObjectId(userId) },
            { $set: { projects: user.projects } }
          );
        res.json({ message: "File deleted" });
      } else {
        res.status(404).send("File not found");
      }
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at PORT ${PORT}`);
});
