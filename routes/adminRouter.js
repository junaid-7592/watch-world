const express=require("express");
const router=express.Router();
const adminController=require("../controllers/admin/adminController");
const{userAuth,adminAuth}=require("../middlewares/auth");
const customerController=require("../controllers/admin/customerController")
const categoryController=require("../controllers/admin/categoryController")
const productController=require("../controllers/admin/productController")
const orderController=require("../controllers/admin/orderController")
const storage = require("../controllers/admin/productController");
const upload = require("../config/multer");






router.get("/pageerror",adminController.pageerror);
router.get("/login",adminController.loadlogin);
router.post("/login",adminController.login);
router.get("/logout",adminController.logout);

router.get('/', adminAuth,adminController.loadDashboard);
router.post('/export-pdf', adminController.exportPDF);
router.post('/export-excel', adminController.exportExcel);

router.get("/users",adminAuth,customerController.customerInfo);
router.get("/blockCustomer",adminAuth,customerController.customerBlocked);
router.get("/unblockCustomer",adminAuth,customerController.customerunBlocked);

router.get("/category",adminAuth,categoryController.categoryInfo);
router.post("/addCategory",upload.single("image"),adminAuth,categoryController.addCategory)
router.get("/listCategory",adminAuth,categoryController.getListCategory);
router.get("/unlistCategory",adminAuth,categoryController.getUnlistCategory);
router.get("/editCategory",adminAuth,categoryController.getEditCategory);
router.post("/editCategory/:id",adminAuth,categoryController.editCategory);
router.get("/products",adminAuth,productController.getAllProducts);
router.get("/blockProduct",adminAuth,productController.blockProduct)
router.get("/unblockProduct",adminAuth,productController.unblockProduct)
router.get("/editProduct/:id",adminAuth,productController.getEditProduct)
router.post("/editProduct/:id",adminAuth,productController.editProduct)
router.post("/deleteImage",adminAuth,productController.deleteSingleImage)
router.post('/croppedImage/:productId', upload.single("image"),productController.croppedImage)


router.post('/addCategoryOffer', categoryController.addCategoryOffer);
router.post('/removeCategoryOffer', categoryController.removeCategoryOffer);


//product Manegment

// GET route for the product add page
router.get("/addproducts", adminAuth, productController.getProductAddPage);

// POST route for adding a product
router.post("/addProducts",upload.array("images"), adminAuth, productController.addproducts);
// router.post("/addProducts",adminAuth,uploads.array("images",3), productController.addproducts);


//order management

router.get("/orderList",adminAuth,orderController.showOrderList)
router.get("/viewOrderdetails/:id",adminAuth,orderController.getViewOrderdetails)
// router.put("/chaingeStatus",adminAuth,orderController.statusChange)        
// router.put("/chaingeStatus", adminAuth, orderController.statusChange);

// router.put("/cancel/:id",adminAuth, orderController.cancelOrder);

 
router.put("/orders/update-status/:orderId", adminAuth, orderController.updateStatus);  // fetch(`/update-status/orders/${orderId}/
router.put("/orders/cancel-status/:orderId",adminAuth,orderController.canselOrder)

router.get("/coupenManagmentlist",adminAuth,adminController.coupenManagmentListget);
router.get("/addCoupon",adminAuth,adminController.addNewCoupon)
router.post("/coupons",adminAuth,adminController.newCouponAdd)

router.get("/updateCoupon/:id",adminAuth,adminController.lodeUpdateCoupon)
router.put("/Updatecoupons",adminAuth,adminController.updateCoupon)


router.get("/sales",adminAuth,adminController.getSalesreport)
router.post('/fetch-sales-report',adminAuth,adminController.fetchSalesReport);
router.get('/export-pdf',adminAuth,adminController. exportPDF);
router.get('/export-excel', adminAuth,adminController.exportExcel);

module.exports=router;
                                    