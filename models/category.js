const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
    },
    name: {         
        type: String,
        required: true,
    },
    isListed: {
        type: Boolean,
        default: true,
    },
    categoryOffer: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    image: {
        type: String, 
        required: false,
    }
});


const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
