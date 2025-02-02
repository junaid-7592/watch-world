
const User=require("../../models/userSchema")
const Address=require("../../models/addressSchema")
//otp send cheyyan nodmailer
const nodemailer=require("nodemailer")
//re set  cheyyunna password has cheyyan  bcript module
const bcrypt=require("bcrypt")
//mail send cheyyan ulla email password um access cheyyan 
const env=require("dotenv").config()
//otp send cheyyumbol verify cheyyan session handle cheyyanam  (sessionil stor cheyyanam)
const session=require("express-session")
const Order = require("../../models/orderSChema")



//generateOtp function globaly decleare cheyyaam  karanam ith pala stalathum upayogikkaam
function generateOtp(){
    const digits="1234567890";
    let otp="";
    for(let i=0;i<6;i++){
        otp+=digits[Math.floor(Math.random()*10)];
    }
    return otp;
}
//globely declear cheyunnu
const sendVerificationEmail= async (email,otp)=>{
try {
   //transport  using  gimail  nte configration  and  karyangalum
   const transporter=nodemailer.createTransport({
    service:"gmail",
    port:587,
    secure:false,
    requireTLS:true,
    auth:{
        user:process.env.NODEMAILER_EMAIL,
        pass:process.env.NODEMAILER_PASSWORD,
    }
   })

   const mailOptions={
    from:process.env.NODEMAILER_EMAIL,
    to:email,
    subject:"Your Otp for password reset",
    text:`Your OTP is ${otp}`,
    html:`<b><h4>Your OTP :${otp}</h4><br></b>`
   }
  //mail options send cheyyan 
  const info= await transporter.sendMail(mailOptions)
  console.log("Email send:",info.messageId);
 return true;

   
} catch (error) {
    console.error("Error sending email",error);
    return false;
    
}
}




const getForgotPassPage=async(req,res)=>{
    try {
      res.render("forgot-password")  
    } catch (error) {
     res.redirect("/pageNotFound")   
    }
}


// const forgotEmailValid=async(req,res)=>{
//     try {
//       const {email}=req.body;
//       console.log(email, "from forgotEmail valid" )
//             const findUser=await User.findOne({email:email})  
//       if(findUser){

//         const otp=generateOtp();
//       //otp ye emailott passcheyunnu
//         const emailSend=await sendVerificationEmail(email,otp);
//         if(emailSend){
//             // user enter cheytha OTP session lot assign cheyyanam
//             req.session.userOtp=otp;
//             console.log(req.session.userOtp, "from otp session   seesion nil kayatti")
//             req.session.userOtp=email;
//             res.render("forgotPass-otp",{message:null});
//         }else{
//           res.render("forgot-Password", {
//                     message: "Failed to send OTP. Please try again."||null, // Error message pass cheyyunnu
//                                })  
//         }

//             console.log("send OTP:..",otp);
//         // }else{
//         //     res.json({success:false,message:"Failed To Send OTP please try again"})
//         // }

//       }else{
//         res.render("forgot-password",{
//             message:"User with ithis email does not exist"
        
//         });
//         // console.log("kooooooooooooooooooooooooi")
//       }
//     } catch (error) {
//         res.redirect("/pageNotFound");
        
//     }
// }


const forgotEmailValid = async (req, res) => {
  try {
    const { email } = req.body;
    console.log(email, "from forgotEmailValid");

    // Check if user exists with the provided email
    const findUser = await User.findOne({ email: email });

    if (findUser) {
      // Generate OTP
      const otp = generateOtp();

      // Send OTP via email
      const emailSend = await sendVerificationEmail(email, otp);

      if (emailSend) {
        // Store OTP in session
        req.session.userOtp = otp; // Correctly store OTP
        req.session.userEmail = email; // Optional: Store email separately if needed
        console.log(req.session.userOtp, "from otp session");

        // Render OTP page
        res.render("forgotPass-otp", { message: null });
      } else {
        // OTP email sending failed
        res.render("forgot-Password", {
          message: "Failed to send OTP. Please try again.",
        });
      }

      console.log("Sent OTP: ", otp);
    } else {
      // User not found
      res.render("forgot-password", {
        message: "User with this email does not exist",
      });
    }
  } catch (error) {
    console.error("Error in forgotEmailValid:", error);
    res.redirect("/pageNotFound");
  }
};




