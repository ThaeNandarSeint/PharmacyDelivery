const {
  getAllCategories,
  getCategoryByID,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("./../controllers/categoryCtrl");

//validation middlewares
const categoryValidator = require("../Validators/categoryValidator");

const router = require("express").Router();

router.get("/", getAllCategories);
router.get("/:id", getCategoryByID);
router.post("/", categoryValidator, createCategory);
router.patch("/:id", categoryValidator, updateCategory);
router.delete("/:id", deleteCategory);

module.exports = router;
