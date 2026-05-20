const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://ideavault-client-nine.vercel.app",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

const uri = process.env.MONGO_URI;
console.log("Mongo URI exists:", !!uri);

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

    app.get("/", (req, res) => {
      res.send("IdeaVault server is running");
    });

    app.post("/jwt", async (req, res) => {
      const user = req.body;

      const token = jwt.sign(
        user,
        process.env.ACCESS_TOKEN_SECRET || "ideaVaultSecret",
        { expiresIn: "7d" }
      );

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    app.get("/ideas", async (req, res) => {
      const result = await ideasCollection
        .find()
        .sort({ createdAt: -1 })
        .toArray();

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

    app.get("/my-ideas", async (req, res) => {
      const email = req.query.email;

      const result = await ideasCollection
        .find({ userEmail: email })
        .sort({ createdAt: -1 })
        .toArray();

      res.send(result);
    });

    app.get("/my-interactions", async (req, res) => {
      const email = req.query.email;

      const result = await commentsCollection
        .find({ userEmail: email })
        .sort({ createdAt: -1 })
        .toArray();

      res.send(result);
    });

    app.get("/ideas/:id", async (req, res) => {
      const id = req.params.id;

      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid idea id" });
      }

      const result = await ideasCollection.findOne({
        _id: new ObjectId(id),
      });

      res.send(result);
    });

    app.post("/ideas", async (req, res) => {
      const idea = req.body;
      idea.createdAt = new Date();

      const result = await ideasCollection.insertOne(idea);
      res.send(result);
    });

    app.put("/ideas/:id", async (req, res) => {
      const id = req.params.id;
      const updatedIdea = req.body;

      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid idea id" });
      }

      const result = await ideasCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedIdea }
      );

      res.send(result);
    });

    app.delete("/ideas/:id", async (req, res) => {
      const id = req.params.id;

      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid idea id" });
      }

      const result = await ideasCollection.deleteOne({
        _id: new ObjectId(id),
      });

      res.send(result);
    });

    app.post("/comments", async (req, res) => {
      const comment = req.body;
      comment.createdAt = new Date();

      const result = await commentsCollection.insertOne(comment);
      res.send(result);
    });

    app.get("/comments/:ideaId", async (req, res) => {
      const ideaId = req.params.ideaId;

      const result = await commentsCollection
        .find({ ideaId: ideaId })
        .sort({ createdAt: -1 })
        .toArray();

      res.send(result);
    });

    app.put("/comments/:id", async (req, res) => {
      const id = req.params.id;
      const updatedComment = req.body;

      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid comment id" });
      }

      const result = await commentsCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            commentText: updatedComment.commentText,
            updatedAt: new Date(),
          },
        }
      );

      res.send(result);
    });

    app.delete("/comments/:id", async (req, res) => {
      const id = req.params.id;

      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid comment id" });
      }

      const result = await commentsCollection.deleteOne({
        _id: new ObjectId(id),
      });

      res.send(result);
    });
  } catch (error) {
    console.log(error);
  }
}

run();

app.listen(port, () => {
  console.log(`IdeaVault server running on port ${port}`);
});