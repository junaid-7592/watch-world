




const Razorpay = require("razorpay");
const User = require("../../models/userSchema");
const mongoose = require("mongoose");
const Product = require("../../models/productSchema");
const Cart = require("../../models/cartSchema");
const Address=require("../../models/addressSchema")
const Order=require("../../models/orderSChema")
const Coupon=require("../../models/coupenSchema")

const Wishlist = require("../../models/wishlistSchema");


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

        // console.log(productId,quantity)
       
        const product = await Product.findById(productId);
        if (!product) {
        
           return res.json({ success: true, message: "product not found" });


           
        }
        const price = product.salePrice || product.regularPrice; // Use salePrice if available, otherwise use regularPrice
        // console.log("price is", price);
        
        // console.log("price  is", price)

        let cart = await Cart.findOne({ userId });
        // console.log("2", cart);
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        // console.log("3", itemIndex);
        if (itemIndex > -1) {
            if(cart.items[itemIndex].quantity+quantity<=5){         
            }else{
              return  res.json({ success: false, message: "canot added  greatertahn 5 product", cart });   
            }
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
    const { itemId } = req.params;  
    const { quantity } = req.body;  

    if (!quantity || quantity < 1) {
        return res.status(400).json({ success: false, message: "Invalid quantity" });
    }

    try {
        const updatedCart = await Cart.findOneAndUpdate(
            { 'items._id': itemId },
            { $set: { 'items.$.quantity': quantity } },
            { new: true }
        );

        if (!updatedCart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

       
        const updatedItem = updatedCart.items.find(item => item._id.toString() === itemId);
        if (!updatedItem) {
            return res.status(404).json({ success: false, message: "Item not found in cart" });
        }

        
        const updatedPrice = (updatedItem.price * updatedItem.quantity).toFixed(2);

        
        res.json({
            success: true,
            item: {
                ...updatedItem.toObject(), 
                total: updatedPrice      
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

        let grandTotal = subTotal;


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
      const cart = await Cart.findOne({ userId }).populate("items.productId");
      const coupons = await Coupon.find();
      const addressData = await Address.find({ userId }).populate("address");
  
    //   console.log("000000000000000", addressData);
    //   console.log("Fetched Address Data:", JSON.stringify(addressData, null, 2)); 

  
      if (!cart) {
        return res.status(404).send("Cart not found"); // Added return to prevent further execution
      }
  
      // Calculate subtotal
      let subtotal = cart.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );
  
      // Apply shipping logic
      let shipping = 0;
      if (subtotal >= 1000) {
        shipping = 0;
      } else if (subtotal >= 500) {
        shipping = 30;
      } else {
        shipping = 50;
      }
  
      res.render("checkout", {
        cart,
        coupons,
        subTotal: subtotal,
        shippingAmount: shipping,
        discountAmount: 0,
        total: subtotal + shipping,
        address: addressData.length > 0 ? addressData[0].address : [], // Extract only addresses
      });
      
  
    //   console.log("uuuuuuuuuuuuu", addressData); // Fixed variable name
  
    } catch (error) {
      console.error("Error rendering checkout page:", error);
      res.status(500).send("Internal Server Error");
    }
  };
  
const applyCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;
        // console.log(couponCode)
        const userId = req.session.user;
        const cart = await Cart.findOne({ userId }).populate("items.productId");

        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        const coupon = await Coupon.findOne({ code: couponCode });
        console.log("coupon-1",couponCode);

        if (!coupon) {
            return res.json({ success: false, message: "Invalid coupon code" });
        }

        let subtotal = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        let discount = 0;

        // Apply coupon discount logic
        if (coupon.discountType === "percentage") {
            discount = (subtotal * coupon.discountValue) / 100;
            if (coupon.maxDiscount && discount > coupon.maxDiscount) {
                discount = coupon.maxDiscount;
            }
        } else if (coupon.discountType === "fixed") {
            discount = coupon.discountValue;
        }

        // Ensure discount does not exceed subtotal
        if (discount > subtotal) {
            discount = subtotal;
        }

        // Apply shipping logic
        let shipping = 0;
        let totalAfterDiscount = subtotal - discount;
        if (totalAfterDiscount >= 1000) {
            shipping = 0;
        } else if (totalAfterDiscount >= 500) {
            shipping = 30;
        } else {
            shipping = 50;
        }

        let total = totalAfterDiscount + shipping;

        // Store applied coupon in database
        cart.appliedCoupon = couponCode;
        await cart.save();

        res.json({
            success: true,
            subTotal: subtotal.toFixed(2),
            discountAmount: discount.toFixed(2),
            shippingAmount: shipping.toFixed(2),
            total: total.toFixed(2),
            message: "Coupon applied successfully!"
        });

    } catch (error) {
        console.error("Error applying coupon:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
      

const OrderSuccess = async (req, res) => {
    console.log("------->OrderSuccess");
    
    try {
        const { userId, cartId, selectedAddress,paymentMethod,discountValue,subTotalvalue} = req.body;
        console.log({ userId, cartId, selectedAddress,paymentMethod,discountValue,subTotalvalue});
        
       
        if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
            return res.status(400).json({ success: false, message: "use valid user ID ." });
        }

        // (2) **Check if Cart Exists**
        const cart = await Cart.findOne({ userId });
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty so add items." });
        }

        // (3) **Stock & Total Amount Check*
        let totalAmount = 0;
        const updatedItems = [];

        for (const item of cart.items) {
            const product = await Product.findById(item.productId);

            if (!product) {
                return res.status(400).json({ success: false, message: `Item ${item.productId} not available product` });
            }
            if (product.quantity <= 0) {
                return res.status(400).json({ success: false, message: `Item ${product.name} out of stock .` });
            }
            
            
            updatedItems.push({ product: product._id, price: product.salePrice, quantity: item.quantity });

            // Stock reduce cheyyuka 
            product.quantity -= item.quantity;
            await product.save();
        }
     
        if (subTotalvalue < 150) {
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
            discount:discountValue,
            totalPrice:subTotalvalue,
            finalAmount:subTotalvalue,
            status:"Processing",
            address:orderAddress ,
            paymentMethod:paymentMethod,
            
        });

        await newOrder.save();

        const product = await Product.find()

        // (6) **Delete User Cart After Order**
        await Cart.deleteOne({ userId });

        // **Success Response**
        res.status(200).json({ success: true, message: "Order successfully placed!", orderId: newOrder._id });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, message: "somethig went wrong"});
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


const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: "Order not found" 
            });
        }

        // Check if the order is already delivered
        if (order.status === "Delivered") {
            return res.status(400).json({ 
                success: false, 
                message: "Cannot cancel a delivered order" 
            });
        }

        // Check if order is already cancelled
        if (order.status === "Cancelled") {
            return res.status(400).json({ 
                success: false, 
                message: "Order is already cancelled" 
            });
        }

        // Increment product quantities back to stock
        for (const item of order.orderedItems) {
            const product = await Product.findById(item.product);
            
            if (product) {
                // Increment the product quantity
                product.quantity += item.quantity;
                
                // Update product status if it was out of stock
                if (product.status === "out of stock" && product.quantity > 0) {
                    product.status = "Available";
                }
                
                await product.save();
            }
        }

        // Update the order status to "Cancelled"
        order.status = "Cancelled";
        await order.save();

        res.json({ 
            success: true, 
            message: "Order cancelled successfully and stock updated" 
        });

    } catch (error) {
        console.error("Error cancelling order:", error);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY,
    key_secret: process.env.RAZORPAY_SECRET,
  });

  const CreateOrderRazaorpay= async (req, res) => {
    const options = {
      amount: req.body.amount * 100, // Amount in paise (INR 100 = 10000)
      currency: "INR",
      receipt: "order_rcptid_11",

      payment_capture: 1, // Auto capture
    };
  
    try {
      const order = await razorpay.orders.create(options);
      
      res.json(order);
    } catch (error) {
        console.log(error)
      res.status(500).json({ error: error.message });
    }
  };



