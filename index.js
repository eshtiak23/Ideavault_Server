const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    console.log("MongoDB Connected Successfully");

    const database = client.db("ideaVaultDB");
    const ideasCollection = database.collection("ideas");

    app.get("/ideas", async (req, res) => {
      const result = await ideasCollection
        .find()
        .sort({ createdAt: -1 })
        .toArray();

      res.send(result);
    });

    app.get("/ideas/:id", async (req, res) => {
      const id = req.params.id;

      const result = await ideasCollection.findOne({
        _id: new ObjectId(id),
      });

      res.send(result);
    });

    app.get("/trending-ideas", async (req, res) => {
      const result = await ideasCollection
        .find()
        .sort({ createdAt: -1 })
        .limit(6)
        .toArray();

      res.send(result);
    });

    app.post("/ideas", async (req, res) => {
      const idea = req.body;
      idea.createdAt = new Date();

      const result = await ideasCollection.insertOne(idea);
      res.send(result);
    });

    app.get("/", (req, res) => {
      res.send("IdeaVault server is running");
    });
  } finally {
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`IdeaVault server running on port ${port}`);
});