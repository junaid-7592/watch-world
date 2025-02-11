
//import user model

const Coupon = require('../../models/coupenSchema');
const User = require("../../models/userSchema");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");   //password compire
const Order = require('../../models/orderSChema');
const Product = require('../../models/productSchema');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');




const pageerror = async (req, res) => {
    res.render("admin-error")
}

const loadlogin = (req, res) => {
    if (req.session.admin) {
        return res.redirect("/admin/login")
    }
    res.render("adminlogin", { message: null })  //admin-login
}



const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(password)
        const admin = await User.findOne({ email, isAdmin: true });
        // console.log(admin);

        if (admin) {
            const passwordMarch = await bcrypt.compare(password, admin.password)



            if (passwordMarch) {
                req.session.admin = true;
                return res.redirect('/admin')
            } else {
                // return res.redirect("/login")
                return res.redirect("/admin/login?error=Incorrect password");
            }
        } else {
            // return res.status(500).render("login", { message: "Invalid credentials" });
            return res.redirect("/admin/login?error=User not found");


        }
    } catch (error) {
        console.log("log in error", error)
        return res.redirect("/pageerror")

    }
}



const loadDashboard=async(req,res)=>{
    if(req.session.admin){
        try {
            res.render("dashbord");
        } catch (error) {
          res.redirect("/pageerror")  
        }
    }

}



const logout = async (req, res) => {
    try {
        req.session.destroy(err => {
            if (err) {
                console.log("Error destroying session", err);
                return res.redirect("/pageerror")
            }
            res.redirect("/admin/login")
        })


    } catch (error) {
        console.log("unexpected error during logout", error);
        res.redirect("/pageerror")
    }
}


const coupenManagmentListget = async (req, res) => {
    try {
        if (!req.session.admin) {
            return res.redirect("/admin/login")
        }

        let Coupons = await Coupon.find()


        res.render("coupenManagment", { Coupons });


    } catch (error) {
        console.log("111111", error)
        res.redirect("/pageerror")
    }


}


const addNewCoupon = async (req, res) => {

    try {
        if (req.session.admin) {

            res.render("addCoupon");
        }
    } catch (error) {
        console.log("22222222", error)
        res.redirect("/login")
    }

}

