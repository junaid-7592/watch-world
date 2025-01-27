// const User=require("../../models/userSchema")
// const product=require("../../models/productSchema")


// const productDetails = async (req, res) => {
//     try {
         
//       const user = req.session.user;
//       const userData = await User.findOne({ _id: user });
//         const productId = req.query.id;
    
//         if (!productId) {
//             console.error("Product ID is missing from request.");
//             return res.redirect('/pageNotFound');
//         }
      

//         res.render("productInfo")
        
  
//     } catch (error) {
//         console.error("Error in productDetails:", error);
//         res.redirect('/pageNotFound');
//     }
//   };


//   module.exports={
//     productDetails ,
//   }



const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");

const productDetails = async (req, res) => {
    try {
        const user = req.session.user;
        const userData = user ? await User.findOne({ _id: user }) : null;

        const productId = req.query.id;

        if (!productId) {
            console.error("Product ID is missing from the request.");
            return res.redirect('/pageNotFound');
        }

        
        const productData = await Product.findOne({ _id: productId });
        console.log(productData)

        if (!productData) {
            console.error("Product not found.");
            return res.redirect('/pageNotFound');
        }

        
        res.render("productInfo", { product: productData, user: userData });

    } catch (error) {
        console.error("Error in productDetails:", error);
        res.redirect('/pageNotFound');
    }
};      




module.exports = {
    productDetails,
    
};
