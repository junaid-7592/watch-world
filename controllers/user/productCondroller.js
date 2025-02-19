




const Razorpay = require("razorpay");
require('dotenv').config()
const User = require("../../models/userSchema");
const mongoose = require("mongoose");
const Product = require("../../models/productSchema");
const Cart = require("../../models/cartSchema");
const Address = require("../../models/addressSchema")
const Order = require("../../models/orderSChema")
const Coupon = require("../../models/coupenSchema");

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");


const Wishlist = require("../../models/wishlistSchema");
const { log } = require("console");


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
            if (cart.items[itemIndex].quantity + quantity <= 5) {
            } else {
                return res.json({ success: false, message: "canot added  greatertahn 5 product", cart });
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
            return res.status(404).redirect("/Cart"); // Added return to prevent further execution
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
        console.log("coupon-1", couponCode);

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
    // console.log("------->OrderSuccess");

    try {
        const { userId, cartId, selectedAddress, paymentMethod, discountValue, subTotalvalue, couponCode } = req.body;
        // console.log("ths is order fdsxghf",req.body);
        if (paymentMethod === "cod" && subTotalvalue > 1000) {
            return res.status(400).json({ message: "Cash on Delivery is not allowed for orders above ₹1000." });
        }


        // console.log({ userId, cartId, selectedAddress,paymentMethod,discountValue,subTotalvalue});


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

        const orderAddress = ` ${adrs.name} ${adrs.city} ${adrs.landMark} ${adrs.state} ${adrs.pincode} ${adrs.phone} ${adrs.altPhone}`


        // (5) **Order Create & Save to Database**
        const newOrder = new Order({
            userId,
            orderedItems: updatedItems,
            discount: discountValue,
            totalPrice: subTotalvalue,
            paymentStatus: paymentMethod == 'cod' ? 'unpaid' : 'paid',
            finalAmount: subTotalvalue,
            status: "Processing",
            address: orderAddress,
            paymentMethod: paymentMethod,
            coupenApplied: couponCode ? true : false,
            couponCode: couponCode
        });

        await newOrder.save();

        const product = await Product.find()

        // (6) **Delete User Cart After Order**
        await Cart.deleteOne({ userId });

        // **Success Response**
        res.status(200).json({ success: true, message: "Order successfully placed!", orderId: newOrder._id });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, message: "somethig went wrong" });
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
        console.log("cancelOrder-------->>>>>>");
        const { orderId } = req.params;
        const cancelReson = req.body.reason
        console.log("cance reson", cancelReson);


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
        order.cancelReason = cancelReson;
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

const CreateOrderRazaorpay = async (req, res) => {


    const options = {
        amount: req.body.amount * 100, // Amount in paise (INR 100 = 10000)
        currency: "INR",
        receipt: "order_rcptid_11",
        payment_capture: 1, // Auto capture
    };
    console.log("hiiiiiiiiiiiiiiiiiiiiiiiiiii");
    console.log(req.body.amount);



    try {
        const order = await razorpay.orders.create(options);

        res.json(order);
    } catch (error) {
        console.error('Razorpay order creation error:', error)
        res.status(500).json({ error: error.message });
    }
};


