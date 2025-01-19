
const express = require("express");
const app = express();


app.use(express.json()); // J
app.use(express.urlencoded({ extended: true })); 

const User=require("../../models/userSchema")
const Category=require("../../models/category");
const product=require("../../models/productSchema");

const env=require("dotenv").config();
const nodemailer=require("nodemailer");
const bcrypt=require("bcrypt");




 

const pageNotFound=async(req,res)=>{
    try{
      res.render("page-404")

    }catch(error){
        res.redirect("/pageNotFound")
    }
}
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const findUser = await User.findOne({ isAdmin: 0, email: email });

        if (!findUser) {
            return res.render("login", { message: "User not found" });
        }

        if (findUser.isBlocked) {
            return res.render("login", { message: "User is blocked by admin" });
        }

        const passwordMatch = await bcrypt.compare(password, findUser.password); // Correct spelling: bcrypt.compare
        if (!passwordMatch) {
            return res.render("login", { message: "Incorrect password" });
            

        }

        req.session.user = findUser._id;  
        return res.redirect("/");  

    } catch (error) {
        console.error("login error", error);
        
        return res.render("login", { message: "Login failed, please try again later" });  // Send one response only
    }
};
const loadlogin = async (req, res) => {
    try {
        if (!req.session.user) {
            const message = req.session?.error || ""; 
            delete req.session?.error; 
            return res.render("login", { message }); 
        } else {
            return res.redirect("/");
        }
    } catch (error) {
        console.error("Error loading login:", error);
        
        return res.status(500).send('Server Error');
    }
};


const logout= async(req,res)=> {

 req.session.destroy((err)=>{
    if(err){
      return res.redirect("/")
    }
    res.redirect("/")
  })
}


const loadSignup=async(req,res)=>{
    try{
        if(!req.session.user){
            const message=req.seession?.error||"";
            delete req.seesion?.error;
            return res.render("signup",{message});
        }else{
            return res.redirect("/");
        }
        
    
    }catch(error){
        console.error("signup page not loadding:",error);
       return res.status(500).send('Server Error');
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
        const user=req.session.user;
        // const categories=await Category.find({isListed:true});
        // let productData=await product.find({
            // isBlocked:false,
            // category:{$in:categories.map(category=>category._id)},quantity:{$gt:0}
        // })

    //   productData.sort((a,b)=>new Date(b.createdOn)-new Date(a.createdOn));
    //   productData=productData.slice(0,4);
        const categories=await Category.find({isListed:true});
        let productData=await product.find({
            isBlocked:false,
            category:{$in:categories.map(category=>category._id)},quantity:{$gt:0}
        })
        // console.log(productData)clear
        


        if(user){
         const userData=await User.findOne({_id:user._id}) ;
         res.render("home",{user:userData, products:productData})  
        }else{
            return res.render("home",{products:productData});
        }
    }catch(error){
        console.log(error)
      console.log("home page not found");
      res.status(500).send("Server error")
    }  
}



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
        
        if(password !== ConfirmPassword){
            return res.render("signup",{message:"password do not match"});

        }
        // console.log(1)
        
        const findUser=await User.findOne({email});
        // console.log(findUser);
        
        // console.log(email)
        if(findUser){
            console.log('EXIST')
            return res.render("signup",{message:"User with this email already exists"})
        }
        const otp =generateOtp();
        // console.log(2)
        const emailSent=await sendVerificationEmail(email,otp);

        // console.log("OTP send",otp )

        // console.log(emailSent)

        if(!emailSent){
            return res.json("email-error")
        }
        console.log('this is your otp: ',otp)
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
        const { otp } = req.body; 
        console.log("Input OTP:", otp);

        if (otp === req.session.userOtp) { 
            

            const user = req.session.userData;
            const passwordHash = await securePassword(user.password);

            const saveUserData = new User({
                name: user.name,
                email: user.email,
                password: passwordHash,
            });  

            await saveUserData.save();
            req.session.user = saveUserData._id;

            res.json({ success: true, redirectUrl: "/" }); 
        } else {
            res.status(400).json({ success: false, message: "Invalid OTP, please try again" });
            // console.log("invalidotp")
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

const shopget= async(req,res)=>{
    
       
    try {
        const categories=await Category.find({isListed:true});
        let productData=await product.find({
            isBlocked:false,
            category:{$in:categories.map(category=>category._id)},quantity:{$gt:0}
        })   
        return res.render("shop",{product:productData})
    } catch (error) {
        console.log(`eroor ocur on the ${error}`)
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
    login,
    logout,
    shopget,
} ;                                                   


                                     
