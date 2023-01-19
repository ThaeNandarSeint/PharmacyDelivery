const Categories = require("../models/categoryModel");

const getAllCategories = async (req, res, next) => {
  try {
    const category = await Categories.find();
    res.status(200).json({
      status: 200,
      result: category.length,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

const getCategoryByID = async (req, res, next) => {
  try {
    const category = await Categories.findById(req.params.id);

    if (!category) {
      res.status(404).json({
        status: 404,
        message: "Cannot find any category with this ID",
      });
    }

    res.status(200).json(category);
  } catch (error) {
    next(error);
  }
};
const createCategory = async (req, res) => {
  const { title } = req.body;

  const category = await Categories.findOne({ title });

  if (category) {
    return res.status(409).json({
      status: 409,
      message: "Category already exist!",
    });
  }

  const newCategory = await Categories.create(req.body);

  res.status(201).json({
    status: 201,
    data: {
      Category: newCategory,
    },
  });
};

const updateCategory = async (req, res) => {
  try {
    const Category = await Categories.findByIDandUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      status: 200,
      data: {
        Categories: "Updated Categories are here!",
      },
    });

    if (!Category) {
      return res.status(404).json({
        status: 404,
        msg: "Category Not Found",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 500,
      msg: "Internal Error Occurred!",
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const Category = await Categories.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 200,
      msg: "successfully deleted",
    });

    if (!Category) {
      return res.status(404).json({
        status: "fail",
        message: "Category Not Found",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: "Internal Error Occurred!",
    });
  }
};

module.exports = {
  getAllCategories,
  getCategoryByID,
  createCategory,
  updateCategory,
  deleteCategory,
};
