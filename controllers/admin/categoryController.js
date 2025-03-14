const handleUpload = require("../../config/cloudinary");
const Category = require("../../models/category");
const Product = require('../../models/productSchema')

const categoryInfo = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;


        const categoryData = await Category.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalCategories = await Category.countDocuments();
        const totalPages = Math.ceil(totalCategories / limit);

        res.render("category", {
            cat: categoryData,
            currentPage: page,
            totalPages: totalPages,
            totalCategories: totalCategories
        });
    } catch (error) {
        console.error(error);
        res.redirect("/pageerror")
    }
}

    
const addCategory = async (req, res) => {
    const { name, description } = req.body;
    
  
    
    try {
        const existingCategory = await Category.findOne({name: new RegExp(`${name}$`,'i')});
        if (existingCategory) {
            return res.status(400).json({ error: "Category already exists" });
        }
        const newCategory = new Category({
            name,
            description ,
        });
        await newCategory.save();
        return res.status(200).json({ message: "Category added successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "An error occurred while adding the category" });
    }
};

const getListCategory = async (req, res) => {
    try {
        let id = req.query.id;
        await Category.updateOne({ _id: id }, { $set: { isListed: false } });
        res.redirect("/admin/category");

    } catch (error) {
        res.redirect("/pageerror");
    }
}


const getUnlistCategory = async (req, res) => {
    try {
        let id = req.query.id;
        await Category.updateOne({ _id: id }, { $set: { isListed: true } });
        res.redirect("/admin/category");

    } catch (error) {
        res.redirect("/pageerror");
    }
}


const getEditCategory = async (req, res) => {
    try {
        const id = req.query.id;
        const category = await Category.findOne({ _id: id });
        res.render("edit-category", { error: null, category: category });
    } catch (error) {
        res.redirect("/pageerror");
    }
};

const editCategory = async (req, res) => {
    try {
        const id = req.params.id;
        const { categoryName, description } = req.body;

        // Check if a category with the same name already exists
        const existingCategory = await Category.findOne({ name: new RegExp(`${categoryName}$`,'i') });

        if (existingCategory) {
            // Pass the existing `category` data to re-render the page with the error message
            const category = await Category.findById(id); // Fetch the current category being edited
            return res.render("edit-category", {
                error: "Category exists, please choose another name",
                category: category
            });
        }

        // Update the category
        const updateCategory = await Category.findByIdAndUpdate(
            id,
            {
                name: categoryName,
                description: description,
            },
            { new: true } // Return the updated document
        );

        if (updateCategory) {
            res.redirect("/admin/category");
        } else {
            res.status(404).json({ error: "Category not found" })
        }
    } catch (error) {
        res.status(500).json({ error: "Internal server error" })
    }
};


const addCategoryOffer = async (req, res) => {
    try {
        const { categoryId, offerPercentage } = req.body;

        // Validate offer percentage
        if (offerPercentage < 10 || offerPercentage > 70) {
            return res.status(400).json({ error: 'Offer percentage must be between 10 and 70' });
        }

        // Find the category
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
   
        // Update category with offer
        category.categoryOffer = offerPercentage;
        await category.save();

        // Find all products in this category
        const products = await Product.find({ category: categoryId });

        // Update each product's sale price based on the offer
        for (const product of products) {
            const originalPrice = product.regularPrice || product.salePrice;
            const newSalePrice = originalPrice - (originalPrice * (offerPercentage / 100));

            // Only update if the new sale price is lower than current sale price
            if (newSalePrice < product.salePrice) {
                // Store current sale price in prevOfferPrice before updating
                product.prevOfferPrice = product.salePrice;
                product.salePrice = Math.round(newSalePrice);
                await product.save();
            }
        }

        res.json({ 
            success: true, 
            message: 'Category offer added successfully' 
        });

    } catch (error) {
        console.error('Error adding category offer:', error);
        res.status(500).json({ 
            error: 'Internal server error while adding offer' 
        });
    }
};

const removeCategoryOffer = async (req, res) => {
    try {
        const { categoryId } = req.body;

        // Find the category
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Remove category offer
        category.categoryOffer = 0;
        await category.save();

        // Find all products in this category
        const products = await Product.find({ category: categoryId });

        // Restore original prices for products
        for (const product of products) {
            if (product.prevOfferPrice) {
                product.salePrice = product.prevOfferPrice;
                product.prevOfferPrice = null;
                await product.save();
            }
        }

        res.json({ 
            success: true, 
            message: 'Category offer removed successfully' 
        });

    } catch (error) {
        console.error('Error removing category offer:', error);
        res.status(500).json({ 
            error: 'Internal server error while removing offer' 
        });
    }
};






module.exports = {
    categoryInfo,
    addCategory,
    getListCategory,
    getUnlistCategory,
    getEditCategory,
    editCategory,
    addCategoryOffer,
    removeCategoryOffer
}