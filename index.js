const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// middleware

app.use(cors());
app.use(express.json());

// mongodb setup Section

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
    const commentsCollection = database.collection("comments");

    // get all ideas
    app.get("/ideas", async (req, res) => {
      const result = await ideasCollection
        .find()
        .sort({ createdAt: -1 })
        .toArray();

      res.send(result);
    });

    // get trending ideas
    app.get("/trending-ideas", async (req, res) => {
      const result = await ideasCollection
        .find()
        .sort({ createdAt: -1 })
        .limit(6)
        .toArray();

      res.send(result);
    });

    // get logged-in user's ideas
    app.get("/my-ideas", async (req, res) => {
      const email = req.query.email;

      const result = await ideasCollection
        .find({ userEmail: email })
        .sort({ createdAt: -1 })
        .toArray();

      res.send(result);
    });

    // get one idea by id

    app.get("/ideas/:id", async (req, res) => {
      const id = req.params.id;

      const result = await ideasCollection.findOne({
        _id: new ObjectId(id),
      });

      res.send(result);
    });

    // add new idea

    app.post("/ideas", async (req, res) => {
      const idea = req.body;

      idea.createdAt = new Date();

      const result = await ideasCollection.insertOne(idea);

      res.send(result);
    });

    // add comment

    app.post("/comments", async (req, res) => {
      const comment = req.body;

      comment.createdAt = new Date();

      const result = await commentsCollection.insertOne(comment);

      res.send(result);
    });

    // comments for one idea

    app.get("/comments/:ideaId", async (req, res) => {
      const ideaId = req.params.ideaId;

      const result = await commentsCollection
        .find({ ideaId: ideaId })
        .sort({ createdAt: -1 })
        .toArray();

      res.send(result);
    });

    // get user's comments
app.get("/my-interactions", async (req, res) => {

  const email = req.query.email;

  const result = await commentsCollection
    .find({ userEmail: email })
    .sort({ createdAt: -1 })
    .toArray();

  res.send(result);

});

    // server home route

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