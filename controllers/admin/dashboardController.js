const Order = require('../../models/orderSChema');
const Product = require('../../models/productSchema');
const User = require('../../models/userSchema');
const Category = require('../../models/category');

/**
 * Loads dashboard with analytics data
 */
const loadDashboard = async (req, res) => {
    try {
        // Set up date variables for filtering
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const monthStart = new Date(currentYear, currentMonth, 1);
        const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
        
        // Get counts with month-over-month comparison
        const [
            productCount,
            productCountThisMonth,
            orderCount,
            orderCountThisMonth,
            customers,
            customersThisMonth,
            categories,
            categoriesThisMonth,
            totalRevenue,
            totalRevenueThisMonth
        ] = await Promise.all([
            Product.countDocuments(),
            Product.countDocuments({ createdAt: { $gte: monthStart, $lte: monthEnd } }),
            Order.countDocuments(),
            Order.countDocuments({ createdAt: { $gte: monthStart, $lte: monthEnd } }),
            User.countDocuments({ role: 'customer' }),
            User.countDocuments({ role: 'customer', createdAt: { $gte: monthStart, $lte: monthEnd } }),
            Category.countDocuments(),
            Category.countDocuments({ createdAt: { $gte: monthStart, $lte: monthEnd } }),
            Order.aggregate([{ $group: { _id: null, total: { $sum: "$finalAmount" } } }])
                .then(result => result.length > 0 ? result[0].total : 0),
            Order.aggregate([
                { $match: { createdAt: { $gte: monthStart, $lte: monthEnd } } },
                { $group: { _id: null, total: { $sum: "$finalAmount" } } }
            ]).then(result => result.length > 0 ? result[0].total : 0)
        ]);

        // Fetch top-selling products with more details
        const topSellingProducts = await Order.aggregate([
            { $unwind: "$orderedItems" },
            {
                $group: {
                    _id: "$orderedItems.product",
                    totalSales: { $sum: "$orderedItems.quantity" },
                    revenue: { $sum: { $multiply: ["$orderedItems.quantity", "$orderedItems.price"] } }
                }
            },
            { $sort: { revenue: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" },
            {
                $project: {
                    productName: "$productDetails.productName",
                    totalSales: 1,
                    revenue: 1,
                    sku: "$productDetails.sku"
                }
            }
        ]);

        // Fetch top categories with item count and total sales
        const topCategories = await Order.aggregate([
            { $unwind: "$orderedItems" },
            {
                $lookup: {
                    from: "products",
                    localField: "orderedItems.product",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" },
            {
                $lookup: {
                    from: "categories",
                    localField: "productDetails.category",
                    foreignField: "_id",
                    as: "categoryDetails"
                }
            },
            { $unwind: "$categoryDetails" },
            {
                $group: {
                    _id: {
                        categoryId: "$categoryDetails._id",
                        categoryName: "$categoryDetails.name"
                    },
                    totalSales: { $sum: { $multiply: ["$orderedItems.quantity", "$orderedItems.price"] } },
                    itemsSold: { $sum: "$orderedItems.quantity" }
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "_id.categoryId",
                    foreignField: "category",
                    as: "products"
                }
            },
            {
                $project: {
                    _id: 0,
                    name: "$_id.categoryName",
                    totalSales: 1,
                    itemsSold: 1,
                    items: { $size: "$products" }
                }
            },
            { $sort: { totalSales: -1 } },
            { $limit: 5 }
        ]);

        // Fetch top brands
        const topBrands = await Order.aggregate([
            { $unwind: "$orderedItems" },
            {
                $lookup: {
                    from: "products",
                    localField: "orderedItems.product",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" },
            {
                $group: {
                    _id: "$productDetails.brand",
                    totalSales: { $sum: { $multiply: ["$orderedItems.quantity", "$orderedItems.price"] } },
                    unitsSold: { $sum: "$orderedItems.quantity" }
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "brand",
                    as: "products"
                }
            },
            {
                $project: {
                    name: "$_id",
                    totalSales: 1,
                    unitsSold: 1,
                    products: { $size: "$products" }
                }
            },
            { $sort: { totalSales: -1 } },
            { $limit: 5 }
        ]);

        // Fetch sales data for charts based on different time periods
        const timePeriodsData = await generateTimePeriodsData();

        // Fetch order status data
        const orderStatusData = await Order.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Render dashboard with comprehensive data
        res.render("dashbord", {
            productCount,
            productCountThisMonth,
            orderCount,
            orderCountThisMonth,
            customers,
            customersThisMonth,
            categories,
            categoriesThisMonth,
            totalRevenue,
            totalRevenueThisMonth,
            topSellingProducts,
            topCategories,
            topBrands,
            timePeriodsData,
            orderStatusData
        });
    } catch (err) {
        console.error('Dashboard loading error:', err);
        res.status(500).render('error', { message: 'Error loading dashboard', error: err });
    }
};

/**
 * Generates time period data for dashboard charts
 */
const generateTimePeriodsData = async () => {
    try {
        // Get data for different time periods
        const [dailyData, weeklyData, monthlyData, yearlyData] = await Promise.all([
            getDailyData(),
            getWeeklyData(),
            getMonthlyData(),
            getYearlyData()
        ]);

        return {
            '1': dailyData,
            '7': weeklyData,
            '30': monthlyData,
            '360': yearlyData
        };
    } catch (error) {
        console.error('Error generating time periods data:', error);
        // Return empty data structure to avoid breaking the UI
        return {
            '1': { labels: [], sales: [], revenue: [], orderStatus: [] },
            '7': { labels: [], sales: [], revenue: [], orderStatus: [] },
            '30': { labels: [], sales: [], revenue: [], orderStatus: [] },
            '360': { labels: [], sales: [], revenue: [], orderStatus: [] }
        };
    }
};

/**
 * Fetches sales report based on specified criteria
 */
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
                    const weekStart = new Date(now);
                    weekStart.setDate(now.getDate() - now.getDay());
                    weekStart.setHours(0, 0, 0, 0);
                    dateFilter.createdAt = {
                        $gte: weekStart,
                        $lt: now
                    };
                    break;
                case 'monthly':
                    dateFilter.createdAt = {
                        $gte: new Date(now.getFullYear(), now.getMonth(), 1),
                        $lt: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
                    };
                    break;
                case 'yearly':
                    dateFilter.createdAt = {
                        $gte: new Date(now.getFullYear(), 0, 1),
                        $lt: new Date(now.getFullYear() + 1, 0, 1)
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
                default:
                    // Default to last 30 days if no valid report type
                    const thirtyDaysAgo = new Date(now);
                    thirtyDaysAgo.setDate(now.getDate() - 30);
                    dateFilter.createdAt = { $gte: thirtyDaysAgo, $lt: now };
            }
        }

        const orders = await Order.find(dateFilter)
            .populate({
                path: 'orderedItems.product',
                select: 'productName price discount brand category'
            })
            .populate('userId', 'User')
            .sort({ createdAt: -1 });

        // Calculate statistics
        const totalSales = orders.reduce((sum, order) => sum + order.finalAmount, 0);
        const totalDiscounts = orders.reduce((sum, order) => sum + (order.discount || 0), 0);
        const totalRevenue = totalSales; // finalAmount already accounts for discounts
        const orderCount = orders.length;
        const averageOrderValue = orderCount > 0 ? totalSales / orderCount : 0;

        // Get daily breakdown for the period
        const dailyBreakdown = await Order.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    sales: { $sum: "$finalAmount" },
                    orders: { $sum: 1 },
                    discount: { $sum: { $ifNull: ["$discount", 0] } }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            data: {
                orders,
                totalSales,
                totalDiscounts,
                totalRevenue,
                orderCount,
                averageOrderValue,
                dailyBreakdown
            }
        });
    } catch (error) {
        console.error('Fetch Sales Report Error:', error);
        res.status(500).json({ success: false, error: 'Error fetching report: ' + error.message });
    }
};

/**
 * Gets sales reports for a specified time period
 */
const getSalesReports = async (req, res) => {
    try {
        const filter = req.query.filter || '30'; // Default to 30 days
        let startDate;
        const endDate = new Date();

        // Set start date based on filter
        switch (filter) {
            case '7':
                startDate = new Date(new Date().setDate(new Date().getDate() - 7));
                break;
            case '30':
                startDate = new Date(new Date().setDate(new Date().getDate() - 30));
                break;
            case '90':
                startDate = new Date(new Date().setDate(new Date().getDate() - 90));
                break;
            case '180':
                startDate = new Date(new Date().setDate(new Date().getDate() - 180));
                break;
            case '360':
                startDate = new Date(new Date().setDate(new Date().getDate() - 360));
                break;
            default:
                startDate = new Date(new Date().setDate(1)); // Current month
        }

        // Get detailed sales report
        const salesReport = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    totalSales: { $sum: "$finalAmount" },
                    totalOrders: { $sum: 1 },
                    totalDiscount: { $sum: { $ifNull: ["$discount", 0] } },
                    // finalAmount already accounts for discounts, so this is simpler
                    totalRevenue: { $sum: "$finalAmount" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Calculate period totals
        const periodTotals = {
            totalSales: salesReport.reduce((sum, day) => sum + day.totalSales, 0),
            totalOrders: salesReport.reduce((sum, day) => sum + day.totalOrders, 0),
            totalDiscount: salesReport.reduce((sum, day) => sum + day.totalDiscount, 0),
            totalRevenue: salesReport.reduce((sum, day) => sum + day.totalRevenue, 0),
        };

        // Get previous period for comparison
        const previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - parseInt(filter));
        
        const previousPeriodReport = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: previousStartDate,
                        $lt: startDate
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: "$finalAmount" },
                    totalOrders: { $sum: 1 },
                    totalDiscount: { $sum: { $ifNull: ["$discount", 0] } },
                    totalRevenue: { $sum: "$finalAmount" } 
                }
            }
        ]);

        // Calculate growth rates with protection against division by zero
        const previousPeriod = previousPeriodReport.length > 0 ? previousPeriodReport[0] : {
            totalSales: 0, totalOrders: 0, totalDiscount: 0, totalRevenue: 0
        };

        const calculateGrowth = (current, previous) => {
            if (!previous || previous === 0) {
                return current > 0 ? 100 : 0; // If previous is 0 and current > 0, growth is 100%
            }
            return ((current - previous) / previous) * 100;
        };

        const growth = {
            salesGrowth: calculateGrowth(periodTotals.totalSales, previousPeriod.totalSales),
            ordersGrowth: calculateGrowth(periodTotals.totalOrders, previousPeriod.totalOrders),
            revenueGrowth: calculateGrowth(periodTotals.totalRevenue, previousPeriod.totalRevenue)
        };

        res.json({
            success: true,
            data: {
                salesReport,
                periodTotals,
                growth,
                filter
            }
        });
    } catch (error) {
        console.error('Get Sales Reports Error:', error);
        res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
    }
};

