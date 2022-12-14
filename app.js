
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const port = 3000;

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect('mongodb://localhost:27017/userDB');
const { Schema } = mongoose;

const userSchema = new Schema({
    email: String,
    password: String
});

const secret = "Thisisourlittlesecret";
userSchema.plugin(encrypt, { secret: secret, encryptedFields: ['password'] });

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

app.post("/register", (req, res) =>{
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });
    newUser.save()
    .then(() => res.render("secrets"))
    .catch(() => console.log(err));
});

app.post("/login", (req, res) =>{
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({ email: username })
//   .then((data) => {
//     res.status(200).json({
//         text: "User found",
//         data: data
//     });
// })
  .then(foundUser => {
    if (foundUser.password === password){
      res.render("secrets")
    }
  })
  .catch(() => console.log("error"))
});



// --------------------------------------------------------------------------
app.listen(port, (req, res) => {
  console.log("App is running on port " + port);
});
