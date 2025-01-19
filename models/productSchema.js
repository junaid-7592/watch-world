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
            required: true, // Fixed the typo from 'requaired' to 'required'
        },
        productImage: {
            type: [String], // Corrected spelling from 'prductImage' to 'productImage'
            required: true,
        },
        isBlocked: {
            type: Boolean,
            default: false,
        },
        status: {
            type: String,
            enum: ["Available", "out of stock"], // Fixed spacing and capitalization consistency
            required: true,
            default: "Available",
        },
    },
    { timestamps: true } // Ensures createdAt and updatedAt fields are added
);

// Corrected the typo in mongoose.Model to mongoose.model
const product = mongoose.model("Product", productSchema);

module.exports = product;
