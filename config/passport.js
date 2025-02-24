
const passport = require('passport');
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/userSchema");
require("dotenv").config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'https://junaid-puttekkadavan.site/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Search for the user with the Google ID
        let user = await User.findOne({ googleId: profile.id });
        if(user?.isBlocked===true){
            // if (user?.isBlocked === true) {
                return done(null, false, { message: "User is blocked" }); // Pass custom error message
            // }
        }
        if (user) {
            return done(null, user); // If user found, proceed to next step
        } else {
            // If user is not found, create a new user
            user = new User({
                name: profile.displayName,
                email: profile.emails[0].value,
                googleId: profile.id
            });

            await user.save();
            return done(null, user); // Return the newly created user
        }
    } catch (error) { 
        // Log the error
        return done(error, null); // Pass the error to done
    }
}));
 

//seesenlot user detials assign cheyan 
//passpot serialise cheyyunnu                    

passport.serializeUser((user,done)=>{
    // console.log("asdjhfbasd,fbasdk.++++++++++++++++")
    done(null,user.id)
})


//sessin  nn user data feach cheyth edukkan 

passport.deserializeUser((id,done)=>{
  
    User.findById(id)
    .then(user=>{
        done(null,user)
    })
    .catch(err=>{
        done(err,null)
    })
})

module.exports=passport;
                                                  
                   