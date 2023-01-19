const {
  getAllCategories,
  getCategoryByID,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("./../controllers/categoryCtrl");
const e = require("express");

const router = require("express").Router();

router.get("/", getAllCategories);
router.get("/:id", getCategoryByID);
router.post("/", createCategory);
router.patch("/:id", updateCategory);
router.delete("/:id", deleteCategory);

module.exports = router;
