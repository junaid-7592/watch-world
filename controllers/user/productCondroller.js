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
const mongoose = require("mongoose");
const Product = require("../../models/productSchema");
const Cart = require("../../models/cartSchema");
const Address=require("../../models/addressSchema")
const Order=require("../../models/orderSChema")

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
        const userId = req.session.user; 
        if (!userId) {
            return res.redirect("/login");
        }

        const cart = await Cart.findOne({ userId }).populate({
            path: "items.productId",
            select: "productName salePrice regularPrice productImage",
        });

        if (!cart || cart.items.length === 0) {
            return res.render("cart", { cart: null, message: "No products in cart." });
        }

        res.render("cart", { cart });

    } catch (error) {
        console.error("Error fetching cart:", error);
        res.status(500).json({ message: "Error fetching cart" });
    }
};




const addTocart = async (req, res) => {
    // console.log("0");
    const userId = req.session.user;
    try {
        const { productId, quantity } = req.body;
        // console.log("this is userId", userId);
        // console.log("this is productId", productId);
        // console.log("this is quantity", quantity);

        // Fetch product details (including price)
        const product = await Product.findById(productId);
        if (!product) {
        
           return res.json({ success: true, message: "product not found" });

        }
        const price = product.salePrice || product.regularPrice; // Use salePrice if available, otherwise use regularPrice
        // console.log("price is", price);
        // Ensure your Product model has a price field
        // console.log("price  is", price)

        let cart = await Cart.findOne({ userId });
        // console.log("2", cart);
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        // console.log("3", itemIndex);
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += quantity;
        } else {
            cart.items.push({ productId, quantity, price }); // Add price here
        }
        // console.log("4");
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


const updateTotel = async (req, res) => {
    try {
        const { cartIdUpdate } = req.body;
        const cart = await Cart.findById(cartIdUpdate).populate('items.productId');

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Check if the cart has items and they are populated correctly
        if (!cart.items || cart.items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // Calculate Subtotal for all items in the cart
        let subTotal = 0;
        const itemsWithSubTotal = cart.items.map(item => {
            // Calculate subtotal for each item
            const itemSubtotal = item.price * item.quantity;
            subTotal += itemSubtotal;  // Add to grand total
            return {
                _id: item._id,
                price: item.price,
                quantity: item.quantity,
                subTotal: itemSubtotal
            };
        });

        // Calculate Grand Total (Modify if tax/shipping needed)
        let grandTotal = subTotal;

        // console.log('this is grand',itemsWithSubTotal)

        // Send JSON response with updated totals
        res.json({ items: itemsWithSubTotal, grandTotal });
    } catch (error) {
        console.error('Error fetching cart data:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const getCheckout = async (req, res) => {
    try {

        const userId = req.session.user;    
        // console.log(userId)
        const addressData = await Address.find({ userId }).populate("address")
        // console.log(addressData)


        // Fetch user's cart items
        const cart = await Cart.findOne({ userId }).populate("items.productId");

        // console.log('this is cart',cart)

        if (!cart) {
            return res.status(404).send("User or Cart not found");
       }            

         res.render("checkout", {
            address: addressData.length > 0 ? addressData[0].address : [],  
            cart: cart,
            
        });
     } catch (error) {
        console.error("Error rendering checkout page:", error);
        res.status(500).send("Internal Server Error");
    }
};

const OrderSuccess = async (req, res) => {
    try {
        const { userId, cartId, selectedAddress,paymentMethod } = req.body;
        // console.log("dfghofdfgiodfg",paymentMethod)
        // console.log(req.body);
        
        
        // console.log("User ID:", userId);
        // console.log("Cart ID:", cartId);
        //   adresss = find(addresssId)
         //  
        // (1) **User ID Validation**
        if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
            return res.status(400).json({ success: false, message: "use valid user ID ." });
        }

        // (2) **Check if Cart Exists**
        const cart = await Cart.findOne({ userId });
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty so add items." });
        }

        // (3) **Stock & Total Amount Check**
        let totalAmount = 0;
        const updatedItems = [];

        for (const item of cart.items) {
            const product = await Product.findById(item.productId);

            if (!product) {
                return res.status(400).json({ success: false, message: `Item ${item.productId} not available product` });
            }
            if (product.stock <= 0) {
                return res.status(400).json({ success: false, message: `Item ${product.name} out of stock .` });
            }

            totalAmount += product.salePrice * item.quantity;
            updatedItems.push({ product: product._id, price: product.salePrice, quantity: item.quantity });

            // Stock reduce cheyyuka 
            product.stock -= item.quantity;
            await product.save();
        }
        //   console.log(totalAmount)
        // (4) **Minimum Order Amount Check**
        if (totalAmount < 150) {
            return res.status(400).json({ success: false, message: "Minimum order ₹150 ." });
        }
        const selectedAddressId = new mongoose.Types.ObjectId(selectedAddress);
        // console.log("this is the selected address id : ",selectedAddressId)

        const userAddress = await Address.findOne({ userId });
        // console.log(userAddress)

        
        if (!userAddress) {
            return res.status(400).json({ success: false, message: "Address not found." });
        }

        // **Find the correct address in the array**
        const adrs = userAddress.address.find(addr => addr._id.equals(selectedAddressId));
        
        const orderAddress= ` ${adrs.name} ${adrs.city} ${adrs.landMark} ${adrs.state} ${adrs.pincode} ${adrs.phone} ${adrs.altPhone}`
        
        
        // (5) **Order Create & Save to Database**
        const newOrder = new Order({
            userId,
            orderedItems: updatedItems,
            totalPrice:totalAmount,
            finalAmount:totalAmount,
            status:"Processing",
            address:orderAddress ,
            paymentMethod:paymentMethod,
            
        });

        await newOrder.save();

        // (6) **Delete User Cart After Order**
        await Cart.deleteOne({ userId });

        // **Success Response**
        res.status(200).json({ success: true, message: "Order successfully placed!", orderId: newOrder._id });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const getOrderSuccess = async (req, res) => {
    try {
        const { orderId } = req.query;
        // console.log(orderId);
        
        if (!orderId) {
            return res.status(400).json({ success: false, message: "Missing orderId" });
        }

        // Populate the address field properly
        const order = await Order.findOne({ _id: orderId })
            // .populate("address")  //
            .populate("orderedItems.product", "name price");

        // console.log("Fetched Order:", order); // Debugging output

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.render("orderSuccess", { order });
        
    } catch (error) {
        console.log("Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};


const cancelOrder= async (req, res) => {
    try {
        const { orderId } = req.params;
        console.log("111111.canselation id:",orderId)
        const order = await Order.findById(orderId);
        console.log("2222222.canselation:",order)
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Check if the order is already delivered
        if (order.status === "Delivered") {
            return res.status(400).json({ success: false, message: "Cannot cancel a delivered order" });
        }

        // Update the order status to "Cancelled"
        order.status = "Cancelled";
        await order.save();

        res.json({ success: true, message: "Order cancelled successfully" });
    } catch (error) {
        console.error("Error cancelling order:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};






module.exports = {
    productDetails,
    addTocart,
    getCart,
    cartUpdate,
    removeCartItem,
    updateTotel,
    getCheckout,
    OrderSuccess,
    getOrderSuccess,
    cancelOrder,
};
