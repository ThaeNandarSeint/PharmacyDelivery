const router = require("express").Router();

// controllers
const { getAllCategories, createCategory, updateCategory, deleteCategory, getByCategoryId, searchCategories } = require("../controllers/categoryCtrl");

// middlewares
const { uploadImages } = require('../middlewares/uploadImages');

//validation middlewares
const { categoryValidator } = require("../Validators/categories/categoryValidator");

router.post("/", categoryValidator, uploadImages, createCategory);
router.put("/:id", categoryValidator, uploadImages, updateCategory);
router.delete("/:id", deleteCategory);
// // read
router.get("/", getAllCategories);
router.get("/:id", getByCategoryId);

router.get('/search/:key', searchCategories)

module.exports = router;
