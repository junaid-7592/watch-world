const userModal = require('../models/userSchema');



let banCheck = async (req, res, next) => {    
    
    console.log("hello+++++++++++=")
    if (req.session.user) {
        console.log("helsdfasdfasdfsdfsdfsdfsdfsdlo")
        userModal.findById(req.session.user)  
        .then(data=>{                        
            if(data && !data.isBlocked){    
                next();
            }else{
                
                req.session.user = null
                res.locals.userCredit = false 
                res.locals.userData = {}
                
            }
        })
        .catch(error=>{
            console.log("Error in user auth middleware");
            res.status(500).send("Internal Server error ")
        })
    }else{
        req.session.user = null
        res.locals.userCredit = false
        res.locals.userData = {}
    }
    return next();
};

module.exports = banCheck;