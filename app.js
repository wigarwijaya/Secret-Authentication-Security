require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const port = 3000;

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://localhost:27017/userDB");
const { Schema } = mongoose;

const userSchema = new Schema({
  email: String,
  password: String,
});

const User = mongoose.model("User", userSchema);

// --------------------------------------------------------------------------
app.get("/", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
    const newUser = new User({
      email: req.body.username,
      password: hash,
    });
    newUser
      .save()
      .then(() => res.render("secrets"))
      .catch(() => console.log(err));
  });
});

app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({ email: username })
    //   .then((data) => {
    //     res.status(200).json({
    //         text: "User found",
    //         data: data
    //     });
    // })
    .then((foundUser) => {
      // Load hash from your password DB.
      bcrypt.compare(password, foundUser.password)
      .then((result) => res.render("secrets", console.log("Login Successfully!")))
      .catch(() => console.log("login failed"));
    })
    .catch((err) => console.log(err));
});

// --------------------------------------------------------------------------
app.listen(port, (req, res) => {
  console.log("App is running on port " + port);
});
