const handleUpload = require("../../config/cloudinary");
const Category = require("../../models/category");

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
    
    const b64 = Buffer.from(req.file.buffer).toString("base64")
    let dataURI = "data:" + req.file.mimetype + ";base64," + b64
    const cldRes = await handleUpload(dataURI)
    
    try {
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ error: "Category already exists" });
        }
        const newCategory = new Category({
            name,
            description ,
            image : cldRes.secure_url
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
        const existingCategory = await Category.findOne({ name: categoryName });

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







module.exports = {
    categoryInfo,
    addCategory,
    getListCategory,
    getUnlistCategory,
    getEditCategory,
    editCategory,
}