// --------------------------------------------------------


  
  // Get wishlist items
  const getWishlist = async (req, res) => {
      try {
          const userId = req.user.id; // Assuming user is authenticated
          const wishlist = await Wishlist.findOne({ userId }).populate('products.productId');
  
          res.render('wishlist', { wishlist: wishlist ? wishlist.products : [] });
      } catch (error) {
          res.status(500).json({ error: 'Failed to fetch wishlist' });
      }
  };
  
  // Add product to wishlist
  const addToWishlist = async (req, res) => {
      try {
          const { productId } = req.body;
          const userId = req.user.id;
  
          let wishlist = await Wishlist.findOne({ userId });
          if (!wishlist) {
              wishlist = new Wishlist({ userId, products: [] });
          }
  
          if (!wishlist.products.some(p => p.productId.equals(productId))) {
              wishlist.products.push({ productId });
              await wishlist.save();
          }
  
          res.json({ success: true, message: 'Added to wishlist' });
      } catch (error) {
          res.status(500).json({ error: 'Failed to add to wishlist' });
      }
  };
  
  // Remove product from wishlist
//   exports.removeFromWishlist = async (req, res) => {
//       try {
//           const { productId } = req.body;
//           const userId = req.user.id;
  
//           const wishlist = await Wishlist.findOneAndUpdate(
//               { userId },
//               { $pull: { products: { productId } } },
//               { new: true }
//           );
  
//           res.json({ success: true, message: 'Removed from wishlist' });
//       } catch (error) {
//           res.status(500).json({ error: 'Failed to remove from wishlist' });
//       }
//   };
  
   // **Remove product from wishlist**

   const removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.user.id; // Ensure user is authenticated

        if (!userId || !productId) {
            return res.status(400).json({ success: false, message: "User ID and Product ID are required" });
        }

        // Remove the product from the wishlist
        const updatedWishlist = await Wishlist.findOneAndUpdate(
            { userId },
            { $pull: { items: { productId } } }, // Removes the product from wishlist
            { new: true }
        );

        if (!updatedWishlist) {
            return res.status(404).json({ success: false, message: "Wishlist not found" });
        }

        return res.json({ success: true, message: "Product removed from wishlist", wishlist: updatedWishlist });

    } catch (error) {
        console.error("Error removing product from wishlist:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}; 

  //bfor added to cart  
const removeInWhishlist= async (req, res) => {
    try {
        const { productId } = req.body; // Assuming productId is sent in the request body
        const userId = req.session.user; // Get user ID from session

        if (!userId || !productId) {
            return res.status(400).json({ success: false, message: "User ID and Product ID are required" });
        }

        // Find the user's wishlist
        const wishlist = await Wishlist.findOne({ userId });

        if (!wishlist) {
            return res.status(404).json({ success: false, message: "Wishlist not found" });
        }

        // Remove the product from the wishlist
        wishlist.products = wishlist.products.filter(item => item.toString() !== productId);
        
        // Save the updated wishlist
        await wishlist.save();

        return res.status(200).json({ success: true, message: "Product removed from wishlist", wishlist });
    } catch (error) {
        console.error("Error removing product from wishlist:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
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
    applyCoupon,
    CreateOrderRazaorpay,
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    removeInWhishlist,
}
