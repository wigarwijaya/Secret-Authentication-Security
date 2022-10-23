require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

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
  googleId: String,
  secret: { type: Array }
});

//hash password using passport-local-mongoose plugin
userSchema.plugin(passportLocalMongoose);
//find or create using mongoose-findorcreate plugin
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

//create passport local strategy
passport.use(User.createStrategy());

//serialize and deserialize user
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

//configure strategy (OAuth)
passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
  scope: [ 'profile' ],
  state: true
},
function(accessToken, refreshToken, profile, cb) {
  console.log(profile);

  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

// --------------------------------------------------------------------------
app.get("/", (req, res) => {
  res.render("home");
});

app.get("/auth/google", passport.authenticate('google', { scope: ['profile'] })
);

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect('/secrets');
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
      console.log("Logged Out")
      res.redirect("/");
  });
});

app.get("/secrets", (req, res) => {
  User.find({})
  .then(foundUser => {
    // console.log(foundUser)
    let data = foundUser;
    let items = []
    data.forEach(item => {
      console.log(item.secret)
      return items.push(item.secret)
    })
    console.log("ini adalah array " + items)
    res.render("secrets", {userWithSecrets: items, isAuth: req.isAuthenticated()})
  })
  .catch(err => console.log(err))
});

app.get("/submit", (req, res) =>{
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit", async (req, res) =>{
  const submittedSecret = await req.body.secret;
  console.log(req.user.id);
  console.log(req.body.secret);

  User.findById(req.user.id)
  .then(foundUser => {
    foundUser.secret.push(submittedSecret);
    foundUser.save(() => {
      res.redirect("/secrets")
  })
})
  .catch((err) => console.log("ini error " + err))
})

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

