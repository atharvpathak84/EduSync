if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
// Importing Libraies that we installed using npm
const express = require("express");
const app = express();
const bcrypt = require("bcrypt"); // Importing bcrypt package
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const ChannelModel = require("./models/channel");
const LocalStrategy = require("passport-local").Strategy;
const { MongoClient } = require('mongodb');

//to use images of root directories
app.use(express.static("views"));
// set the view engine to ejs
app.set("view engine", "ejs");
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

//connection for student dashboard
const client = new MongoClient(dbUrl);

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
        if (student === null) {
          return done(null, false, {
            message: "Invalid Credentials !!!",
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
        if (teacher === null) {
          return done(null, false);
        }
        if (password === teacher.password) {
          return done(null, teacher);
        } else {
          return done(null, false, { message: "Password Incorrect" });
        }
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
  passport.authenticate(["student", "teacher"], {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

// Configuring the register post functionality
app.post("/register", async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const userPresent = await ChannelModel.countDocuments({email:req.body.email},{limit:1});
    console.log(userPresent)
    if(!userPresent){
      var model = new ChannelModel();
      (model.name = req.body.name),
      (model.email = req.body.email),
      (model.password = hashedPassword),
      (model.id = Date.now().toString()),
      (model.userType = "student");

      model
        .save()
        .then(() => {
          console.log("User added to the database");
        })
        .catch((err) => {
          console.log(err);
        });
    }

    res.redirect("/login");
  } catch (e) {
    console.log(e);
    res.redirect("/register");
  }
});

//for accessing the form inputs for later use
var dayInput1;
var timeslotInput1;

app.post("/dashboard", async function(req, res) {
  try {
    const dayInput = req.body.day;
    const timeslotInput = req.body.timeSlot;

    dayInput1 = dayInput;
    timeslotInput1 = timeslotInput;

    // Perform necessary operations with dayInput and timeslotInput
    // Retrieve modal data from the backend
    const modalData = await fetchModalData(dayInput, timeslotInput);

    res.json({ modalData: modalData });
  } catch (error) {
    // Handle errors
    console.log(error);
    res.status(500).json({ error: "An error occurred" });
  }
});

// Function to fetch modal data based on dayInput and timeslotInput
async function fetchModalData(dayInput, timeslotInput) {
  try {
    await client.connect();
    const database = client.db('Login');
    const collection = database.collection('schedules');

    const modalData = await collection.find({
      [`lectures.${dayInput}.${timeslotInput}`]: {
        "$exists": true
      }
    }).toArray();

    // Return the modal data as an array of objects
    return modalData;
  } catch (error) {
    // Handle errors
    console.log(error);
    return null;
  }
}

// Routes
app.post("/modalForm",async (req,res)=>{
  try{
    const chosenOption = req.body.inlineFormCustomSelect;
    console.log('Chosen Option:', chosenOption);

    await client.connect();
    const database = client.db('Login');
    const collection = database.collection('datas');

    const result = await collection.findOneAndUpdate(
      { 
        [`timetable.${dayInput1}.${timeslotInput1}`]: { "$exists": true }
      },
      { 
        $set: { [`timetable.${dayInput1}.${timeslotInput1}.TEACHER`]: chosenOption }
      },
      { 
        returnOriginal: false 
      }
    );
      
   console.log(result);
    
   res.redirect("/dashboard");
  }catch(e){
    console.log(e);
  }
})

app.get("/dashboard",async (req, res) => {
  if (req.isAuthenticated()) {
    if (req.user instanceof Student) {
      // Render student dashboard
      try {
        await client.connect();
        const database = client.db('Login');
        const collection = database.collection('datas');
        const data = await collection.findOne();

        res.render('studentd', {timetable: data.timetable});
      } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
      } finally {
        await client.close();
      }
    
  } else if (req.user instanceof Teacher) {
      // Render teacher dashboard
      try {
        await client.connect();
        const database = client.db('Login');
        const collection = database.collection('schedules');
        const data = await collection.findOne({email:req.user.email});
        
        res.render("teacherdbsh",{ name: data.name, timetable: data.lectures ,modalData : null})
      } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
      } finally {
        await client.close();
      }
      
    } else {
      // User type not recognized
      res.status(400).send("Invalid user type");
    }
  } else {
    // User not authenticated, redirect to login
    res.redirect("/login");
  }
});

app.get("/login", (req, res) => {
  res.render("loginr.ejs");
});

app.get("/", (req, res) => {
  res.render("index.ejs");
});

// End Routes
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

//Author : Manish Choudhary
//Author : Manish Choudhary