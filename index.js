const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// mongodb uri
const uri = process.env.MONGO_URI;

// mongodb client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {

  try {

    // connect mongodb
    await client.connect();

    console.log("MongoDB Connected Successfully");

    // database
    const database = client.db("ideaVaultDB");

    // collection
    const ideasCollection = database.collection("ideas");




    // GET ALL IDEAS

    app.get("/ideas", async (req, res) => {

      const result = await ideasCollection
        .find()
        .sort({ createdAt: -1 })
        .toArray();

      res.send(result);

    });




    // GET TRENDING IDEAS

    app.get("/trending-ideas", async (req, res) => {

      const result = await ideasCollection
        .find()
        .sort({ createdAt: -1 })
        .limit(6)
        .toArray();

      res.send(result);

    });




    // ADD IDEA

    app.post("/ideas", async (req, res) => {

      const idea = req.body;

      idea.createdAt = new Date();

      const result = await ideasCollection.insertOne(idea);

      res.send(result);

    });



    // root route
    app.get("/", (req, res) => {
      res.send("IdeaVault server is running");
    });

  } finally {

  }
}

run().catch(console.dir);

// server
app.listen(port, () => {
  console.log(`IdeaVault server running on port ${port}`);
});