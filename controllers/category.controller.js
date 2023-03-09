const { createCustomId } = require('../services/createCustomId');

// models
const Categories = require("../models/category.model");
const { uploadImages } = require('../services/uploadImages');
const { deleteImages } = require('../services/deleteImages');

// create
const createCategory = async (req, res, next) => {
  try {
    const { title } = req.body;

    // unique validation
    const category = await Categories.findOne({ title });
    if (category) {
      const error = new Error("This category already exist!");
      error.status = 400;
      return next(error)
    }

    // create custom id
    const id = await createCustomId(Categories, "C")

    // store new category in mongodb
    const storeNewCategory = async (pictureUrls, picPublicIds) => {
      if (id) {

        const newCategory = new Categories({
          id, title, pictureUrls, picPublicIds,
        });

        const savedCategory = await newCategory.save();

        return res.status(201).json({ statusCode: 201, payload: { category: savedCategory }, message: "New Category has been successfully uploaded!" })

      }
    }

    // handle images
    const pictureUrls = [];
    const picPublicIds = [];

    const uploadPromises = uploadImages(req.files, req.folderName)

    Promise.all(uploadPromises)
      .then(async (pictures) => {
        for (let i = 0; i < pictures.length; i++) {
          const { secure_url, public_id } = pictures[i];
          pictureUrls.push(secure_url);
          picPublicIds.push(public_id);
        }
        await storeNewCategory(pictureUrls, picPublicIds)

      }).catch((err) => next(err))

  } catch (err) {
    next(err);
  }
};

// update
const updateCategory = async (req, res, next) => {
  try {
    const { title } = req.body;

    // validation
    const category = await Categories.findById(req.params.id);
    if (!category) {
      const error = new Error("Category Not Found by this id!");
      error.status = 404;
      return next(error)
    }

    let deletePromises = []

    let oldPicPublicIds = category.picPublicIds
    let oldPictureUrls = category.pictureUrls

    // already exist photo in database
    if (oldPicPublicIds[0] !== "" && oldPictureUrls[0] !== "") {
      // delete old picture from cloudinary
      deletePromises = deleteImages(oldPicPublicIds)

      oldPicPublicIds = [""];
      oldPictureUrls = [""];
    }

    const uploadPromises = uploadImages(req.files, req.folderName)

    const updateCategory = async (categoryId, payload) => {
      await Categories.findByIdAndUpdate(categoryId, payload);

      return res.status(200).json({ statusCode: 200, payload: {}, message: "Your Category has been successfully updated!" })
    }

    // include photo in request body
    const pictureUrls = [];
    const picPublicIds = [];

    Promise.all(deletePromises).then(() => Promise.all(uploadPromises))
      .then(async (pictures) => {

        for (let i = 0; i < pictures.length; i++) {
          const { secure_url, public_id } = pictures[i];
          pictureUrls.push(secure_url);
          picPublicIds.push(public_id);
        }

        await updateCategory(req.params.id, {
          title,
          pictureUrls,
          picPublicIds,
        })

      })

  } catch (err) {
    next(err);
  }
};

// delete
const deleteCategory = async (req, res, next) => {
  try {

    const { picPublicIds } = await Categories.findById(req.params.id);

    // not include photo
    if (picPublicIds[0] === "") {
      await Categories.findByIdAndDelete(req.params.id);

      return res.status(200).json({ statusCode: 200, payload: {}, message: "Your category has been successfully deleted!" })
    }

    // include photo
    const deletePromises = deleteImages(picPublicIds)
    Promise.all(deletePromises).then(async () => {

      await Categories.findByIdAndDelete(req.params.id);

      return res.status(200).json({ statusCode: 200, payload: {}, message: "Your category has been successfully deleted!" })

    }).catch((err) => {

      next(err);
    });

  } catch (err) {
    next(err);
  }
};

// get category by category id
const getByCategoryId = async (req, res, next) => {
  try {

    const category = await Categories.findById(req.params.id);

    return res.status(200).json({ statusCode: 200, payload: category, message: "" })

  } catch (err) {
    next(err);
  }
};

// get all categories for every users
const getAllCategories = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, categoryTitle = "" } = req.query;

    const matchStage = {
      $or: [
        { title: { $regex: categoryTitle } }
      ],
    }

    const limitStage = limit * 1
    const skipStage = (page - 1) * limit

    const categories = await Categories.aggregate([
      { $match: matchStage },
      { $sort: { createdAt: -1 } },
      { $skip: skipStage },
      { $limit: limitStage }
    ])

    const documentCount = await Categories.countDocuments()

    return res.status(200).json({ statusCode: 200, payload: categories, total: documentCount, message: "" })

  } catch (err) {
    next(err);
  }
};

module.exports = {
  createCategory,
  updateCategory,
  deleteCategory,

  getAllCategories,
  getByCategoryId
};
