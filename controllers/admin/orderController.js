const Order=require("../../models/orderSChema")
const User = require("../../models/userSchema")
const mongoose=require("mongoose");
const Razorpay = require("razorpay");
const Wallet=require("../../models/walletSchema")
const Transaction=require("../../models/transactionSchema")
require("dotenv").config();


// const showOrderList = async (req, res) => {
//     try {
//         const orders = await Order.find() 
//         res.render('orderList', { orders })
//     } catch (error) {
//         console.error('Error fetching orders:', error)
//         res.status(500).send('Server Error')
//     }
// };


const showOrderList = async (req, res) => {
    try {
        let page = parseInt(req.query.page) || 1; // Default to page 1
        let limit = 10; // Number of orders per page
        let skip = (page - 1) * limit;

        // Fetch orders with pagination and sort by createdAt (Descending)
        const orders = await Order.find()
            .sort({ createdAt: -1 }) // Sort by latest orders first
            .skip(skip)
            .limit(limit)
            .lean(); // Convert to plain JS object for performance

        const totalOrders = await Order.countDocuments(); // Count total orders
        const totalPages = Math.ceil(totalOrders / limit); // Calculate total pages

        res.render('orderList', { orders, currentPage: page, totalPages });

    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send('Server Error');
    }
};




const getViewOrderdetails=async(req,res)=>{
    try {
        const orderId = req.params.id;//  varunna params nn id eduthu
          const order = await Order.findOne({ _id: orderId })
          .populate('userId')  
        .populate('orderedItems.product')
        // console .log("8888888888888",order.orderedItems)
        

        console.log(order);
        


        res.render('orderdetailsVew', { order :order})
        
        
    } catch (error) {
        console.error('Error fetching orders:', error)
        res.status(500).send('Server Error')
    }   
}




const updateStatus=  async (req, res) => {           //router.post("/orders/:orderId/update-status"
// console.log("koooooooooooooooooi   111111111111");

    try {
        const { orderId } = req.params; // Get Order ID from URL
        // console.log( "this comming from feach:",orderId);
        
        const { status } = req.body; // Get new status from request body
        

        // Update order status in MongoDB
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { status: status },
            { new: true } // Return updated document
        );

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: " Order not found" });
        }

        res.json({ success: true, message: " Order status updated", order: updatedOrder });

    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ success: false, message: " Internal server error" });
    }
};



const canselOrder=async(req,res)=>{
    try{
    const { orderId } = req.params;
    const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        { status:"cancelled" },
        { new: true } 
        

    );res.json({ success: true, message: " Order status updated", order: updatedOrder });
}catch(error){
    console.error("Error updating order status:", error);
    res.status(500).json({ success: false, message: " Internal server error" });
   
}
}

const returnstatus = async (req, res) => {
    console.log("---------------+++++++++++");
    
    try {
        const orderId = req.params.orderId;
        const action = req.body.action;
        console.log(action,orderId);
        

        // Fetch the order from the database
        const order = await Order.findOne({ _id: orderId });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const userId = order.userId;
        const amount = order.totalPrice; // Refundable amount
        
        let wallet = await Wallet.findOne({ userId });

        // If the action is approve and wallet does not exist, create a new wallet
        if (!wallet && action === 'approve') {
            wallet = new Wallet({
                userId: userId,
                balance: 0,
            });

            await wallet.save();
        }

        if (action === 'approve') {
            // Add refund amount to wallet balance
            wallet.balance += amount;
            await wallet.save();
const transaction=await Transaction.findOne({walletId:wallet._id})
            // Create a transaction entry
            await Transaction.create({
                walletId: wallet._id,
                userId: userId,
                associatedOrder: orderId, // Fixed key name
                type: 'credit',
                amount: amount,
                status: 'success',
                date: new Date(),
            });

            // Update order status
            order.refundStatus = 'Approved';
            order.status = 'Returned';

        } else if (action === 'reject') {
            // If the admin rejects the refund
            order.refundStatus = 'Rejected';
            order.status = 'Rejected';
        } else {
            return res.status(400).json({ success: false, message: "Invalid action" });
        }

        // Save the updated order
        await order.save();

        return res.status(200).json({
            success: true,
            message: `Return request ${action} successfully`,
        });

    } catch (error) {
        console.error("Error updating return status:", error);
        return res.status(500).json({ success: false, message: "Something went wrong while changing return status" });
    }
};

module.exports = {
     showOrderList,
     getViewOrderdetails,
     updateStatus,
     canselOrder,
     returnstatus,
     }
