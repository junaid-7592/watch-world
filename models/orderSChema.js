const mongoose = require("mongoose");
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');  // is a way to import the v4 function from the popular uuid library in Node.js. Here's a breakdown of what it does:
                                          
const orderSchema = new Schema({         
  orderId: {
    type: String,
    default: () => uuidv4(),   // a random number creat  for we want use here only random number becouse original object id hide (original object id not display for user)
    unique: true                   // thats way using uuid module use  for create random id 
  },
  orderedItems: [{

    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true     
    },
    quantity: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      default: 0
    }
  }],
  totalPrice:{
    type:Number,
    required:true
  },
  discount:{      //  while using coupen
    type:Number,
    default:0
  },
  finalAmount:{
    type:Number,
    required:true,
  },
  address:{
    type:Schema.Types.ObjectId,
    ref:"User",
    required:true
  }, 
  invoiceDate:{    //after deliverd product  we can option  download invoice  so,  ( that inverse date)  
    type:Date
  },
  status:{
    type:String,
    required:true,
    enum:["Pending","Processing","Shipped","Deliverd","Canncelled","Retun Request","Returned"]
  },
  createdOn:{
    type:Data,
    default:Date.now,
    required:true
  },
  coupenApplied:{      // if applay coupen   check thats statuse
     type: Boolean,
     default:false,
  }
});

const Order=mongoose.model("Order",orderSchema);
module.exports=Order;