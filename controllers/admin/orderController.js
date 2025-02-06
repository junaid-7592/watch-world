const Order=require("../../models/orderSChema")
const User = require("../../models/userSchema")
const mongoose=require("mongoose");
const Razorpay = require("razorpay");
require("dotenv").config();


const showOrderList = async (req, res) => {
    try {
        const orders = await Order.find() 
        res.render('orderList', { orders })
    } catch (error) {
        console.error('Error fetching orders:', error)
        res.status(500).send('Server Error')
    }
};

const getViewOrderdetails=async(req,res)=>{
    try {
        const orderId = req.params.id;//  varunna params nn id eduthu
          const order = await Order.findOne({ _id: orderId })
          .populate('userId')  
        .populate('orderedItems.product')
        // console .log("8888888888888",order.orderedItems)
        // 



        res.render('orderdetailsVew', { order :order})
        
        
    } catch (error) {
        console.error('Error fetching orders:', error)
        res.status(500).send('Server Error')
    }   
}




const updateStatus=  async (req, res) => {           //router.post("/orders/:orderId/update-status"
console.log("koooooooooooooooooi   111111111111");

    try {
        const { orderId } = req.params; // Get Order ID from URL
        console.log( "this comming from feach:",orderId);
        
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

  


module.exports = {
     showOrderList,
     getViewOrderdetails,
     updateStatus,
     canselOrder,

     };
