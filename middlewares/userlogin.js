const User = require("../models/userSchema")

const userlog = async (req, res, next) => {
  if (req.session.user) {
    const user = await User.findById(req.session.user)
    if (user && !user.isBlocked) {
      res.locals.userCredit = true
      res.locals.userData = req.session.userData
    } else {
      req.session.user = null
      res.locals.userCredit = false
      res.locals.userData = {}
    }

    return next()

  }

  res.locals.userData = {}
  res.locals.userCredit = false
  next()

}

module.exports = userlog;