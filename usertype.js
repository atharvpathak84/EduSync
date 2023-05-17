// Required modules
const mongoose = require("mongoose");
const express = require("express");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const app = express();
const flash = require("express-flash");
const methodOverride = require("method-override");
const bcrypt = require("bcrypt"); // Importing bcrypt package

//to use images of root directories
app.use(express.static("views"));
app.set("view engine", "ejs");

const uri =
  "mongodb+srv://admin:1234@edusync.wqxjxy2.mongodb.net/Login?retryWrites=true&w=majority";

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("Connected to MongoDB Atlas");
  })
  .catch((err) => {
    console.error(err);
    mongoose.connection.close();
  });

// Define Student schema and model
const studentSchema = new mongoose.Schema({
  email: String,
  password: String,
});

const Student = mongoose.model("Student", studentSchema, "teachers");

// Define Teacher schema and model
const teacherSchema = new mongoose.Schema({
  email: String,
  password: String,
});

const Teacher = mongoose.model("Teacher", teacherSchema, "schedules");

// studentSchema.methods.comparePassword = function (password) {
//   // Compare the provided password with the stored password
//   return bcrypt.compareSync(password, this.password);
// };

// teacherSchema.methods.comparePassword = function (password) {
//   // Compare the provided password with the stored password
//   return bcrypt.compareSync(password, this.password);
// };

// Configure Passport
passport.use(
  "student",
  new LocalStrategy(
    {
      usernameField: "email", // Assuming email as the username field
      passwordField: "password", // Assuming password as the password field
    },
    async (username, password, done) => {
      try {
        const student = await Student.findOne({ email: username });
        console.log(student);
        if (student === null) {
          return done(null, false, {
            message: "No user found with that email",
          });
        }
        if (await bcrypt.compare(password, student.password)) {
          return done(null, student);
        } else {
          return done(null, false, { message: "Password Incorrect" });
        }
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.use(
  "teacher",
  new LocalStrategy(
    {
      usernameField: "email", // Assuming email as the username field
      passwordField: "password", // Assuming password as the password field
    },
    async (username, password, done) => {
      try {
        const teacher = await Teacher.findOne({ email: username });
        console.log(teacher);
        if (teacher === null) {
          return done(null, false, {
            message: "No user found with that email",
          });
        }
        if (!(password === teacher.password)) {
          return done(null, false, {
            message: "Incorrect password",
          });
        }
        return done(null, teacher);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const student = await Student.findById(id);
    if (student) {
      return done(null, student);
    }
    const teacher = await Teacher.findById(id);
    if (teacher) {
      return done(null, teacher);
    }
    done(new Error("User not found"));
  } catch (error) {
    done(error);
  }
});

// Express middlewares
app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to the login page");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.post(
  "/login",
  passport.authenticate(["student", "teacher"], {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

app.get("/dashboard", (req, res) => {
  if (req.isAuthenticated()) {
    if (req.user instanceof Student) {
      // Render student dashboard
      res.render("student");
    } else if (req.user instanceof Teacher) {
      // Render teacher dashboard
      res.send(
        `Welcome Teacher: ${req.user.email}. This is the teacher dashboard.`
      );
    } else {
      // User type not recognized
      res.status(400).send("Invalid user type");
    }
  } else {
    // User not authenticated, redirect to login
    res.redirect("/login");
  }
});

app.delete("/logout", (req, res) => {
  req.logout(req.user, (err) => {
    if (err) return next(err);
    res.redirect("/login");
  });
});

// set port, listen for requests
const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log(`Server is running on port ${PORT}.`);
});
