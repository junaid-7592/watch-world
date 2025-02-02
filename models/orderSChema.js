const mongoose = require("mongoose");
const { Schema } = mongoose;

const orderSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true
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
  totalPrice: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  finalAmount: {
    type: Number,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true
  },
  invoiceDate: {
    type: Date
  },
  status: {
    type: String,
    required: true,
    enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Return Request", "Returned"]
  },
  paymentStatus: {
    type: String,
    enum: ["paid", "unpaid",]
  },

  coupenApplied: {
    type: Boolean,
    default: false

  }
}, {
  timestamps: true
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
