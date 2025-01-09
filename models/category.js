const mongoose=require("mongoose");
const{SCHEMA}=mongoose;


const categorySchema=new mongoose.Schema({
    description:{
        required:true,
    },
    isListed:{
        type:Boolean,
        default:true,
    },
    categoryOffer:{
        type:Number,
        default:0,

    },createdAt:{
        type:Date,
        default:Date.now,

    }
})


const Category=mongoose.moduel("category","categorySchema");

module.exports=Category;
