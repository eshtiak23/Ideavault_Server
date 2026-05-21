const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;
const uri = process.env.MONGO_URI;

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let ideasCollection;
let commentsCollection;

const connectDB = async () => {
  if (!uri) {
    throw new Error("MONGO_URI is missing");
  }

  if (ideasCollection && commentsCollection) return;

  await client.connect();

  const db = client.db("ideaVaultDB");
  ideasCollection = db.collection("ideas");
  commentsCollection = db.collection("comments");

  console.log("MongoDB connected");
};

const isValidId = (id) => ObjectId.isValid(id);

app.get("/", (req, res) => {
  res.send("IdeaVault server is running");
});

app.post("/jwt", (req, res) => {
  const user = req.body;

  const token = jwt.sign(
    user,
    process.env.ACCESS_TOKEN_SECRET || "ideaVaultSecret",
    { expiresIn: "7d" }
  );

  res
    .cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    })
    .send({ success: true });
});

app.post("/logout", (req, res) => {
  res
    .clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    })
    .send({ success: true });
});

app.get("/ideas", async (req, res) => {
  try {
    await connectDB();

    const ideas = await ideasCollection
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    res.send(ideas);
  } catch (error) {
    res.status(500).send({
      message: "Failed to load ideas",
      error: error.message,
    });
  }
});

app.get("/trending-ideas", async (req, res) => {
  try {
    await connectDB();

    const ideas = await ideasCollection
      .find()
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray();

    res.send(ideas);
  } catch (error) {
    res.status(500).send({
      message: "Failed to load trending ideas",
      error: error.message,
    });
  }
});

app.get("/my-ideas", async (req, res) => {
  try {
    await connectDB();

    const { email } = req.query;

    if (!email) {
      return res.status(400).send({ message: "Email is required" });
    }

    const ideas = await ideasCollection
      .find({ userEmail: email })
      .sort({ createdAt: -1 })
      .toArray();

    res.send(ideas);
  } catch (error) {
    res.status(500).send({
      message: "Failed to load my ideas",
      error: error.message,
    });
  }
});

app.get("/ideas/:id", async (req, res) => {
  try {
    await connectDB();

    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).send({ message: "Invalid idea id" });
    }

    const idea = await ideasCollection.findOne({ _id: new ObjectId(id) });

    if (!idea) {
      return res.status(404).send({ message: "Idea not found" });
    }

    res.send(idea);
  } catch (error) {
    res.status(500).send({
      message: "Failed to load idea",
      error: error.message,
    });
  }
});

app.post("/ideas", async (req, res) => {
  try {
    await connectDB();

    const idea = {
      ...req.body,
      createdAt: new Date(),
    };

    const result = await ideasCollection.insertOne(idea);

    res.send(result);
  } catch (error) {
    res.status(500).send({
      message: "Failed to add idea",
      error: error.message,
    });
  }
});

app.put("/ideas/:id", async (req, res) => {
  try {
    await connectDB();

    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).send({ message: "Invalid idea id" });
    }

    const updatedIdea = {
      ...req.body,
      updatedAt: new Date(),
    };

    const result = await ideasCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedIdea }
    );

    res.send(result);
  } catch (error) {
    res.status(500).send({
      message: "Failed to update idea",
      error: error.message,
    });
  }
});

app.delete("/ideas/:id", async (req, res) => {
  try {
    await connectDB();

    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).send({ message: "Invalid idea id" });
    }

    const result = await ideasCollection.deleteOne({
      _id: new ObjectId(id),
    });

    res.send(result);
  } catch (error) {
    res.status(500).send({
      message: "Failed to delete idea",
      error: error.message,
    });
  }
});

app.get("/comments/:ideaId", async (req, res) => {
  try {
    await connectDB();

    const { ideaId } = req.params;

    const comments = await commentsCollection
      .find({ ideaId })
      .sort({ createdAt: -1 })
      .toArray();

    res.send(comments);
  } catch (error) {
    res.status(500).send({
      message: "Failed to load comments",
      error: error.message,
    });
  }
});

app.get("/my-interactions", async (req, res) => {
  try {
    await connectDB();

    const { email } = req.query;

    if (!email) {
      return res.status(400).send({ message: "Email is required" });
    }

    const comments = await commentsCollection
      .find({ userEmail: email })
      .sort({ createdAt: -1 })
      .toArray();

    res.send(comments);
  } catch (error) {
    res.status(500).send({
      message: "Failed to load interactions",
      error: error.message,
    });
  }
});

app.post("/comments", async (req, res) => {
  try {
    await connectDB();

    const comment = {
      ...req.body,
      createdAt: new Date(),
    };

    const result = await commentsCollection.insertOne(comment);

    res.send(result);
  } catch (error) {
    res.status(500).send({
      message: "Failed to add comment",
      error: error.message,
    });
  }
});

app.put("/comments/:id", async (req, res) => {
  try {
    await connectDB();

    const { id } = req.params;
    const { commentText } = req.body;

    if (!isValidId(id)) {
      return res.status(400).send({ message: "Invalid comment id" });
    }

    if (!commentText) {
      return res.status(400).send({ message: "Comment text is required" });
    }

    const result = await commentsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          commentText,
          updatedAt: new Date(),
        },
      }
    );

    res.send(result);
  } catch (error) {
    res.status(500).send({
      message: "Failed to update comment",
      error: error.message,
    });
  }
});

app.delete("/comments/:id", async (req, res) => {
  try {
    await connectDB();

    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).send({ message: "Invalid comment id" });
    }

    const result = await commentsCollection.deleteOne({
      _id: new ObjectId(id),
    });

    res.send(result);
  } catch (error) {
    res.status(500).send({
      message: "Failed to delete comment",
      error: error.message,
    });
  }
});

module.exports = app;

if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`IdeaVault server running on port ${port}`);
  });
}