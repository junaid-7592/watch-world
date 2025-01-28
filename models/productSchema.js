const mongoose = require("mongoose");
const { Schema } = mongoose;


const productSchema = new Schema(
    {
        productName: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        brand: {
            type: String
        },
        category: {
            type: Schema.Types.ObjectId,
            ref: "Category",
        },
        regularPrice: {
            type: Number,
        },
        salePrice: {
            type: Number,
            required: true,
        },
        productOffer: {
            type: Number,
            default: 0,
        },
        quantity: {
            type: Number,
            default: 1,
        },
        color: {
            type: String,
            required: true, 
        },
        productImage: {
            type: [String], 
            required: true,
        },
        isBlocked: {
            type: Boolean,
            default: false,
        },
        status: {
            type: String,
            enum: ["Available", "out of stock"], 
            required: true,
            default: "Available",
        },
    },
    { timestamps: true } 
);


const product = mongoose.model("Product", productSchema);

module.exports = product;
