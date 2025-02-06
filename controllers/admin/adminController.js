
//import user model

const Coupon = require('../../models/coupenSchema');
const User=require("../../models/userSchema");
const mongoose=require("mongoose");
const bcrypt=require("bcrypt");   //password compire




const pageerror=async (req,res)=>{
    res.render("admin-error")
}

const loadlogin=(req,res)=>{
    if(req.session.admin){
        return res.redirect("/admin/login")
    }
    res.render("adminlogin",{message:null})  //admin-login
}



const login=async (req,res)=>{
try {
    const{email,password}=req.body;
    console.log(password)
    const admin=await User.findOne({email,isAdmin:true});
    // console.log(admin);
    
    if(admin){
        const passwordMarch= await bcrypt.compare(password,admin.password)

        

        if(passwordMarch){
            req.session.admin=true;
            return res.redirect('/admin')
           }else{
            // return res.redirect("/login")
            return res.redirect("/admin/login?error=Incorrect password");
        }
    }else{
        // return res.status(500).render("login", { message: "Invalid credentials" });
        return res.redirect("/admin/login?error=User not found");

        
    }
} catch (error) {
    console.log("log in error", error)
    return res.redirect("/pageerror")
    
}
}



const loadDashboard=async(req,res)=>{
    if(req.session.admin){
        try {
            res.render("dashbord");
        } catch (error) {
          res.redirect("/pageerror")  
        }
    }

}


const logout=async(req,res)=>{
    try {
     req.session.destroy(err=>{
        if(err){
            console.log("Error destroying session",err);
            return res.redirect("/pageerror")
        }
        res.redirect("/admin/login")
     })

      
    } catch (error) {
       console .log("unexpected error during logout",error);
       res.redirect("/pageerror")
    }
}


const coupenManagmentListget=async(req,res)=>{
    try {
    if(!req.session.admin){
  return   res.redirect("/admin/login")
    }

   let Coupons=await Coupon.find()
   
    
        res.render("coupenManagment",{Coupons});


        } catch (error) {
            console .log("111111",error)
          res.redirect("/pageerror")  
        }
    

}    


const addNewCoupon=async(req,res)=>{

    try {
    if(req.session.admin){
        
        res.render("addCoupon");
    }
        } catch (error) {
            console .log("22222222",error)
          res.redirect("/login")   
        }
    
}

const newCouponAdd=async(req,res)=>{
console.log("---> newCouponAdd");

        try {   
            const { code, discountType, discountValue, maxDiscount, minPurchase, startDate, endDate, usageLimit, isActive } = req.body;
            
            if (!code || !discountType || !discountValue || !minPurchase || !startDate || !endDate || !usageLimit || !isActive) {
                return res.status(400).json({ success: false, message: 'All fields are required.' });
            }


    
            const existingCoupon = await Coupon.findOne({ code });
            if (existingCoupon) {
                return res.status(400).json({ success: false, message: 'Coupon code already exists.' });
            }
        
            const newCoupon = new Coupon({
                code,
                discountType,
                discountValue,
                maxDiscount,
                minPurchase,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                usageLimit,
                isActive,
            });
    console.log("=====>");

    await newCoupon.save();

    console.log("=====>");
    
    
            return res.status(201).json({ success: true, message: 'Coupon created successfully!' });
    
        } catch (error) {
            console.error('Error creating coupon:', error);
             res.status(500).json({ success: false, message: 'Internal server error' });
        }
    };

    const lodeUpdateCoupon=async(req,res)=>{
        console.log("----> lodeUpdateCoupon");
        
        try{
            if(!req.session.admin){
                return res.redirect('/admin/login')
            }
        const {id}=req.params
        // console.log(id);
        
    const coupons = await Coupon.findById({_id:id})
    console.log(coupons);

    return res.render('updateCoupon',{coupons})


        }catch(error){

            console.error('Error Updateing coupon:',error);
            res.status(500).json({success:false , message:'Internal server error' })


        }

    };

    const updateCoupon=async(req,res)=>{
        console.log("--->updateCoupon");
        try{

            const { code, discountType, discountValue, maxDiscount, minPurchase, startDate, endDate, usageLimit, isActive } = req.body;
            
            console.log( { code, discountType, discountValue, maxDiscount, minPurchase, startDate, endDate, usageLimit, isActive } );

            if (!code || !discountType || !discountValue || !minPurchase || !startDate || !endDate || !usageLimit || !isActive) {
                return res.status(400).json({ success: false, message: 'All fields are required.' });
            }

            





        }catch(error){

        }
    };
    

    




module.exports={
    loadlogin,
    login,
    loadDashboard,
    pageerror,
    logout,
    coupenManagmentListget,
    addNewCoupon,
    newCouponAdd,
    lodeUpdateCoupon,
    updateCoupon,

    }
        
     
       


   

   

