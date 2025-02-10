const mongoose = require('mongoose');
const { Schema } = mongoose;

const walletSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
    required: true,
  }
  
},{
    timestamps:true
});


const Wallet = mongoose.model('Wallet', walletSchema)
module.exports=Wallet