const coformationForgotpassword = async (req, res) => {
  const { newPassword, confirmPassword } = req.body;
  console.log(newPassword, confirmPassword, 'Received passwords');
  try {

    const userId = req.session.user; // Ensure session.user contains the user ID
    if (!userId) {
      return res.json({status:false,message:'User not found in Session'})
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.json({status:false,message:'User not found'})
    }

    // Validate that passwords match
    if (newPassword !== confirmPassword) {
      return res.json({status:false,message:'Password is not matching'})
    }
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // Save the updated user document
    await user.save();

    // Send success response
    res.json({status:true,redirectUrl:'/profile'})


  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).render('changepasswordPage', {
      message: 'Internal server error.',
    });
  }
};





const userProfile=async(req,res)=>{
  try {
    
//mukalil  import cheytha  oro  scheemayum  profile page load akumbol acces cheyth edukkan vendi
    const userId=req.session.user;
    console.log(userId)
    const userData=await User.findById(userId)
    const AddressData=await Address.findOne({userId : userId});
    const orders = await Order.find({userId})
    console.log( " this order details of ",orders)

    console.log(orders)
     res.render('profile',{
      user:userData,
      userAddress:AddressData,
      orders:orders   
    })

  } catch (error) {
    console.error("Error for retrive profile data",error)
    res.redirect("/pageNotFound")
    
  }
} 



const changePassword=async(req,res)=>{
  try {
    res.render("change-password",{message:null})
  } catch (error) {
   res.redirect("/pageNotFound") 
  }
}





const changePasswordValid=async (req,res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  // console.log(currentPassword,newPassword,'helllloooo')
  try {
      
    // console.log('this is form change password')
    // console.log('this is user',req.user)  
      const userId = req.session.user;    //session .user  must an

      const user = await User.findById(userId)
      // console.log(user)

   const isMatch = await bcrypt.compare(currentPassword,user.password)

   if (!isMatch) {
      return res.json({status:false,message:'Current password is not Match'})
  }
  // console.log('is math okk')
  if (newPassword !== confirmPassword) {
      return res.json({status:false,message:'New Password and Confirm Password in not match'})
  }

  // console.log('comparing okey')

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;

  await user.save();
    res.json({status:true,redirectUrl:'/profile'})   
  
  } catch (error) {
      console.error('Error from change password',error);
      res.status(500).send('Internal server error');
    }
   }


// const verifyOtpChangePasswordPage=async(req,res)=>{
// try {
//   const { otp } = req.body; 
//   console.log("Input OTP:", otp);

//   if (otp === req.session.userOtp) { 
      
//   req.session.userOtp=otp;
//     res.render("changepasswordPage");

//  } else {
//       res.status(400).json({ success: false, message: "Invalid OTP, please try again" });
//       // console.log("invalidotp")
//   }
// } catch (error) {
//   console.error("Error Verifying OTP:", error);
//   res.status(500).json({ success: false, message: "An error occurred" });
// }
// };



  
const verifyOtpChangePasswordPage = async (req, res) => {
  try {
    const { otp } = req.body;
    console.log("Input OTP::::", otp);

    // Check if OTP exists in the session and matches
    if (!otp) {
      return res.status(400).json({ success: false, message: "OTP is required" });
    }

    if (!req.session.userOtp) {
      return res.status(400).json({ success: false, message: "OTP session expired or not found" });
    }

    if (otp === req.session.userOtp) {
      // console.log(otp,req.session.userOtp);
      
      // OTP is valid, proceed with the password change page
      res.render("changepasswordPage",{message:null})
    } else {
      // OTP is invalid
      res.render("forgotPass-otp", { message: "Invalid OTP, please try again." });

    }
  } catch (error) {
    console.error("Error Verifying OTP:", error);
    res.status(500).json({ success: false, message: "An error occurred" });
  }
};



