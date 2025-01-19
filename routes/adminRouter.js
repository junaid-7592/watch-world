const express=require("express");
const router=express.Router();
const adminController=require("../controllers/admin/adminController");
const{userAuth,adminAuth}=require("../middlewares/autyh");
const customerController=require("../controllers/admin/customerController")
const categoryController=require("../controllers/admin/categoryController")
const productController=require("../controllers/admin/productController");
const storage = require("../controllers/admin/productController");
const upload = require("../config/multer");






router.get("/pageerror",adminController.pageerror);
router.get("/login",adminController.loadlogin);
router.post("/login",adminController.login);
router.get("/logout",adminController.logout);
router.get("/",adminAuth,adminController.loadDashboard);
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



//product Manegment

// GET route for the product add page
router.get("/addproducts", adminAuth, productController.getProductAddPage);

// POST route for adding a product
router.post("/addProducts",upload.array("images"), adminAuth, productController.addproducts);
// router.post("/addProducts",adminAuth,uploads.array("images",3), productController.addproducts);









module.exports=router;
                                    