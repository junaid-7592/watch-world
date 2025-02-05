const express = require("express");
const router = express.Router();
const userController = require("../controllers/user/userController");
const passport = require("passport");
const profileController=require("../controllers/user/profileController")
const productController = require('../controllers/user/productCondroller')
const auth = require('../middlewares/auth')
// const Cart = require("../models/cart");
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
router.get("/products",userController.getSortedProducts);

//profile manegment

router.get("/forgot-password",profileController.getForgotPassPage)
router.post("/forgot-email-valid",profileController.forgotEmailValid)
router.post("/VerifyOtp-changepassword",profileController.verifyOtpChangePasswordPage)
router.get("/profile/orders/view/:orderId",profileController.orderViewLoad)





router.get("/productinfo",productController.productDetails)


// router.get("/userprofile",userAuth,profileController.userProfile);
router.get("/profile",auth.userAuth,profileController.userProfile)


router.get("/profile/change-password",auth.userAuth,profileController.changePassword)
router.post("/change-password",auth.userAuth,profileController.changePasswordValid)

router.post("/passwordResendOtp",auth.userAuth,profileController.passwordResendOtp)

 
router.post("/conformation-forgotpass",auth.userAuth,profileController.coformationForgotpassword)


//address managment
router.get("/addAddress",auth.userAuth,profileController.addAddress)
router.post("/addAddress",auth.userAuth,profileController.postAddAddress)
router.get("/editAddress",auth.userAuth,profileController.editAddress)   
router.post("/editAddress",auth.userAuth,profileController.postEditAddress)   
 

 
router.delete("/deleteAddress", auth.userAuth, profileController.deleteAddress);




router.get("/addAddressFromcheckout",auth.userAuth,profileController.addresspageShow)
router.post("/addAddressFromcheckout",auth.userAuth,profileController.postaddressAdd)
    

//cart manegment

 router.post("/cart/add",auth.userAuth,productController.addTocart)
 router.get("/Cart",productController.getCart)
router.post("/update-cart/:itemId",productController.cartUpdate)   //dynamic route
router.post("/cart-updateTotal",productController.updateTotel)
router.get('/checkout',productController.getCheckout)
router.get('/orderSuccess',auth.userAuth,productController.getOrderSuccess)
router.post('/orderSuccess',auth.userAuth,productController.OrderSuccess)
router.post('/order/cancel/:orderId',auth.userAuth,productController.cancelOrder)




router.post('/removeCartItem/:cartId/:itemId',productController.removeCartItem)

                                                         
module.exports = router;                                                  