const mongoose =require("mongoose");
    const {Scheema}=mongoose;

    const productSchema=new Scheema({
        productName:{
            type:String,
            required:true,
        },
        description:{
            type:String,
            required:true
        },
        brand:{
            type:String,
            required:true
        },
        category:{
            type:Schema.Type.obj,
            ref:"Category"
        },regularPrice:{
            type:Number,

        },
        salePrice:{
           type:Number,
           required:true,
        },
        productOffer:{
            type:Number,
            default:0, 
        },
        quantity:{
            type:Number,
            default:1,
        },
        color:{
            type:String,
            requaired:true,
        },
        prductImage:{
            type:[String],  // have multiple images
            required:true
        },
        isBlocked:{
            type:Boolean,
            default:false,
        },
        status:{
            type:String,
            enum:["Available","out of stock"],  //which status  used here
            required:true,
            default:"Available"
        },


    },{timestamps:true});  //time stand setup


    const product=mongoose.Model("product",productSchema)

    module.exports=product;

