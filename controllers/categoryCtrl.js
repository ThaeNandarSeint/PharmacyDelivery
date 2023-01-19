const cloudinary = require('cloudinary')

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
})

const Categories = require("../models/categoryModel");

// create
const createCategory = async (req, res) => {
  try {
    // validation
    const { title, pictures } = req.body;
    if (!title || !pictures) {
      return res.status(400).json({ status: false, msg: "Some required information are missing!" });
    }
    // unique testing
    const category = await Categories.findOne({ title });
    if (category) {
      return res.status(400).json({ status: 400, msg: "This category already exist!" });
    }

    const pictureUrls = [];
    const picPublicIds = [];

    for (let i = 0; i < pictures.length; i++) {
      const categoryPicture = pictures[i];
      pictureUrls.push(categoryPicture.secure_url);
      picPublicIds.push(categoryPicture.public_id);
    }

    // // store new category in mongodb
    const newCategory = new Categories({
      title,
      pictureUrls,
      picPublicIds,
    });
    const savedCategory = await newCategory.save();
    return res.status(201).json({
      status: 201,
      categoryId: savedCategory._id,
      msg: "New Category has been successfully uploaded!",
    });
  } catch (err) {
    next();
  }
};

// update
const updateCategory = async (req, res) => {
  try {
    const { title, pictures } = req.body;

    if (!title || !pictures) {
      return res
        .status(400)
        .json({ status: 400, msg: "Some required information are missing!" });
    }

    const category = await Categories.findById(req.params.id);
    if (!category) {
      return res
        .status(404)
        .json({ status: 404, msg: "Category Not Found by this id" });
    }

    const deletePromises = [];

    // contain
    if (category.picPublicIds[0] !== "" && category.pictureUrls[0] !== "") {
      // delete old picture from cloudinary
      for (let i = 0; i < category.picPublicIds.length; i++) {
        const oldPicPublicId = category.picPublicIds[i];
        deletePromises.push(cloudinary.v2.uploader.destroy(oldPicPublicId));
      }
      category.picPublicIds = [""];
      category.pictureUrls = [""];
    }

    // not include photo in request body
    if (pictures[0].public_id === "" && pictures[0].secure_url === "") {
      // not exist old
      const picPublicIds = [""];
      const pictureUrls = [""];

      // update new picture in mongodb
      await Categories.findByIdAndUpdate(req.params.id, {
        title,
        pictureUrls,
        picPublicIds,
      }, { runValidators: true });
      return res
        .status(200)
        .json({
          status: 200,
          msg: "Your Category has been successfully updated!",
        });
    }

    // update new picture in cloudinary
    const pictureUrls = [];
    const picPublicIds = [];

    Promise.all(deletePromises)
      .then(() => {
        for (let i = 0; i < pictures.length; i++) {
          const categoryPicture = pictures[i];
          pictureUrls.push(categoryPicture.secure_url);
          picPublicIds.push(categoryPicture.public_id);
        }
      })
      .then(async () => {
        // update new picture in mongodb
        await Categories.findByIdAndUpdate(
          req.params.id,
          {
            title,
            pictureUrls,
            picPublicIds,
          },
          { runValidators: true }
        );

        return res
          .status(200)
          .json({
            status: 200,
            msg: "Your category has been successfully updated!",
          });
      })
      .catch((err) => {
        next(err);
      });
  } catch (err) {
    next(err);
  }
};

// delete
const deleteCategory = async (req, res) => {
  try {
    const { picPublicIds } = await Categories.findById(req.params.id);

    // // not include photo
    if (picPublicIds[0] === "") {
      await Categories.findByIdAndDelete(req.params.id);
      return res
        .status(200)
        .json({
          status: 200,
          msg: "Your category has been successfully deleted!",
        });
    }

    // // include photo
    const deletePromises = [];

    for (let i = 0; i < picPublicIds.length; i++) {
      const picPublicId = picPublicIds[i];
      deletePromises.push(cloudinary.v2.uploader.destroy(picPublicId));
    }

    Promise.all(deletePromises)
      .then(async () => {
        await Categories.findByIdAndDelete(req.params.id);
        return res
          .status(200)
          .json({
            status: 200,
            msg: "Your category has been successfully deleted!",
          });
      })
      .catch((err) => {
        next(err);
      });
  } catch (err) {
    next(err);
  }
};

// get category by category id
const getByCategoryId = async (req, res, next) => {
  try {
    const medicine = await Categories.findById(req.params.id);

    return res.status(200).json({ status: 200, medicine });
  } catch (err) {
    next(err);
  }
};

// search categories
const searchCategories = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query

    const categories = await Categories.find({
      "$or": [
        { title: { $regex: req.params.key } }
      ]
    }).limit(limit * 1).skip((page - 1) * limit).sort({ createdAt: -1 })

    return res.status(200).json({ status: 200, categories })

  } catch (err) {
    next(err);
  }
}

// get all categories for every users
const getAllCategories = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const categories = await Categories.find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

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
  getByCategoryId,
  searchCategories
};
