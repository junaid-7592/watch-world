
const User = require("../../models/userSchema");
const mongoose = require("mongoose");
const Order = require("../../models/orderSChema")
const Coupon=require("../../models/coupenSchema")
const Transaction=require("../../models/transactionSchema")


const Wallet=require("../../models/walletSchema")

    

const refundToWallet = async (req, res) => {
    try {
        // req.session.user = findUser._id; 
        const userId=req.session.user
        // console.log(userId)
        
        const { orderId, amount } = req.body// Taking user ID, order ID, and refund amount
        
        //  console.log("222222222",orderId)
        //  console.log("33333333333",amount)
        if ( !orderId || !amount) {

            return res.status(400).json({ message: 'All details required.******* 55555555555' }); // Checking if any data is missing
        }

        

        let wallet = await Wallet.findOne({ userId}); // Checking if the user already has a wallet
        // console.log("-------------------------");
        
        console.log(wallet)
        if (!wallet) {
            console.log('kg');
            
            wallet = new Wallet({ userId, balance: 0,}); // If not, creating a new wallet
            console.log(wallet)
        }


       

     // Adding transaction to the wallet
        wallet.balance += Number(amount); // Updating wallet balance

        await wallet.save(); // Saving wallet details

        // Storing transaction in a separate transaction schema
         await Transaction.create({
            walletId:wallet._id,
            userId,
            orderId,
            type: 'credit',
            amount,
            
            status: 'success',
            date: new Date()

        });
      
   //  await newTransaction.save()

        res.status(200).json({ message: 'Amount credited to wallet', balance: wallet.balance ,success:true });

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
      

     

 const showWallet= async (req, res) => {
    console.log("rrrrrrrrrrrrrrrrr")
    try {
        const userId=req.session.user
        
        console.log('user'+userId)// Getting user ID from the request parameters
        
        const wallet = await Wallet.findOne({ userId });
        const transactions = await Transaction.find({ userId });
        console.log(wallet,transactions)
        console.log("jjjjjjjjjjjjj")
        if (!wallet) {
console.log("kkkkkkkkkkkkkkkkkkkkk");

            return res.render('wallet', { balance: 1000, transactions: [] }); // If no wallet found, show 0 balance
        }
console.log("ggggggggggggggg",wallet,transactions)
        res.render('wallet', { balance: wallet.balance, transactions:transactions });

    } catch (error) {
        res.status(500).send('Server error');
    }
};
              

                   

module.exports={
    refundToWallet,
    showWallet,

}