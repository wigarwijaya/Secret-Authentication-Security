require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const port = process.env.PORT;

// setup application
const app = express();

//setup view engine EJS, body-parser and express-static
app.set("view engine", "ejs");
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

//setup session
// app.set('trust proxy', 1) // trust first proxy
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    // cookie: { secure: true }
  })
);

//initialize passport
app.use(passport.initialize());

//use passport to deal with session
app.use(passport.session());

//connect to database
mongoose.connect("mongodb://localhost:27017/userDB")
.then(() => console.log("Database connected"))
.catch(err => console.log(err));

//create user schema
const { Schema } = mongoose;
const userSchema = new Schema({
  email: String,
  password: String,
});

//hash password using passport-local-mongoose plugin
userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

//create passport local strategy
passport.use(User.createStrategy());

//serialize and deserialize user
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});


// --------------------------------------------------------------------------
app.get("/", (req, res) => {
  res.render("home");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/logout", (req, res) => {
  req.logout((err) => {
      if (err) { 
          console.log(err); 
      }
      res.redirect("/");
  });
});

app.get("/secrets", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.post("/register", async (req, res) => {
  try{
    const registerUser = await User.register({ username: req.body.username }, req.body.password);
    if (registerUser){
      passport.authenticate("local")(req, res, () => {
        res.redirect("/secrets");
      })
    } else {
      res.redirect("/register")
    }
  } catch(err) {
    res.send(err)
  }
});

app.post("/login", (req, res) => {
  //create new user object
  const user = new User({
    username: req.body.username,
    password: req.body.password
  })
  //using passport login method we will check if user credentials are correct or not
  req.login(user, (err) => {
    if (err){
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, () => {
        res.redirect("/secrets");
      });
    }
  });
});

// --------------------------------------------------------------------------
//start the server
app.listen(port, () => {
  console.log("Server is running");
});