/**
 * Gets daily sales data broken down by time periods
 */
async function getDailyData() {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Create time segments for today (morning, afternoon, evening, night)
        const periods = [
            { name: 'Morning', start: new Date(today.setHours(0, 0, 0, 0)), end: new Date(today.setHours(11, 59, 59, 999)) },
            { name: 'Afternoon', start: new Date(today.setHours(12, 0, 0, 0)), end: new Date(today.setHours(17, 59, 59, 999)) },
            { name: 'Evening', start: new Date(today.setHours(18, 0, 0, 0)), end: new Date(today.setHours(21, 59, 59, 999)) },
            { name: 'Night', start: new Date(today.setHours(22, 0, 0, 0)), end: new Date(new Date(today).setDate(today.getDate() + 1)).setHours(0, 0, 0, 0) - 1 }
        ];

        const result = {
            labels: periods.map(p => p.name),
            sales: [],
            revenue: [],
            orderStatus: []
        };

        // Use aggregation for more efficient querying
        for (const period of periods) {
            const periodData = await Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: period.start, $lte: period.end }
                    }
                },
                {
                    $group: {
                        _id: null,
                        sales: { $sum: "$finalAmount" },
                        revenue: { $sum: "$finalAmount" } // finalAmount already accounts for discounts
                    }
                }
            ]);

            const periodSales = periodData.length > 0 ? periodData[0].sales : 0;
            const periodRevenue = periodData.length > 0 ? periodData[0].revenue : 0;
            
            result.sales.push(periodSales);
            result.revenue.push(periodRevenue);
        }

        // Get order status distribution for today
        const statusData = await Order.aggregate([
            { $match: { createdAt: { $gte: new Date(today.setHours(0, 0, 0, 0)), $lte: new Date(today.setHours(23, 59, 59, 999)) } } },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        
        // Convert to array of counts in consistent order (use most common statuses)
        const statuses = ['Delivered', 'Processing', 'Shipped', 'Canceled'];
        result.orderStatus = statuses.map(status => {
            const found = statusData.find(s => s._id === status);
            return found ? found.count : 0;
        });

        return result;
    } catch (error) {
        console.error('Error getting daily data:', error);
        return { labels: [], sales: [], revenue: [], orderStatus: [] };
    }
}

