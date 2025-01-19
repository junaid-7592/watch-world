const mongoose=require("mongoose");
const {Schema}=mongoose;   // schema destructuring


const userSchema=new Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    phone:{
        type:String,
        required:false,
        sparse:true,
        default:null,
        uniqe:true,
    },
    googleId:{          
        type:String,
        uniqe:true
    }, 
    password:{
        type:String,
        required:false    //becouse while  single sign up  not use password
    },
    isBlocked:{
        type:Boolean,  
        default:false,     //   admin can  block  user
    },
    isAdmin:{
        type:Boolean,
        default:false,   // user is not an admin consider only regular user
    },
    cart:[{
        type:Schema.Types.ObjectId,  //this cart refers to another collections
        ref:"Cart", 
       }] ,
    wallet:{
        type:Number,
        default:0,      //initial balance is zero
    },
    wishlist:[{
        type:Schema.Types.ObjectId,
        ref:"wishlist",
    }],
    orderHistory:[{
        type:Schema.Types.ObjectId,
        ref:"Order"
    }],
    createdon:{
        type:Date,
        default:Date.now,

    },
    referalcode:{
        type:String,
    },
    redeemed:{
        type:Boolean,
    },
    redeemedUsers:[{
        type:Schema.Types.ObjectId,
        ref:"User"
    }],
    searchHistory:[{
     category:{
        type:Schema.Types.ObjectId,
        ref:"Category",
     },
     brand:{
        type:String
     },
     searchOn:{
        type:Date,
        default:Date.now

     }
    }]

})



const User=mongoose.model("User",userSchema);
module.exports=User;         