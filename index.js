const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://ideavault-client-nine.vercel.app",
  "https://ideavault-client-vn37eeeup-eshtiak23s-projects.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let ideasCollection;
let commentsCollection;

async function connectDB() {
  if (!ideasCollection || !commentsCollection) {
    await client.connect();

    const database = client.db("ideaVaultDB");
    ideasCollection = database.collection("ideas");
    commentsCollection = database.collection("comments");

    console.log("MongoDB Connected Successfully");
  }
}

app.get("/", async (req, res) => {
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
  await connectDB();

  const result = await ideasCollection
    .find()
    .sort({ createdAt: -1 })
    .toArray();

  res.send(result);
});

app.get("/trending-ideas", async (req, res) => {
  await connectDB();

  const result = await ideasCollection
    .find()
    .sort({ createdAt: -1 })
    .limit(6)
    .toArray();

  res.send(result);
});

app.get("/my-ideas", async (req, res) => {
  await connectDB();

  const email = req.query.email;

  const result = await ideasCollection
    .find({ userEmail: email })
    .sort({ createdAt: -1 })
    .toArray();

  res.send(result);
});

app.get("/my-interactions", async (req, res) => {
  await connectDB();

  const email = req.query.email;

  const result = await commentsCollection
    .find({ userEmail: email })
    .sort({ createdAt: -1 })
    .toArray();

  res.send(result);
});

app.get("/ideas/:id", async (req, res) => {
  await connectDB();

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
  await connectDB();

  const idea = req.body;
  idea.createdAt = new Date();

  const result = await ideasCollection.insertOne(idea);
  res.send(result);
});

app.put("/ideas/:id", async (req, res) => {
  await connectDB();

  const id = req.params.id;

  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: "Invalid idea id" });
  }

  const result = await ideasCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: req.body }
  );

  res.send(result);
});

app.delete("/ideas/:id", async (req, res) => {
  await connectDB();

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
  await connectDB();

  const comment = req.body;
  comment.createdAt = new Date();

  const result = await commentsCollection.insertOne(comment);
  res.send(result);
});

app.get("/comments/:ideaId", async (req, res) => {
  await connectDB();

  const ideaId = req.params.ideaId;

  const result = await commentsCollection
    .find({ ideaId })
    .sort({ createdAt: -1 })
    .toArray();

  res.send(result);
});

app.put("/comments/:id", async (req, res) => {
  await connectDB();

  const id = req.params.id;

  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: "Invalid comment id" });
  }

  const result = await commentsCollection.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        commentText: req.body.commentText,
        updatedAt: new Date(),
      },
    }
  );

  res.send(result);
});

app.delete("/comments/:id", async (req, res) => {
  await connectDB();

  const id = req.params.id;

  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: "Invalid comment id" });
  }

  const result = await commentsCollection.deleteOne({
    _id: new ObjectId(id),
  });

  res.send(result);
});

module.exports = app;

if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 5000;

  app.listen(port, () => {
    console.log(`IdeaVault server running on port ${port}`);
  });
}