const Product = require("../../models/productSchema");
const Category = require("../../models/category");


const User = require("../../models/userSchema");

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");  //image resize n
const { constrainedMemory } = require("process");
const handleUpload = require("../../config/cloudinary");

const getProductAddPage = async (req, res) => {
    try {
        const category = await Category.find({ isListed: true });
        res.render("product-add", {
            cat: category,

        });
    } catch (error) {
        res.redirect("/pageerror")
    }
}





const addproducts = async (req, res) => {
    try {
        const products = req.body;
        const imagePaths = [];

        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                const b64 = Buffer.from(req.files[i].buffer).toString("base64");
                let dataURI = "data:" + req.files[i].mimetype + ";base64," + b64;
                const cldRes = await handleUpload(dataURI)
                imagePaths.push(cldRes.secure_url)
            }
        }
        // Check if the product already exists
        const productExists = await Product.findOne({
            productName: products.productName, // Ensure correct capitalization of `productName`
        });

        if (!productExists) {
            // const images = [];
            // if (req.files && req.files.length > 0) {
            //     for (let i = 0; i < req.files.length; i++) {
            //         const originalImagePath = req.files[i].path; // Original uploaded file path

            //         // Generate resized image path
            //         const resizedImagePath = path.join(
            //             __dirname,
            //             "..",
            //             "..",
            //             "public",
            //             "uploads",
            //             "product-images",
            //             `resized-${req.files[i].filename}`
            //         );

            //         // Resize the image using Sharp
            //         await sharp(originalImagePath)
            //             .resize({ width: 440, height: 440 }) // Ensure correct syntax for width and height
            //             .toFile(resizedImagePath);

            //         images.push(`resized-${req.files[i].filename}`); // Add filename to the images array
            //     }
            // }

            // Find the category ID
            const categoryId = await Category.findOne({ name: products.category });

            if (!categoryId) {
                return res.status(400).json({ error: "Invalid category name" });
            }

            // Create a new product
            const newProduct = new Product({
                productName: products.productName, // Ensure correct capitalization of `productName`
                description: products.description,
                category: categoryId._id,
                regularPrice: products.regularPrice,
                salePrice: products.salePrice,
                createdOn: new Date(),
                quantity: products.quantity,
                size: products.size,
                color: products.color,
                productImage: imagePaths, // Use the processed images array
                status: 'Available',
            });

            // Save the product to the database
            await newProduct.save();
            return res.redirect("/admin/addProducts");
        } else {
            // Product already exists
            return res.status(400).json({ error: "Product already exists, please try with another name" });
        }
    } catch (error) {
        console.error("Error saving product", error);
        return res.redirect("/admin/pageerror");
    }
};

const getAllProducts = async (req, res) => {
    try {
        const search = req.query.search || "";
        const page = req.query.page || 1;
        const limit = 8;

        const productData = await Product.find({
            $or: [
                { productName: { $regex: new RegExp(".*" + search + ".*") } },

            ],
        }).limit(limit * 1).skip((page - 1) * limit).populate('category').exec()

        const count = await Product.find({
            $or: [
                { productNme: { $regex: new RegExp(".*" + search + ".*", "i") } },
            ]
        }).countDocuments();


        const category = await Category.find({ isListed: true })
        // console.log(productData)
        if (category) {
            res.render("products", {
                data: productData,
                currentPage: page,
                totalPages: Math.ceil(count / limit),
                cat: category

            })

        } else {
            res.render("page-404");
        }


    } catch (error) {
        res.redirect("/pageerror")

    };
}

const blockProduct = async (req, res) => {
    try {
        let id = req.query.id;
        await Product.updateOne({ _id: id }, { $set: { isBlocked: true } });
        res.redirect("/admin/products");

    } catch (error) {
        res.redirect("/pageerroe")

    }
}

const unblockProduct = async (req, res) => {
    try {
        let id = req.query.id;
        await Product.updateOne({ _id: id }, { $set: { isBlocked: false } });
        res.redirect("/admin/products");
    } catch (error) {
        res.redirect("/pageerror")

    }
}


const getEditProduct = async (req, res) => {
    try {
        // console.log(req.params.id)      

        const id = req.params.id;
        const product = await Product.findOne({ _id: id });
        const category = await Category.find({})
        res.render("edit-product", {
            product: product,
            cat: category,
        })

    } catch (error) {
        res.redirect("/pageerror")
    }
}

const editProduct = async (req, res) => {
    try {
        const id = req.params.id;
        // console.log("++++++++++++++++++++++++++++++++++++im in editing : " + id)
        const product = await Product.findOne({ _id: id });
        const data = req.body;
        // console.log("rer .body 0000000000000000000000000000",req.body)
        const existingProduct = await Product.findOne({
            productName: data.productName,
            _id: { $ne: id }
        });

        if (existingProduct) {
            return res.status(400).json({ error: "Product with this name already exists. Please try with another name." });
        }

        const images = [];

        // if (req.files && req.files.length > 0) {
        //     for (let i = 0; i < req.files.length; i++) {
        //         images.push(req.files[i].filename)
        //     }

        // }
           
        const updateFields = {
            productName: data.productName,
            description: data.description,
            category:data.category,
            regularPrice: data.regularPrice,
            salePrice: data.salePrice,
            quantity: data.quantity,
            size: data.size,
            color: data.color
        };




        // if (req.files.length > 0) {
        //     updateFields.$push = { productImage: { $each: images } };
        // }

        const newData = await Product.findByIdAndUpdate(id, updateFields, { new: true });
        // console.log("======================================"+newData)
        res.redirect("/admin/products");
    } catch (error) {
        console.error(error);
        res.redirect("/pageerror");

    }

}



const deleteSingleImage = async (req, res) => {
    try {
        const { imageNameToServer, productIdToServer } = req.body;
        const product = await Product.findByIdAndUpdate(productIdToServer, {
            $pull: { productImage: imageNameToServer },
        });

        const imagePath = path.join("public", "uploads", "re-image", imageNameToServer);

        if (fs.existsSync(imagePath)) {
            await fs.unlinkSync(imagePath);
            console.log(`Image ${imageNameToServer} deleted successfully`);
        } else {
            console.log(`Image ${imageNameToServer} not found`);
        }

        res.send({ status: true });

    } catch (error) {
        res.redirect("/pageerror");

    }    
}


module.exports = {
    getProductAddPage,
    addproducts,
    getAllProducts,
    blockProduct,
    unblockProduct,
    getEditProduct,
    editProduct,
    deleteSingleImage,
};
