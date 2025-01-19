const multer = require("multer");
// const path = require("path");

// // Configure diskStorage
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         const uploadPath = path.join(__dirname, "..", "..", "public", "uploads", "product-images");
//         cb(null, uploadPath); // Specify the absolute path for the upload folder
//     },
//     filename: function (req, file, cb) {
//         const uniqueName = Date.now() + "-" + file.originalname;
//         cb(null, uniqueName); // Generate unique filenames
//     },
// });

// // Initialize multer
// const uploads = multer({ storage: storage });
const storage = new multer.memoryStorage();
const upload = multer({
  storage
})


// Export the multer instance
module.exports = upload;
