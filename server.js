if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// Importing Libraies that we installed using npm
const express = require("express");
const app = express();
const bcrypt = require("bcrypt"); // Importing bcrypt package
const passport = require("passport");
const initializePassport = require("./passport-config");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const ChannelModel = require("./models/channel");

initializePassport(
  passport,
  (email) => ChannelModel.findOne({email : email}),
  (id) => ChannelModel.findOne({id : id})
);

//to use images of root directories
app.use( express.static( "views" ) );

// set the view engine to ejs
app.set('view engine', 'ejs');

// parse requests of content-type - application/json
app.use(express.json());

// database url
const dbUrl =
  "mongodb+srv://admin:1234@edusync.wqxjxy2.mongodb.net/Login?retryWrites=true&w=majority";

// connection parameters
const connectionParams = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

//connection to MongoDb Atlas
mongoose
  .connect(dbUrl, connectionParams)
  .then(() => {
    console.info("Connected to the DB");
  })
  .catch((e) => {
    console.log("Error: ", e);
  });

// get a reference to the collection you want to export
// const emailTeachers = mongoose.connection.collection(schedules);

app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false, // We wont resave the session variable if nothing is changed
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));

// Configuring the register post functionality
app.post(
  "/login",
  checkNotAuthenticated,
  passport.authenticate("local", {
    successRedirect: "/index",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

// Configuring the register post functionality
app.post("/register", checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    var model = new ChannelModel();
      (model.name = req.body.name),
      (model.email = req.body.email),
      (model.password = hashedPassword);
      (model.id = Date.now().toString())

    model
      .save()
      .then(() => {
        console.log("User added to the database")
      })
      .catch((err) => {
        console.log(err);
      });

    res.redirect("/login");
  } catch (e) {
    console.log(e);
    res.redirect("/register");
  }
});

// Routes
app.get("/index", checkAuthenticated, (req, res) => {
  res.render("index.ejs", { name: req.user.name });
});

app.get("/login", checkNotAuthenticated,async (req, res) => {
  res.render("login.ejs");
});

app.get("/register", checkNotAuthenticated, (req, res) => {
  res.render("register.ejs");
});

app.get("/", checkNotAuthenticated, (req, res) => {
  res.render("home.ejs");
});
// End Routes

// app.delete('/logout', (req, res) => {
//     req.logOut()
//     res.redirect('/login')
//   })

app.delete("/logout", (req, res) => {
  req.logout(req.user, (err) => {
    if (err) return next(err);
    res.redirect("/login");
  });
});

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

function checkNotAuthenticated(req, res, next) {
  // if (req.isAuthenticated()) {
  //   return res.redirect("/index");
  // }
  next();
}

// set port, listen for requests
const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log(`Server is running on port ${PORT}.`);
});