/**
 * Gets weekly sales data
 */
async function getWeeklyData() {
    try {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - dayOfWeek);
        weekStart.setHours(0, 0, 0, 0);
        
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const result = {
            labels: dayNames,
            sales: Array(7).fill(0),
            revenue: Array(7).fill(0),
            orderStatus: []
        };

        // More efficient: use a single aggregation query instead of multiple queries
        const dailySales = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: weekStart, $lte: today }
                }
            },
            {
                $project: {
                    dayOfWeek: { $dayOfWeek: "$createdAt" },
                    finalAmount: 1,
                    discount: 1
                }
            },
            {
                $group: {
                    _id: { $subtract: ["$dayOfWeek", 1] }, // Convert to 0-based index
                    sales: { $sum: "$finalAmount" },
                    revenue: { $sum: "$finalAmount" } // finalAmount already accounts for discounts
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Populate the arrays with actual data
        dailySales.forEach(day => {
            const index = day._id;
            if (index >= 0 && index < 7) { // Ensure valid index
                result.sales[index] = day.sales;
                result.revenue[index] = day.revenue;
            }
        });

        // Get order status distribution for the week
        const statusData = await Order.aggregate([
            { $match: { createdAt: { $gte: weekStart, $lte: today } } },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        
        // Convert to array in consistent order
        const statuses = ['Delivered', 'Processing', 'Shipped', 'Canceled'];
        result.orderStatus = statuses.map(status => {
            const found = statusData.find(s => s._id === status);
            return found ? found.count : 0;
        });

        return result;
    } catch (error) {
        console.error('Error getting weekly data:', error);
        return { labels: [], sales: [], revenue: [], orderStatus: [] };
    }
}

/**
 * Gets monthly sales data
 */
async function getMonthlyData() {
    try {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const weeksInMonth = 5; // Max number of weeks to show
        
        const result = {
            labels: [],
            sales: [],
            revenue: [],
            orderStatus: []
        };

        // Pre-compute all week boundaries
        const weekBoundaries = [];
        const monthStart = new Date(year, month, 1);
        
        for (let i = 0; i < weeksInMonth; i++) {
            const weekStart = new Date(monthStart);
            weekStart.setDate(weekStart.getDate() + (i * 7));
            if (weekStart.getMonth() !== month) break; // Stop if we've gone to next month
            
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            
            // Don't include future weeks
            if (weekStart > today) break;
            const endDate = weekEnd > today ? today : weekEnd;
            
            weekBoundaries.push({
                start: weekStart,
                end: endDate,
                label: `Week ${i+1}`
            });
        }

        // More efficient: use a single aggregation query for all weeks
        const weeklyData = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: monthStart,
                        $lte: today
                    }
                }
            },
            {
                $project: {
                    weekNumber: {
                        $floor: {
                            $divide: [
                                { $subtract: ["$createdAt", monthStart] },
                                604800000 // milliseconds in a week
                            ]
                        }
                    },
                    finalAmount: 1
                }
            },
            {
                $group: {
                    _id: "$weekNumber",
                    sales: { $sum: "$finalAmount" },
                    revenue: { $sum: "$finalAmount" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Populate result with data from each week
        weekBoundaries.forEach((week, i) => {
            result.labels.push(week.label);
            
            // Find data for this week
            const weekData = weeklyData.find(w => w._id === i);
            result.sales.push(weekData ? weekData.sales : 0);
            result.revenue.push(weekData ? weekData.revenue : 0);
        });

        // Get order status distribution for the month
        const statusData = await Order.aggregate([
            { $match: { createdAt: { $gte: new Date(year, month, 1), $lte: today } } },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        
        // Convert to array in consistent order
        const statuses = ['Delivered', 'Processing', 'Shipped', 'Canceled'];
        result.orderStatus = statuses.map(status => {
            const found = statusData.find(s => s._id === status);
            return found ? found.count : 0;
        });

        return result;
    } catch (error) {
        console.error('Error getting monthly data:', error);
        return { labels: [], sales: [], revenue: [], orderStatus: [] };
    }
}

/**
 * Gets yearly sales data
 */
async function getYearlyData() {
    try {
        const today = new Date();
        const year = today.getFullYear();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const result = {
            labels: monthNames,
            sales: Array(12).fill(0),
            revenue: Array(12).fill(0),
            orderStatus: []
        };

        // More efficient: use a single aggregation query for all months
        const monthlyData = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(year, 0, 1),
                        $lte: today
                    }
                }
            },
            {
                $project: {
                    month: { $month: "$createdAt" },
                    finalAmount: 1
                }
            },
            {
                $group: {
                    _id: "$month",
                    sales: { $sum: "$finalAmount" },
                    revenue: { $sum: "$finalAmount" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Populate arrays with actual data (adjusting for 1-based month in MongoDB)
        monthlyData.forEach(month => {
            const index = month._id - 1; // Convert 1-based month to 0-based index
            if (index >= 0 && index < 12) { // Ensure valid index
                result.sales[index] = month.sales;
                result.revenue[index] = month.revenue;
            }
        });

        // Get order status distribution for the year
        const statusData = await Order.aggregate([
            { $match: { createdAt: { $gte: new Date(year, 0, 1), $lte: today } } },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        
        // Convert to array in consistent order
        const statuses = ['Delivered', 'Processing', 'Shipped', 'Canceled'];
        result.orderStatus = statuses.map(status => {
            const found = statusData.find(s => s._id === status);
            return found ? found.count : 0;
        });

        return result;
    } catch (error) {
        console.error('Error getting yearly data:', error);
        return { labels: [], sales: [], revenue: [], orderStatus: [] };
    }
}

module.exports = {
    loadDashboard,
    fetchSalesReport,
    getSalesReports
};