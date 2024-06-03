import { MongoClient, ServerApiVersion } from "mongodb";

const URI = process.env.URI || "";

const client = new MongoClient(URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

try {
  // connect to the server
  await client.connect();
  // send a ping to confirm a successful connection
  await client.db("admin").command({ ping: 1 });
  console.log("Successfully connected to MongoDB");
} catch (error) {
  console.error(error);
}

let db = client.db("users");

export default db;
