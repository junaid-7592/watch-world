//for user 

const User = require("../models/userSchema");


const userAuth = (req, res, next) => {
    if (req.session.user) {
        User.findById(req.session.user)
            .then(data => {
                if (data && !data.isBlocked) {
                    next();
                } else {
                    if (req.locals) {
                        req.locals.userCredit = false
                    }
                    res.redirect("/login")
                }
            })
            .catch(error => {
                console.log(error)
                console.log("Error in user auth middleware");
                res.status(500).send("Internal Server error ")
            })
    } else {
        res.redirect("/")
    }
}


// for admin 


const adminAuth = (req, res, next) => {
    // First check if admin session exists
    if (!req.session.admin) {
        return res.redirect('/admin/login');
    }

    User.findOne({ isAdmin: true, email: req.session.admin.email })
        .then(data => {
            if (data) {
                next();
            } else {
                // Clear invalid session
                req.session.destroy((err) => {
                    if (err) {
                        console.log("Session destruction error:", err);
                    }
                    res.redirect('/admin/login');
                });
            }
        })
        .catch(error => {  
            console.log("Error in adminauth middleware", error);
            req.session.destroy((err) => {
                if (err) {
                    console.log("Session destruction error:", err);
                }
                res.redirect('/admin/login');
            });
        })
}

module.exports = {
    userAuth,
    adminAuth,

}