const router = require("express").Router();

// controllers
const { getAllCategories, createCategory, updateCategory, deleteCategory, getByCategoryId } = require("../controllers/category.controller");
const { auth } = require("../middlewares/auth");

// middlewares
const { roleAuth } = require('../middlewares/roleAuth');

//validation middlewares
const { categoryValidator } = require("../validators/categories/category.validator");

router.post("/", auth, roleAuth("Superadmin", "Admin", "Supervisor"), categoryValidator, createCategory);
router.put("/:id", auth, roleAuth("Superadmin", "Admin", "Supervisor"), categoryValidator, updateCategory);
router.delete("/:id", auth, roleAuth("Superadmin", "Admin", "Supervisor"), deleteCategory);

//---------------------- can do all users ----------------------
router.get("/", getAllCategories);
router.get("/:id", getByCategoryId);

module.exports = router;
