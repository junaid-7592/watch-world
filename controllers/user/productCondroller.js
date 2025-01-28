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
const Cart = require("../../models/cartSchema");

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





const getCart = async (req, res) => {
    try {
        const userId = req.session.user; // Get user ID from session
        if (!userId) {
            return res.status(401).json({ message: "User not logged in" });
        }
        const cart = await Cart.findOne({ userId }).populate({
            path: "items.productId",
            select: "productName salePrice regularPrice productImage",
        });
        
        console.log('this is cart',cart)

        

        if (!cart || cart.items.length === 0) {
            return res.json({ message: "Your cart is empty", cart: [] });
        }
        res.render("cart" ,{cart:cart})

    } catch (error) {
        console.error("Error fetching cart:", error);
        res.status(500).json({ message: "Error fetching cart" });
    }
};



const addTocart = async (req, res) => {
    console.log("0");
    const userId = req.session.user;
    try {
        const { productId, quantity } = req.body;
        console.log("this is userId", userId);
        console.log("this is productId", productId);
        console.log("this is quantity", quantity);

        // Fetch product details (including price)
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        const price = product.salePrice || product.regularPrice; // Use salePrice if available, otherwise use regularPrice
        console.log("price is", price);
        // Ensure your Product model has a price field
        console.log("price  is"  ,price)

        let cart = await Cart.findOne({ userId });
        console.log("2", cart);
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        console.log("3", itemIndex);
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += quantity;
        } else {
            cart.items.push({ productId, quantity, price }); // Add price here
        }
        console.log("4");
        await cart.save();
        
        res.json({ success: true, message: "Item added to cart", cart });
    } catch (error) {
        console.error("Error in addToCart:", error);
        res.status(500).json({ message: "Error adding to cart" });
    }
};

const cartUpdate = async (req, res) => {
    const { itemId } = req.params;  // Extract itemId from URL params
    const { quantity } = req.body;  // Extract quantity from request body

    if (!quantity || quantity < 1) {
        return res.status(400).json({ success: false, message: "Invalid quantity" });
    }

    try {
        // Find and update the cart item quantity
        const updatedCart = await Cart.findOneAndUpdate(
            { 'items._id': itemId },
            { $set: { 'items.$.quantity': quantity } },
            { new: true } // Return the updated cart
        );

        if (!updatedCart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        // Find the updated item
        const updatedItem = updatedCart.items.find(item => item._id.toString() === itemId);
        if (!updatedItem) {
            return res.status(404).json({ success: false, message: "Item not found in cart" });
        }

        // Calculate the updated total price
        const updatedPrice = (updatedItem.price * updatedItem.quantity).toFixed(2);

        // Respond with the updated item details
        res.json({
            success: true,
            item: {
                ...updatedItem.toObject(), // Convert to plain object
                total: updatedPrice       // Include the total price
            }
        });

    } catch (error) {
        console.error("Error updating cart:", error);
        res.status(500).json({ success: false, message: "Error updating cart" });
    }
};



const removeCartItem = async (req, res) => {
    try {
        const { cartId, itemId } = req.params;
    
        // Remove the item with the given itemId from the cart's items array
        const cart = await Cart.findByIdAndUpdate(
          cartId, // Find the cart by its ID
          { $pull: { items: { _id: itemId } } }, // Remove the item with the specified _id
          { new: true } // Return the updated cart
        );
    
        if (!cart) {
          return res.status(404).send('Cart not found');
        }
    
        res.status(200).send('Item removed successfully');
      } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).send('Internal Server Error');
      }
  }





module.exports = {
    productDetails,
    addTocart,
    getCart,
    cartUpdate,
    removeCartItem
};
