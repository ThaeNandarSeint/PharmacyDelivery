const router = require("express").Router();

// controllers
const { getAllCategories, createCategory, updateCategory, deleteCategory, getByCategoryId } = require("../controllers/category.controller");

// middlewares
const { roleAuth } = require('../middlewares/roleAuth');
const { userAuth } = require("../middlewares/userAuth");

//validation middlewares
const { categoryValidator } = require("../validators/categories/category.validator");

router.post("/", userAuth, roleAuth("Superadmin", "Admin", "Supervisor"), categoryValidator, createCategory);
router.put("/:id", userAuth, roleAuth("Superadmin", "Admin", "Supervisor"), categoryValidator, updateCategory);
router.delete("/:id", userAuth, roleAuth("Superadmin", "Admin", "Supervisor"), deleteCategory);

//---------------------- can do all users ----------------------
router.get("/", getAllCategories);
router.get("/:id", getByCategoryId);

module.exports = router;
