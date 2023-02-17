const router = require("express").Router();

// controllers
const { getAllCategories, createCategory, updateCategory, deleteCategory, getByCategoryId } = require("../controllers/category.controller");

// middlewares
const { roleAuth } = require('../middlewares/roleAuth');

//validation middlewares
const { categoryValidator } = require("../Validators/categories/category.validator");

router.post("/", roleAuth("Superadmin", "Admin", "Supervisor"), categoryValidator, createCategory);
router.put("/:id", roleAuth("Superadmin", "Admin", "Supervisor"), categoryValidator, updateCategory);
router.delete("/:id", roleAuth("Superadmin", "Admin", "Supervisor"), deleteCategory);

//---------------------- can do all users ----------------------
router.get("/", getAllCategories);
router.get("/:id", getByCategoryId);

module.exports = router;
