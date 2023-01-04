require("dotenv").config();

const express = require("express");
const cors = require("cors");
const app = express();

const port = process.env.PORT || 8080;
const uri = process.env.URI;

const client = new MongoClient(uri);
const { v4: uuidv4 } = require("uuid");
const { MongoClient } = require("mongodb");
app.use(cors());
app.use(express.json());

let endpointFilled = false;

app.post("/api/fill", async (req, res) => {
  if (endpointFilled) {
    res.status(400).send("Endpoint has already been filled");
    return;
  }

  const response = await fetch("https://jsonplaceholder.typicode.com/users");
  const data = await response.json();

  const users = data.map(function (user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      address: {
        street: user.address.street,
        suite: user.address.suite,
        city: user.address.city,
        zipcode: user.address.zipcode,
      },
    };
  });

  // Add the new users to the users_db database
  users_db.push(...users);

  endpointFilled = true;

  res.send("Users added to database");
});

function fill(id) {
  // Check if the ID already exists in the database
  if (idExists(id)) {
    console.log(
      "ID already exists in database. Please try again with a different ID."
    );
    return;
  }

  // If the ID does not exist in the database, insert that to it
  database.push({ id: id });
}

app.get("/users/names", async (req, res) => {
  try {
    const con = await client.connect();
    const data = await con
      .db("users_db")
      .collection("users")
      .aggregate([{ $project: { _id: 1, name: 1 } }])
      .toArray();
    await con.close();
    res.send(data);
  } catch (error) {
    res.status(500).send({ error });
  }
});

app.get("/users/emails", async (req, res) => {
  try {
    const con = await client.connect();
    const data = await con.db("users_db").collection("users").find().toArray();
    await con.close();
    res.send(data);
  } catch (error) {
    res.status(500).send({ error });
  }
});

app.get("/users/address", async (req, res) => {
  try {
    const con = await client.connect();
    const data = await con
      .db("users_db")
      .collection("users")
      .aggregate([
        {
          $lookup: {
            from: "address",
            localField: "_id",
            foreignField: "_id",
            as: "address",
          },
        },

        { $unwind: "$address" },
        {
          $project: {
            name: "$name",
            address: "$address",
          },
        },

        { $unset: ["address._id"] },
      ])
      .toArray();
    await con.close();
    res.send(data);
  } catch (error) {
    res.status(500).send({ error });
  }
});

app.listen(port, function () {
  console.log(`Server listening on ${port}`);
});
