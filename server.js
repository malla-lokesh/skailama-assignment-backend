import express from "express";
import cors from "cors";
import { MongoClient, ServerApiVersion } from "mongodb";

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
    if (user) {
      const projects = await db
        .collection("projects")
        .find({ userId: user._id })
        .toArray();
      return res.json({ exists: true, projects });
    } else {
      const result = await db.collection("users").insertOne({ email });
      return res.json({ exists: false });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server error");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at PORT ${PORT}`);
});