const passwordResendOtp  = async(req,res) => {
  try{
    const email = req.session.userEmail;
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


const addAddress=async(req,res)=>{
  try {
   const user=req.session.user;
   res.render("add-address",{user:user}) 
  } catch (error) {
   res.redirect("/pageNoteFound") 
  }
}
 
const postAddAddress=async(req,res)=>{
  try {
    const userId=req.session.user;
    const userData=await User.findOne({_id:userId});
    const {addressType,name,city,landMark,state,pincode,phone,altPhone}=req.body

    const userAddress=await Address.findOne({userId:userData._id})
    if(!userAddress){
      const newAddress=new Address({
        userId:userData._id,
        address:[{addressType,name,city,landMark,state,pincode,phone,altPhone}]
      })
      await newAddress.save()
    }else{
      userAddress.address.push({addressType,name,city,landMark,state,pincode,phone,altPhone})
      await userAddress.save()
     }
    
    res.redirect("/profile")
  } catch (error) {
    console.error("Error adding address:",error);
    res.redirect("/pageNotFound")
  }
}



const editAddress=async(req,res)=>{
  try {
    const addressId=req.query.id;
    const user=req.session.user;
    const currAddress=await Address.findOne({
      "address._id":addressId,
    });
    if(!currAddress){
      return res.redirect("/pageNotFound")
      
    }

    //usernte  address edukkan 
    const addressData =currAddress.address.find((item)=>{    //find methord  in mongodb serch
      return item._id.toString()===addressId.toString();
    })
    if(!addressData){
      return res.redirect("/pageNotFound")
    }
    res.render("edit-address",{address:addressData,user:user})
  } catch (error) {
   console.error("Error in edit address",error) 
   res.redirect("/pageNotFound")
  }
}
   
const postEditAddress=async(req,res)=>{
try {
  const data=req.body;
  const addressId=req.query.id;
  const user=req.session.user;
  const findAddress=await Address.findOne({"address._id":addressId});
  if(!findAddress){
    res.redirect("pageNotFound")
  }
  await Address.updateOne(
    {"address._id":addressId} ,
    {$set :{
      "address.$":{
        _id:addressId,
        addressType:data.addressType,
        name:data.name,
        city:data.city,
        landMark:data.landMark,
        state:data.state,
        pincode:data.pincode,
        phone:data.phone,
        altPhone:data.altPhone,
       }
    }}
    
   )
  res.redirect("/profile")

} catch (error) {
 console.error("Error in edit address",error) 
 res.redirect("/pageNotFound")
}
}

const orderViewLoad = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ _id: orderId }).populate("orderedItems.product")
    // console.log("---------------------------------------")
  //  console.log(order)
    if (!order) {
      return res.status(404).send("Order not found");
    }

    res.render("ordersView", { order }); 
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


const deleteAddress=async(req,res)=>{
  try {
 const addressId=req.query.id;
 const findAddress=await Address.findOne({"address._id":addressId});
 if(!findAddress){
  return res.status(400).send("address not found")
 }  

 await Address.updateOne({
  "address._id":addressId,

 },{$pull:{address:{_id:addressId,}}})
 res.redirect("/profile")

  } catch (error) {
   console.error("Error in delete address",error) 
   res.redirect("pageNotFound")
  }
}

const addresspageShow=async(req,res)=>{
  try {
   const user=req.session.user;
   res.render("add-fromCheckout",{user:user}) 
  } catch (error) {
   res.redirect("/pageNoteFound") 
  }
}


const postaddressAdd = async (req, res) => {
  try {
    const userId = req.session.user;
    console.log("111111111111111",userId);
    const userData = await User.findOne({ _id: userId });
    const { addressType, name, city, landMark, state, pincode, phone, altPhone } = req.body;
    console.log("222222222222",userData);
    const userAddress = await Address.findOne({ userId: userData._id });
    console.log("33333333333",userAddress);
    if (!userAddress) {
      const newAddress = new Address({
        userId: userData._id,
        address: [{ addressType, name, city, landMark, state, pincode, phone, altPhone }]
      });
      await newAddress.save();
    } else {
      userAddress.address.push({ addressType, name, city, landMark, state, pincode, phone, altPhone });
      await userAddress.save();
    }

    return res.json({ success: true, message: "Address added successfully!" });
  } catch (error) {
    console.error("Error adding address:", error);
    return res.status(500).json({ success: false, message: "Failed to add address!" });
  }
};








module.exports={
    getForgotPassPage,
    forgotEmailValid,
    userProfile,
     changePasswordValid,
      changePassword,
      verifyOtpChangePasswordPage,
      coformationForgotpassword,
      passwordResendOtp,
      addAddress,
      postAddAddress,
      editAddress,
      postEditAddress,
      deleteAddress,
      orderViewLoad,
      addresspageShow,
      postaddressAdd,

}             