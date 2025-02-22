const Product = require("../../models/productSchema");
const Category = require("../../models/category"); 

const Order=require("../../models/orderSChema")
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
     
        // Check if the product already exists
        const productExists = await Product.findOne({productName: new RegExp(`^${products.productName}$`, 'i')});

        if (!productExists) {
            const imagePaths = [];

            if (req.files && req.files.length > 0) {
                for (let i = 0; i < req.files.length; i++) {
                    const b64 = Buffer.from(req.files[i].buffer).toString("base64");
                    let dataURI = "data:" + req.files[i].mimetype + ";base64," + b64;
                    const cldRes = await handleUpload(dataURI)
                    imagePaths.push(cldRes.secure_url)
                }
            }
           
            const categoryId = await Category.findOne({ name: products.category });

            if (!categoryId) {
                return res.status(400).json({ message: "Invalid category name" });
            }

            
            const newProduct = new Product({
                productName: products.productName, 
                description: products.description,
                category: categoryId._id,
                regularPrice: products.regularPrice,
                salePrice: products.salePrice,
                createdOn: new Date(),
                quantity: products.quantity,
                size: products.size,
                color: products.color,
                productImage: imagePaths, 
                status: 'Available',
            });

            
            await newProduct.save();
            return res.status(200).json({success: true})
        } else {
        
            return res.status(400).json({ message: "Product already exists, please try with another name" });
        }
    } catch (error) {
        console.error("Error saving product", error);
        return res.status(500).json({message: 'Internal server error'});
    }
};

const getAllProducts = async (req, res) => {
    try {
        const search = req.query.search || "";
        const page = req.query.page || 1;
        const limit = 4;

        const productData = await Product.find({
            $or: [
                { productName: { $regex: new RegExp(".*" + search + ".*") } },

            ],
        }).limit(limit * 1).skip((page - 1) * limit).populate('category').exec()

        const count = await Product.find({
            productName: {$regex: search, $options: 'i'}
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
            error:null,
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
            productName: new RegExp(`^${data.productName}$`,'i'),
            _id: { $ne: id }
        });

        if (existingProduct) {
            const product = await Product.findOne({ _id: id });
            const category = await Category.find({})
            return res.render("edit-Product",{error:"Product with this name already exists. Please try with another name.",product: product,
                cat: category,
            });
       
        }

        const images = [];

           
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




        
        const newData = await Product.findByIdAndUpdate(id, updateFields, { new: true });
        // console.log("======================================"+newData)
        res.redirect("/admin/products");
    } catch (error) {
        console.error(error);
        res.redirect("/admin/pagerror");

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

const croppedImage = async (req, res) => {
        try {
            const productId = req.params.productId;
            const imageIndex = req.body.index;
    
            if (!req.file) {
                return res.status(400).json({ error: "No image file provided" });
            }
    
            const productData = await Product.findById(productId);
    
            if (!productData) {
                return res.status(404).json({ error: "Product not found" });
            }
    
            const b64 = Buffer.from(req.file.buffer).toString("base64");
            let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
            const result = await handleUpload(dataURI);
    
    
    
            productData.productImage[imageIndex] = result.secure_url;
    
            await productData.save();
    
            res.json({
                message: "Image updated successfully",
                image: result.secure_url
            });
    
        } catch (error) {
            console.error('Error updating image:', error);
            res.status(500).json({
                error: "Failed to update image",
                details: error.message
            });
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
    croppedImage
};
