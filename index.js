const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI;

// Create Mongo Client
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

    // test route
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