const newCouponAdd = async (req, res) => {
    console.log("---> newCouponAdd");

    try {
        const { code, discountType, discountValue, maxDiscount, minPurchase, startDate, endDate, usageLimit, isActive } = req.body;

        if (!code || !discountType || !discountValue || !minPurchase || !startDate || !endDate || !usageLimit || !isActive) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }



        const existingCoupon = await Coupon.findOne({ code });
        if (existingCoupon) {
            return res.status(400).json({ success: false, message: 'Coupon code already exists.' });
        }

        const newCoupon = new Coupon({
            code,
            discountType,
            discountValue,
            maxDiscount,
            minPurchase,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            usageLimit,
            isActive,
        });
        console.log("=====>");

        await newCoupon.save();

        console.log("=====>");


        return res.status(201).json({ success: true, message: 'Coupon created successfully!' });

    } catch (error) {
        console.error('Error creating coupon:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const lodeUpdateCoupon = async (req, res) => {
    // console.log("----> lodeUpdateCoupon");

    try {
        if (!req.session.admin) {
            return res.redirect('/admin/login')
        }
        const { id } = req.params
        // console.log(id);

        const coupons = await Coupon.findById({ _id: id })
        // console.log(coupons);

        return res.render('updateCoupon', { coupons })


    } catch (error) {

        console.error('Error Updateing coupon:', error);
        res.status(500).json({ success: false, message: 'Internal server error' })


    }

};

const updateCoupon = async (req, res) => {
    console.log("--->updateCoupon");
    try {
        // console.log(req.body);

        const { code, discountType, discountValue, maxDiscount, minPurchase, startDate, endDate, usageLimit, isActive } = req.body;

        if (!code || !discountType || !discountValue || !minPurchase || !startDate || !endDate || !usageLimit || !isActive) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        const codeid = await Coupon.findOne({ code })

        let _id = codeid._id


        const updateCoupon = await Coupon.findByIdAndUpdate(
            _id,
            {
                $set: {
                    code,
                    discountType,
                    discountValue,
                    maxDiscount,
                    minPurchase,
                    startDate,
                    endDate,
                    usageLimit,
                    isActive
                }
            },
            { new: true }
        );

        if (!updateCoupon) {
            return res.status(404).json({
                success: false,
                message: "coupon not found"
            })
        }

        return res.status(200).json({
            success: true,
            message: "coupon update successfully"
        })


    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Eror loading copuon side update page" });
    }
};


const getSalesreport = async (req, res) => {
    try {
        const { reportType, startDate, endDate } = req.query;
        const page = parseInt(req.query.page) || 1; // Current page
        const limit = 10; // Items per page

        // Build date filter
        const dateFilter = {};
        if (reportType) {
            const now = new Date();
            switch (reportType) {
                case 'daily':
                    dateFilter.createdAt = {
                        $gte: new Date(now.setHours(0, 0, 0, 0)),
                        $lt: new Date(now.setHours(23, 59, 59, 999))
                    };
                    break;
                case 'weekly':
                    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
                    dateFilter.createdAt = {
                        $gte: new Date(weekStart.setHours(0, 0, 0, 0)),
                        $lt: new Date(now)
                    };
                    break;
                case 'monthly':
                    dateFilter.createdAt = {
                        $gte: new Date(now.getFullYear(), now.getMonth(), 1),
                        $lt: new Date(now.getFullYear(), now.getMonth() + 1, 0)
                    };
                    break;
                case 'custom':
                    if (startDate && endDate) {
                        dateFilter.createdAt = {
                            $gte: new Date(startDate),
                            $lt: new Date(new Date(endDate).setHours(23, 59, 59, 999))
                        };
                    }
                    break;
            }
        }

        // Calculate total documents for pagination
        const totalDocs = await Order.countDocuments(dateFilter);
        const totalPages = Math.ceil(totalDocs / limit);
        const skip = (page - 1) * limit;

        // Fetch orders with populated product details
        const orders = await Order.find(dateFilter)
            .populate('orderedItems.product')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Calculate statistics
        const totalSales = orders.reduce((sum, order) => sum + order.finalAmount, 0);
        const totalDiscounts = orders.reduce((sum, order) => sum + order.discount, 0);
        const orderCount = orders.length;

        res.render('salesReport', {
            orders,
            totalSales,
            totalDiscounts,
            orderCount,
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            nextPage: page + 1,
            prevPage: page - 1,
            lastPage: totalPages,
            reportType: reportType || '',
            startDate: startDate || '',
            endDate: endDate || ''
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).send('Error loading dashboard');
    }
}

// Generate and download PDF report
const exportPDF = async (req, res) => {
    try {
        const orders = await Order.find(req.body.dateFilter)
            .populate('orderedItems.product');

        const doc = new PDFDocument();
        doc.pipe(res);

        // Add header
        doc.fontSize(20).text('Sales Report', { align: 'center' });
        doc.moveDown();

        // Add report period
        doc.fontSize(12).text(`Report Period: ${req.body.reportType}`, { align: 'left' });
        doc.moveDown();

        // Add table headers
        const tableTop = 150;
        doc.fontSize(10)
            .text('Date', 50, tableTop)
            .text('Order ID', 150, tableTop)
            .text('Amount', 300, tableTop)
            .text('Discount', 400, tableTop)
            .text('Final', 500, tableTop);

        // Add order data
        let y = tableTop + 20;
        orders.forEach(order => {
            doc.fontSize(10)
                .text(new Date(order.createdAt).toLocaleDateString(), 50, y)
                .text(order._id.toString(), 150, y)
                .text(order.totalPrice.toString(), 300, y)
                .text(order.discount.toString(), 400, y)
                .text(order.finalAmount.toString(), 500, y);
            y += 20;
        });

        doc.end();
    } catch (error) {
        console.error('PDF Export Error:', error);
        res.status(500).send('Error generating PDF');
    }
}

// Generate and download Excel report
const exportExcel = async (req, res) => {
    try {
        const orders = await Order.find(req.body.dateFilter)
            .populate('orderedItems.product');

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

        // Add headers
        worksheet.columns = [
            { header: 'Date', key: 'date' },
            { header: 'Order ID', key: 'orderId' },
            { header: 'Products', key: 'products' },
            { header: 'Total Amount', key: 'totalAmount' },
            { header: 'Discount', key: 'discount' },
            { header: 'Final Amount', key: 'finalAmount' },
            { header: 'Payment Method', key: 'paymentMethod' },
            { header: 'Status', key: 'status' }
        ];

        // Add data
        orders.forEach(order => {
            worksheet.addRow({
                date: new Date(order.createdAt).toLocaleDateString(),
                orderId: order._id.toString(),
                products: order.orderedItems.map(item =>
                    `${item.product.productName} (x${item.quantity})`
                ).join(', '),
                totalAmount: order.totalPrice,
                discount: order.discount,
                finalAmount: order.finalAmount,
                paymentMethod: order.paymentMethod,
                status: order.status
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=sales-report.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Excel Export Error:', error);
        res.status(500).send('Error generating Excel file');
    }
}

const fetchSalesReport = async (req, res) => {
    try {
        const { reportType, startDate, endDate } = req.body;

        // Build date filter
        const dateFilter = {};
        if (reportType) {
            const now = new Date();
            switch (reportType) {
                case 'daily':
                    dateFilter.createdAt = {
                        $gte: new Date(now.setHours(0, 0, 0, 0)),
                        $lt: new Date(now.setHours(23, 59, 59, 999))
                    };
                    break;
                case 'weekly':
                    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
                    dateFilter.createdAt = {
                        $gte: new Date(weekStart.setHours(0, 0, 0, 0)),
                        $lt: new Date(now)
                    };
                    break;
                case 'monthly':
                    dateFilter.createdAt = {
                        $gte: new Date(now.getFullYear(), now.getMonth(), 1),
                        $lt: new Date(now.getFullYear(), now.getMonth() + 1, 0)
                    };
                    break;
                case 'custom':
                    if (startDate && endDate) {
                        dateFilter.createdAt = {
                            $gte: new Date(startDate),
                            $lt: new Date(new Date(endDate).setHours(23, 59, 59, 999))
                        };
                    }
                    break;
            }
        }

        // Fetch orders
        const orders = await Order.find(dateFilter)
            .populate('orderedItems.product')
            .sort({ createdAt: -1 });

        // Calculate statistics
        const totalSales = orders.reduce((sum, order) => sum + order.finalAmount, 0);
        const totalDiscounts = orders.reduce((sum, order) => sum + order.discount, 0);
        const orderCount = orders.length;

        res.json({ orders, totalSales, totalDiscounts, orderCount });

    } catch (error) {
        console.error('Fetch Sales Report Error:', error);
        res.status(500).json({ error: 'Error fetching report' });
    }
};




module.exports = {
    loadlogin,
    login,
    loadDashboard,
    pageerror,
    logout,
    coupenManagmentListget,
    addNewCoupon,
    newCouponAdd,
    lodeUpdateCoupon,
    updateCoupon,
    exportExcel,
    exportPDF,
    getSalesreport,
    fetchSalesReport

}









