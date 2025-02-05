  //for user 

  const User=require("../models/userSchema");


  const userAuth=(req,res,next)=>{
    if(req.session.user){   
        User.findById(req.session.user)  
        .then(data=>{                        
            if(data && !data.isBlocked){    
                next();
            }else{
                if(req.locals){
                    req.locals.userCredit = false
                }
                res.redirect("/login")
            }
        })
        .catch(error=>{
            console.log(error)
            console.log("Error in user auth middleware");
            res.status(500).send("Internal Server error ")
        }) 
    }else{
        res.redirect("/")
    }
  }

  
    // for admin 


    const adminAuth=(req,res,next)=>{
        User.findOne({isAdmin:true})
        .then(data=>{
            if(data){
                next();
             } else{
                    res.redirect("admin/login")
                }
        })
        .catch(error=>{
            console.log("Error in adminauth middleware",error);
            res.status(500).send("Internal Server Error")
        })
    }

module.exports={
    userAuth,
    adminAuth,
    
}