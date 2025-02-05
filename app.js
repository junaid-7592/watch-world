const express = require("express");
const app = express();
const path = require("path");
const session=require("express-session");
const passport=require("./config/passport");
require("dotenv").config();
const db = require("./config/db");
const userRouter = require("./routes/userRouter");
const adminRouter=require("./routes/adminRouter");
const userlog = require("./middlewares/userlogin");
const flash = require('connect-flash');



db();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret:process.env.SESSION_SECRET,
  resave:false,
  saveUninitialized:true,
  cookie:{
    secure:false,
    httpOnly:true,
    maxAge:72*60*60*1000
  }
}))


// const flash = require('connect-flash');
app.use(flash());



//passport initialise
app.use(passport.initialize())
app.use(passport.session());

app.use((req,res,next)=>{
  res.set('cache-control','no-store')
  next();
});

// Set the view engine
app.set("view engine", "ejs");

// Set the views directory - Choose the correct one
app.set("views",[
  path.join(__dirname,"views/user"),
  path.join(__dirname,"views/admin")
]) 

app.use(express.static(path.join(__dirname, "public")));
app.use("/profile", express.static(path.resolve(__dirname, "public")));

// Use routers
app.use(userlog) 
     

app.use("/", userRouter);
app.use("/admin",adminRouter);  
 
app.listen(process.env.PORT, () => {      
  console.log(process.env.LOCAL_HOST);
});

module.exports = app;                                  
            
                                                                                 

          