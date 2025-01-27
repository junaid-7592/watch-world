const express = require("express");
const router = express.Router();
const userController = require("../controllers/user/userController");
const passport = require("passport");
const profileController=require("../controllers/user/profileController")
const productController = require('../controllers/user/productCondroller')
const auth = require('../middlewares/auth')
// const {adminAuth,userAuth}=require("../middlewares/auth")


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
// router.get("/auth/google/callback", passport.authenticate('google', {failureRedirect: '/signup'}), async (req, res) => {
//     res.redirect('/')
// })
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
router.get('/auth/google/callback',
    (req, res, next) => {
        console.log("from google auth");
        
        passport.authenticate('google', (err, user, info) => {
            console.log("1");
            
            if (err || !user) {
                // Render the signup page with the error message
                const errorMessage = info?.message || "An error occurred during authentication";
            console.log(user,err);
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
//profile manegment

router.get("/forgot-password",profileController.getForgotPassPage)
router.post("/forgot-email-valid",profileController.forgotEmailValid)
router.post("/VerifyOtp-changepassword",profileController.verifyOtpChangePasswordPage)





router.get("/productinfo",productController.productDetails)


// router.get("/userprofile",userAuth,profileController.userProfile);
router.get("/profile",auth.userAuth,profileController.userProfile)


router.get("/change-password",auth.userAuth,profileController.changePassword)
router.post("/change-password",auth.userAuth,profileController.changePasswordValid)

router.post("/passwordResendOtp",auth.userAuth,profileController.passwordResendOtp)


router.post("/conformation-forgotpass",auth.userAuth,profileController.coformationForgotpassword)





                                                         
module.exports = router;                                     