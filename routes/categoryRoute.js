const router = require("express").Router();

// controllers
const { getAllCategories, createCategory, updateCategory, deleteCategory, getByCategoryId, searchCategories } = require("../controllers/categoryCtrl");

// middlewares
const { uploadImages } = require('../middlewares/uploadImages');
const { roleAuth } = require('../middlewares/roleAuth');

//validation middlewares
const { categoryValidator } = require("../Validators/categories/categoryValidator");

router.post("/", roleAuth("Superadmin", "Admin", "Supervisor"), categoryValidator, uploadImages, createCategory);
router.put("/:id", roleAuth("Superadmin", "Admin", "Supervisor"), categoryValidator, uploadImages, updateCategory);
router.delete("/:id", roleAuth("Superadmin", "Admin", "Supervisor"), deleteCategory);
// // read
router.get("/", getAllCategories);
router.get("/:id", getByCategoryId);

router.get('/search/:key', searchCategories)

module.exports = router;
