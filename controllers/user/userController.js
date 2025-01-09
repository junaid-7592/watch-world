
//inprt user schema
const express = require("express");
const app = express();

// Add Middleware
app.use(express.json()); // JSON data handle cheyyan
app.use(express.urlencoded({ extended: true })); // URL-encoded data (form data) handle cheyyan

const User=require("../../models/userSchema");
const env=require("dotenv").config();
const nodemailer=require("nodemailer");
const bcrypt=require("bcrypt");



//error handling 
const pageNotFound=async(req,res)=>{
    try{
      res.render("page-404")

    }catch(error){
        res.redirect("/pageNotFound")
    }
}


const loadlogin=async(req,res)=>{
    try{
      return res.render('login');
    }catch(error){
        console.log("signup page not loadding:",error);
        res.status(500).send('Server Error');
    }
}


const loadSignup=async(req,res)=>{
    try{
      return res.render('signup',{message:null});
    }catch(error){
        console.log("signup page not loadding:",error);
        res.status(500).send('Server Error');
    }
}


const securePassword=async (password)=>{
    try{
        const passwordHash=await bcrypt.hash(password,10)
        return passwordHash

    }catch(error){

    }
}



const loadHomepage=async(req,res)=>{
    try{
        return res.render("home")
    }catch(error){
      console.log("home page not found");
      res.status(500).send("Server error")
    }  
}


// const signup =async(req,res)=>{
//     const{name,email,password} = req.body;  //confirm password venda karanam frendentnn validation checkkcheyyan vendiyullathan ath so ath db yil stor cheyyanda

//     try {
//         const newUser=new User({name,email,password});  //new user enna verablil data storaakunnu
        
//         await newUser.save()   // ee methord vech data db til stor cheythu
//         console.log(newUser);  
        
//         return res.redirect("/")   //ellam kayinchal  home page lott vidunnu
//     }catch(error){
//       console.error("Error for save user",error);
//       res.status(500).send('internal server error');
//     }
// }

function generateOtp(){
    return Math.floor(100000+Math.random()*900000).toString()
}



async function sendVerificationEmail(email,otp){
    try{
        const transporter=nodemailer.createTransport({
            service:"gmail",
            port:587,
            secure:false,
            auth:{
                user:process.env.NODEMAILER_EMAIL,
                pass:process.env.NODEMAILER_PASSWORD
            }

        })

        const info=await transporter.sendMail({
            from:process.env.NODEMAILER_EMAIL,
            to:email,
            subject:"verify your account",   
            text:`your otp is ${otp}`,
            html:`<b> your otp:${otp}</b>`,

        })

        return info.accepted.length>0    

    }catch(error){
       console.error("error  sending email",error) ;
       return false;
       

    }     
}


const signup= async (req,res)=>{
    try{

        const{name,email,password,ConfirmPassword}=req.body;
        //  console.log(name,password,ConfirmPassword)
        if(password !== ConfirmPassword){
            return res.render("signup",{message:"password do not match"});

        }
        console.log(1)
        
        const findUser=await User.findOne({email});
        console.log(findUser);
        
        // console.log(email)
        if(findUser){
            console.log('EXIST')// check cheyyan
            return res.render("signup",{message:"User with this email already exists"})
        }
        const otp =generateOtp();
        console.log(2)
        const emailSent=await sendVerificationEmail(email,otp);

        // console.log("OTP send",otp )

        // console.log(emailSent)

        if(!emailSent){
            return res.json("email-error")
        }
console.log('this is ',otp)
        req.session.userOtp=otp;
        req.session.userData={name,email,password};   

   
        res.render("verify-otp");
        
    } catch(error){          
        console.error("signup error ",error);
        res.redirect("/pageNotFound")

    }
}

const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body; // JSON format'il OTP edukkan
        console.log("Input OTP:", otp);

        if (otp === req.session.userOtp) { // OTP compare cheyyuka
            // console.log("Session OTP:", req.session.userOtp);

            const user = req.session.userData;
            const passwordHash = await securePassword(user.password);

            const saveUserData = new User({
                name: user.name,
                email: user.email,
                password: passwordHash,
            });  

            await saveUserData.save();
            req.session.user = saveUserData._id;

            res.json({ success: true, redirectUrl: "/" }); // Success response
        } else {
            res.status(400).json({ success: false, message: "Invalid OTP, please try again" });
            console.log("invalidotp")
        }
    } catch (error) {
        console.error("Error Verifying OTP:", error);
        res.status(500).json({ success: false, message: "An error occurred" });
    }
};



const resendOtp=async(req,res)=>{
    try{
        const{email}=req.session.userData;
        if(!email){
           return res.status(400).json({success:false,message:"Email not found in session"})
        }

        const otp=generateOtp();
        req.session.userotp=otp; //otp assign to session

        const emailSent=await sendVerificationEmail(email,otp); // forwerd   email, password
        if(emailSent){
            console.log("resend OTP:",otp);
            res.status(200).json({success:true,message:"OTP Resend Successfuly"})
        }else{
           res.status(500).json({success:false,message:"Failed to resend OTP . please try again"});

        }


}catch(error){
    console.error("Error resend OTP ",error);
    res.status(500).json({success:false,messege:"Internel Server Error.please try again"})

    }
}



      
module.exports={
    loadHomepage,
    pageNotFound,
    loadSignup,
    loadlogin,
    signup,
    verifyOtp,
    resendOtp,
} ;                                          