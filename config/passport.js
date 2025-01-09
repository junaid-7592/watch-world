const passport=require('passport');
//passport strategi import

const GoogleStrategy=require("passport-google-oauth20").Strategy;
const User=require("../models/userSchema");
const env=require("dotenv").config();


passport.use(new GoogleStrategy({
    clintID:process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,

}))
