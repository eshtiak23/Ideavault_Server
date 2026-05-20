const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const {
  MongoClient,
  ServerApiVersion,
  ObjectId,
} = require("mongodb");

const app = express();

const port = process.env.PORT || 5000;


// middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

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


// main function
async function run() {

  try {

    // connect mongodb
    await client.connect();

    console.log("MongoDB Connected Successfully");


    // database & collections
    const database = client.db("ideaVaultDB");

    const ideasCollection = database.collection("ideas");

    const commentsCollection = database.collection("comments");



    // =========================
    // GET ALL IDEAS
    // =========================

    app.get("/ideas", async (req, res) => {

      const result = await ideasCollection
        .find()
        .sort({ createdAt: -1 })
        .toArray();

      res.send(result);

    });



    // =========================
    // GET SINGLE IDEA
    // =========================

    app.get("/ideas/:id", async (req, res) => {

      const id = req.params.id;

      const query = {
        _id: new ObjectId(id),
      };

      const result = await ideasCollection.findOne(query);

      res.send(result);

    });



    // =========================
    // TRENDING IDEAS
    // =========================

    app.get("/trending-ideas", async (req, res) => {

      const result = await ideasCollection
        .find()
        .sort({ createdAt: -1 })
        .limit(6)
        .toArray();

      res.send(result);

    });



    // =========================
    // ADD NEW IDEA
    // =========================

    app.post("/ideas", async (req, res) => {

      const idea = req.body;

      idea.createdAt = new Date();

      const result = await ideasCollection.insertOne(idea);

      res.send(result);

    });



    // =========================
    // UPDATE IDEA
    // =========================

    app.put("/ideas/:id", async (req, res) => {

      const id = req.params.id;

      const updatedIdea = req.body;

      const query = {
        _id: new ObjectId(id),
      };

      const updateDoc = {
        $set: updatedIdea,
      };

      const result = await ideasCollection.updateOne(
        query,
        updateDoc
      );

      res.send(result);

    });



    // =========================
    // DELETE IDEA
    // =========================

    app.delete("/ideas/:id", async (req, res) => {

      const id = req.params.id;

      const query = {
        _id: new ObjectId(id),
      };

      const result = await ideasCollection.deleteOne(query);

      res.send(result);

    });



    // =========================
    // ADD COMMENT
    // =========================

    app.post("/comments", async (req, res) => {

      const comment = req.body;

      comment.createdAt = new Date();

      const result = await commentsCollection.insertOne(comment);

      res.send(result);

    });



    // =========================
    // GET COMMENTS BY IDEA ID
    // =========================

    app.get("/comments/:ideaId", async (req, res) => {

      const ideaId = req.params.ideaId;

      const result = await commentsCollection
        .find({ ideaId: ideaId })
        .sort({ createdAt: -1 })
        .toArray();

      res.send(result);

    });



    // =========================
    // UPDATE COMMENT
    // =========================

    app.put("/comments/:id", async (req, res) => {

      const id = req.params.id;

      const updatedComment = req.body;

      const query = {
        _id: new ObjectId(id),
      };

      const updateDoc = {
        $set: updatedComment,
      };

      const result = await commentsCollection.updateOne(
        query,
        updateDoc
      );

      res.send(result);

    });



    // =========================
    // DELETE COMMENT
    // =========================

    app.delete("/comments/:id", async (req, res) => {

      const id = req.params.id;

      const query = {
        _id: new ObjectId(id),
      };

      const result = await commentsCollection.deleteOne(query);

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


   app.post("/jwt", async (req, res) => {

  const user = req.body;

  const token = jwt.sign(
    user,
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "7d",
    }
  );

  res
    .cookie("token", token, {
      httpOnly: true,
      secure: false,
    })
    .send({ success: true });

});



    // =========================
    // ROOT ROUTE
    // =========================

    app.get("/", (req, res) => {

      res.send("IdeaVault server is running");

    });

  }

  finally {

  }

}


// run server
run().catch(console.dir);



// server listen
app.listen(port, () => {

  console.log(`IdeaVault server running on port ${port}`);

});