const cancelOrderRazaorpay = async (req, res) => {
    console.log("----------------------->")
    try {


        // const { orderId, status } = req.body;
        // console.log(orderId)
        const newOrder = new Order({
            userId,
            orderedItems: updatedItems,
            discount: discountValue,
            totalPrice: subTotalvalue,
            paymentStatus: "unpaid",
            finalAmount: subTotalvalue,
            status: "Processing",
            address: orderAddress,
            paymentMethod: paymentMethod,
            coupenApplied: couponCode ? true : false,
            couponCode: couponCode
        });

        await newOrder.save();


        await Order.findByIdAndUpdate(orderId, { paymentStatus: status });

        res.status(200).json({ success: true, message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, message: 'Failed to update order status' });
    }
}




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
const removeInWhishlist = async (req, res) => {
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

const returnOrder = async (req, res) => {
    try {
        // console.log("Return controller------", req.body);
        const { orderId, reason } = req.body;

        if (!orderId || !reason) {
            return res.status(400).json({ success: false, message: "Order ID and reason are required." });
        }

        // Find the order by ID
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        // Update the order with reason and change status
        order.status = "Return-Request";
        order.returnReason = reason;

        await order.save();

        res.status(200).json({ success: true, message: "Return request submitted successfully." });

    } catch (error) {
        console.error("Error in order return:", error);
        res.status(500).json({ success: false, message: "Error processing return request." });
    }
};


const downloadInvoice = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId)
            .populate("userId")
            .populate("orderedItems.product");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Setup directories
        const invoiceDir = path.join(__dirname, "../invoices");
        if (!fs.existsSync(invoiceDir)) {
            fs.mkdirSync(invoiceDir, { recursive: true });
        }

        // Initialize PDF document
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            bufferPages: true
        });

        const fileName = `invoice_${orderId}.pdf`;
        const filePath = path.join(invoiceDir, fileName);

        // Setup PDF streams
        doc.pipe(fs.createWriteStream(filePath));
        doc.pipe(res);

        // Set response headers
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

        // Define styles
        const styles = {
            header: { fontSize: 28, font: 'Helvetica-Bold' },
            subHeader: { fontSize: 24, font: 'Helvetica-Bold' },
            sectionTitle: { fontSize: 14, font: 'Helvetica-Bold' },
            normal: { fontSize: 12, font: 'Helvetica' },
            small: { fontSize: 10, font: 'Helvetica' }
        };

        // Define colors
        const colors = {
            primary: '#2c3e50',
            secondary: '#f8f9fa',
            white: '#ffffff',
            black: '#000000'
        };

        // Company Header
        doc.font(styles.header.font)
            .fontSize(styles.header.fontSize)
            .text("YOUR COMPANY", { align: "center" });

        // Invoice Title
        doc.fontSize(styles.subHeader.fontSize)
            .text("INVOICE", { align: "center" });

        // Decorative Line
        doc.moveDown()
            .lineWidth(2)
            .moveTo(50, doc.y)
            .lineTo(545, doc.y)
            .stroke(colors.primary)
            .moveDown();

        // Define columns
        const leftColumn = 70;
        const rightColumn = 350;

        // Order Details (Left Column)
        doc.font(styles.sectionTitle.font)
            .fontSize(styles.sectionTitle.fontSize)
            .text("ORDER DETAILS", leftColumn);

        doc.font(styles.normal.font)
            .fontSize(styles.normal.fontSize)
            .moveDown()
            .text(`Order ID: ${order._id}`, leftColumn)
            .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, leftColumn)
            .text(`Payment Method: ${order.paymentMethod}`, leftColumn);

        // Customer Details (Right Column)
        doc.font(styles.sectionTitle.font)
            .fontSize(styles.sectionTitle.fontSize)
            .text("CUSTOMER DETAILS", rightColumn, doc.y - 85);

        doc.font(styles.normal.font)
            .fontSize(styles.normal.fontSize)
            .moveDown()
            .text(`Name: ${order.userId.name || "N/A"}`, rightColumn)
            .text(`Email: ${order.userId.email || "N/A"}`, rightColumn)
            .text(`Address: ${order.address}`, rightColumn, null, {
                width: 200,
                align: 'left'
            });

        // Products Table
        const tableTop = doc.y + 50;
        const tableHeaders = {
            number: { x: 50, width: 30 },
            product: { x: 90, width: 250 },
            price: { x: 340, width: 50 },
            quantity: { x: 420, width: 50 },
            total: { x: 480, width: 50 }
        };

        // Table Header Background
        doc.fillColor(colors.primary)
            .rect(50, tableTop - 20, 495, 25)
            .fill();

        // Table Headers
        doc.fillColor(colors.white)
            .font(styles.sectionTitle.font)
            .fontSize(styles.normal.fontSize)
            .text("No.", tableHeaders.number.x, tableTop - 15)
            .text("Product Name", tableHeaders.product.x, tableTop - 15)
            .text("Price", tableHeaders.price.x, tableTop - 15, { width: tableHeaders.price.width, align: "right" })
            .text("Qty", tableHeaders.quantity.x, tableTop - 15, { width: tableHeaders.quantity.width, align: "right" })
            .text("Total", tableHeaders.total.x, tableTop - 15, { width: tableHeaders.total.width, align: "right" });

    
        let currentY = tableTop + 15;
        let subTotal = 0;

        order.orderedItems.forEach((item, index) => {
            const {
                productName = "Unknown",
                salePrice = 0
            } = item.product || {};

            const total = salePrice * item.quantity;
            subTotal += total;

        
            if (index % 2 === 0) {
                doc.fillColor(colors.secondary)
                    .rect(50, currentY - 5, 495, 25)
                    .fill();
            }

            doc.fillColor(colors.black)
                .font(styles.normal.font)
                .fontSize(styles.normal.fontSize)
                .text(`${index + 1}`, tableHeaders.number.x, currentY)
                .text(productName, tableHeaders.product.x, currentY)
                .text(`${salePrice.toFixed(2)}`, tableHeaders.price.x, currentY, { width: tableHeaders.price.width, align: "right" })
                .text(`${item.quantity}`, tableHeaders.quantity.x, currentY, { width: tableHeaders.quantity.width, align: "right" })
                .text(`${total.toFixed(2)}`, tableHeaders.total.x, currentY, { width: tableHeaders.total.width, align: "right" });

            currentY += 30;
        });

        
        const totalSection = currentY + 30;

        
        doc.rect(350, totalSection, 195, 100)
            .fillAndStroke(colors.secondary, colors.primary);

        
        doc.font(styles.sectionTitle.font)
            .fontSize(styles.normal.fontSize)
            .fillColor(colors.primary)
            .text("Subtotal:", 370, totalSection + 20)
            .text(`${subTotal.toFixed(2)}`, 480, totalSection + 20, { align: "right" });

        if (order.discount > 0) {
            doc.text("Discount:", 370, totalSection + 45)
                .text(`-${order.discount.toFixed(2)}`, 480, totalSection + 45, { align: "right" });
        }

        doc.fontSize(styles.sectionTitle.fontSize)
            .text("Final Amount:", 370, totalSection + 70)
            .text(`${order.finalAmount.toFixed(2)}`, 480, totalSection + 70, { align: "right" });

        // Footer
        doc.font(styles.small.font)
            .fontSize(styles.small.fontSize)
            .text(
                "Thank you for your business!",
                50,
                doc.page.height - 50,
                { align: "center" }
            );

        doc.end();
    } catch (error) {
        console.error("Invoice generation error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const handleFailedOrder = async (req, res) => {
    try {

        const { cartId, userId, selectedAddress, paymentMethod, subTotalvalue, couponCode, discountValue } = req.body;

        if (!cartId || !userId || !selectedAddress || !paymentMethod || !subTotalvalue) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Find the existing order
        let order = await Order.findOne({ cartId, userId });
        console.log("...........1111111111")
        console.log(cartId, userId)

        if (!order) {
            // If order doesn't exist, create a new failed order entry
            order = new Order({
                cartId,
                userId,
                address: selectedAddress,
                paymentMethod,
                totalPrice: subTotalvalue,
                finalAmount: discountValue,
                couponCode: couponCode || null,
                status: "failed",
                createdAt: new Date(),
            });
        } else {
            // If order exists, update it to failed
            order.status = "Failed";
        }

        // Save the order
        await order.save();

        // return res.status(200).json({ message: "Order status updated to Failed" });

    } catch (error) {
        console.error("Error updating failed order:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};




const recreateOrderRazorpay = async (req, res) => {
    console.log("🔄 Razorpay retry initiated...");

    try {
        
        const { orderId } = req.body;
        if (!orderId) {
            return res.status(400).json({ success: false, message: "Order ID is required" });
        }

        // Find the existing order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        
        console.log(" Order Amount:", order.totalPrice);
        // Ensure payableAmount is valid
        if (!order.totalPrice || order.totalPrice <= 0) {
            return res.status(400).json({ success: false, message: "Invalid order amount" });
        }
        console.log("@#$%^&*()---0")
        // Initialize Razorpay
        const razorpayInstance = new Razorpay({
            
            key_id: process.env.RAZORPAY_KEY,
            key_secret: process.env.RAZORPAY_SECRET,
        });
        
        // Create a new Razorpay order
        const newOrder = await razorpayInstance.orders.create({
            amount: order.totalPrice * 100, // Convert to paise
            currency: "INR",
            receipt: `retry_${orderId}`,
        });

        // Update the existing order with new Razorpay order details
        order.razorpayOrderId = newOrder.id;
        order.razorpayPaymentStatus = "pending";
        await order.save();

        console.log(" Razorpay order created successfully:", newOrder);

        res.status(200).json({
            success: true,
            message: "Retry initiated successfully.",
            newOrder,
        });
    } catch (err) {
        console.error("Error in Razorpay retry:", err);
        res.status(500).json({
            success: false,
            error: "Failed to create Razorpay order for retry.",
        });
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
    returnOrder,
    downloadInvoice,
    cancelOrderRazaorpay,
    handleFailedOrder,
    recreateOrderRazorpay
}
