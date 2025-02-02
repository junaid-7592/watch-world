
//import user model


const User=require("../../models/userSchema");
const mongoose=require("mongoose");
const bcrypt=require("bcrypt");   //password compire




const pageerror=async (req,res)=>{
    res.render("admin-error")
}

const loadlogin=(req,res)=>{
    if(req.session.admin){
        return res.redirect("/admin/dashboard")
    }
    res.render("adminlogin",{message:null})  //admin-login
}



const login=async (req,res)=>{
try {
    const{email,password}=req.body;
    console.log(password)
    const admin=await User.findOne({email,isAdmin:true});
    console.log(admin);
    
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



module.exports={
    loadlogin,
    login,
    loadDashboard,
    pageerror,
    logout,

}
        

       


   

   

