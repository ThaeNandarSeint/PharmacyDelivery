const cloudinary = require('cloudinary');
const { createCustomId } = require('../services/createCustomId');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
})

// models
const Categories = require("../models/categoryModel");
const { uploadImages } = require('../services/uploadImages');
const { deleteImages } = require('../services/deleteImages');

// create
const createCategory = async (req, res, next) => {
  try {
    const { title } = req.body;

    // empty validation
    if (!title) {
      return res.status(400).json({ status: false, msg: "Some required information are missing!" });
    }
    // unique validation
    const category = await Categories.findOne({ title });
    if (category) {
      return res.status(400).json({ status: 400, msg: "This category already exist!" });
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

        return res.status(201).json({ status: 201, categoryId: savedCategory._id, msg: "New Category has been successfully uploaded!" });

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
    // empty validation
    if (!title) {
      return res.status(400).json({ status: 400, msg: "Some required information are missing!" });
    }
    // validation
    const category = await Categories.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ status: 404, msg: "Category Not Found by this id" });
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
      return res.status(200).json({ status: 200, msg: "Your Category has been successfully updated!" });
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
      return res.status(200).json({ status: 200, msg: "Your category has been successfully deleted!" });
    }

    // include photo
    const deletePromises = deleteImages(picPublicIds)
    Promise.all(deletePromises).then(async () => {

      await Categories.findByIdAndDelete(categoryId);
      return res.status(200).json({ status: 200, msg: "Your category has been successfully deleted!" });

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

    return res.status(200).json({ status: 200, category });

  } catch (err) {
    next(err);
  }
};

// get all categories for every users
const getAllCategories = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, title = "" } = req.query;

    const matchStage = {
      $or: [
        { title: { $regex: title } }
      ],
    }

    const limitStage = limit * 1
    const skipStage = (page - 1) * limit

    const categories = await Categories.aggregate([ 
      { $match: matchStage },  
      { $sort: { id: -1 } },
      { $skip: skipStage },
      { $limit: limitStage }      
    ])

    return res.status(200).json({ status: 200, categories });

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
