const express = require("express");
const router = express.Router();
const userController = require("../controllers/user/userController");
const passport = require("passport");


router.get("/pageNotFound", userController.pageNotFound);
router.get("/", userController.loadHomepage);
router.get("/signup", userController.loadSignup);


router.get("/login", userController.loadlogin);
router.post("/login", userController.login);
router.get("/logout", userController.logout);



router.post("/signup", userController.signup);
router.post("/verify-otp", userController.verifyOtp);
router.post("/resend-otp", userController.resendOtp);

router.get("/auth/google", passport.authenticate('google', { scope: ['profile', 'email'] }));  //name email  nn edukkunnu
// router.get('/auth/google/callback', 
//     passport.authenticate('google', { failureRedirect: '/signup' }),
//     (req, res) => {
//       if(req.error){
//         console.log("user error ::"+req.error)
//        return res.redirect("/signup");
//       }
//       req.session.user = req?.user?._id
//       req.session.userData = req.user
//       res.redirect('/')
//     }
//   );
router.get(
    '/auth/google/callback',
    (req, res, next) => {
        passport.authenticate('google', (err, user, info) => {
            if (err || !user) {
                // Render the signup page with the error message
                const errorMessage = info?.message || "An error occurred during authentication";
                return res.redirect('/signup');
            }

            req.logIn(user, (loginErr) => {
                if (loginErr) {
                    return res.redirect('/signup');
                }

                // Store user data in the session
                req.session.user = user._id;
                req.session.userData = user;

                res.redirect('/');
            });
        })(req, res, next);
    }
);

router.get("/shop",userController.shopget)


                                                         
module.exports = router;                      