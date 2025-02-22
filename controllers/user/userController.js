
const express = require("express");
const app = express();


app.use(express.json()); // J
app.use(express.urlencoded({ extended: true })); 

const User=require("../../models/userSchema")
const Category=require("../../models/category");   //or categorySchema
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
        const  user=req.session.user;
        const categories=await Category.find({isListed:true}); 
        let productData=await product.find(
          
            {isBlocked:false,
                category:{$in:categories.map(category=>category._id)},quantity:{$gt:0}
            }
        )

        
        productData =productData.slice(0)    
    
        // console.log(productData)clear
           

        const message = req.message || null;
        if(user){
         const userData=await User.findOne({_id:user._id}) ;
         res.render("home",{user:userData, products:productData , message : message})  
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
}



const resendOtp=async(req,res)=>{
    try{
        const{email}=req.session.userData;
        if(!email){
           return res.status(400).json({success:false,message:"Email not found in session"})
        }

        const otp=generateOtp();
        req.session.userOtp=otp; //otp assign to session


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

const shopget = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 8;
        const skip = (page - 1) * limit;
        
        const categories = await Category.find({ isListed: true });
        const categoryFilter = req.query.category;
        
        let filterQuery = {
            isBlocked: false,
            quantity: { $gt: 0 }
        };

        if (categoryFilter && categoryFilter !== 'all') {
            // Find category by name instead of value
            const selectedCategory = await Category.findOne({ 
                name: categoryFilter,
                isListed: true 
            });
            
            if (selectedCategory) {
                filterQuery.category = selectedCategory._id;
            }
        }

        const totalProducts = await product.countDocuments(filterQuery);
        const totalPages = Math.ceil(totalProducts / limit);
        
        const productData = await product.find(filterQuery)
            .skip(skip)
            .limit(limit)
            .populate('category');

        const categoryOptions = categories.map(cat => ({
            value: cat.name, // Use name instead of value
            name: cat.name,
            selected: cat.name === categoryFilter
        }));

        return res.render("shop", { 
            product: productData,
            currentPage: page,
            totalPages,
            categories,
            categoryOptions,
            selectedCategory: categoryFilter
        });
    } catch (error) {
        console.error(error);
        return res.status(500).render("error", { message: "An error occurred while fetching products" });
    }
};
// const Product = require("../models/Product");

const categoryFilter = async (req,res) =>{
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 8;
        const skip = (page - 1) * limit;
        
        let filterQuery = {
            isBlocked: false,
            quantity: { $gt: 0 }
        };

        if (req.query.category && req.query.category !== 'all') {
            const selectedCategory = await Category.findOne({ 
                name: req.query.category,
                isListed: true 
            });
            
            if (selectedCategory) {
                filterQuery.category = selectedCategory._id;
            }
        }

        const totalProducts = await product.countDocuments(filterQuery);
        const totalPages = Math.ceil(totalProducts / limit);
        
        const products = await product.find(filterQuery)
            .skip(skip)
            .limit(limit)
            .populate('category');

        res.json({
            success: true,
            products,
            currentPage: page,
            totalPages
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            success: false, 
            message: "Error fetching products" 
        });
    }
}


// Controller function for sorting products
const getSortedProducts = async (req, res) => {
    try {       
        



        let { sort } = req.query;
        console.log("sortssssssssssssssss",sort)
        let sortQuery = {};

        switch (sort) {
            case "popularity":
                sortQuery = { rating: -1 }; // Highest rating first
                break;
            case "low-to-high":
                sortQuery = {salePrice: 1 }; // Price ascending
                break;
            case "high-to-low":
                sortQuery = { salePrice: -1 }; // Price descending
                break;
            case "average-ratings":
                sortQuery = { rating: -1 }; // Highest rating first
                break;
            // case "featured":
            //     sortQuery = { featured: -1 }; // Show featured products first
            //     break;
            case "new-arrivals":
                sortQuery = { createdAt: -1 }; // Latest products first
                break;
            case "a-z":
                sortQuery = { productName: 1 }; // Alphabetical order
                break;
            case "z-a":
                sortQuery = { productName: -1 }; // Reverse alphabetical order
                break;
        }
        const products = await product.find().sort(sortQuery);
        console.log("hooooooooooooooooo",products)

        res.json(products);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch products" });
        console.log(error);
        
    }
};



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
    getSortedProducts ,
    categoryFilter,
} ;                                                   


                                     
