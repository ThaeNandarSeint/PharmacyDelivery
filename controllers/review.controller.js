const mongoose = require("mongoose");

// models
const Reviews = require('../models/review.model');
const Medicines = require('../models/medicine.model');

// services
const { createCustomId } = require('../services/createCustomId');
const { deleteImages } = require('../services/deleteImages');
const { uploadImages } = require('../services/uploadImages');

const createReview = async (req, res, next) => {
  try {

    const { text, rating, medicineId } = req.body;
    const userId = req.user.id

    // create custom id
    const id = await createCustomId(Reviews, "R")

    // store new review in mongodb
    const storeNewReview = async (pictureUrls, picPublicIds) => {
      if (id) {

        const newReview = new Reviews({
          id, medicineId, userId, text, rating, pictureUrls, picPublicIds,
        });

        const savedReview = await newReview.save();

        updateAvgRating(medicineId)

        return res.status(201).json({ statusCode: 201, payload: { review: savedReview }, message: "New Review has been successfully created!" })

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

        await storeNewReview(pictureUrls, picPublicIds)

      }).catch((err) => next(err))

  } catch (err) {
    next(err)
  }
}

const updateReview = async (req, res, next) => {
  try {
    const { text, rating, medicineId } = req.body;
    const userId = req.user.id

    const review = await Reviews.findById(req.params.id);

    let deletePromises = []

    let oldPicPublicIds = review.picPublicIds
    let oldPictureUrls = review.pictureUrls

    // already exist photo in database
    if (oldPicPublicIds[0] !== "" && oldPictureUrls[0] !== "") {
      // delete old picture from cloudinary
      deletePromises = deleteImages(oldPicPublicIds)

      oldPicPublicIds = [""];
      oldPictureUrls = [""];
    }

    const uploadPromises = uploadImages(req.files, req.folderName)

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

        await Reviews.findByIdAndUpdate(req.params.id, {
          medicineId, userId, text, rating, pictureUrls, picPublicIds,
        });

        updateAvgRating(medicineId)

        return res.status(200).json({ statusCode: 200, payload: {}, message: "Your Review has been successfully updated!" })

      })

  } catch (err) {
    next(err);
  }
};

const deleteReview = async (req, res, next) => {
  try {

    const { picPublicIds } = await Reviews.findById(req.params.id);

    // not include photo
    if (picPublicIds[0] === "") {
      await Reviews.findByIdAndDelete(req.params.id);
      return res.status(200).json({ statusCode: 200, payload: {}, message: "Your review has been successfully deleted!" })
    }

    // include photo
    const deletePromises = deleteImages(picPublicIds)
    Promise.all(deletePromises).then(async () => {

      const { medicineId } = await Reviews.findById(req.params.id)

      await Reviews.findByIdAndDelete(req.params.id);

      updateAvgRating(medicineId)

      return res.status(200).json({ statusCode: 200, payload: {}, message: "Your review has been successfully deleted!" })

    }).catch((err) => {

      next(err);
    });

  } catch (err) {
    next(err);
  }
};

const getAllReviews = async (req, res, next) => {
  try {
    // for one year
    const { page = 1, limit = 10, start = "2023-01-01", end = "2024-01-01", medicineName = "", companyName = "" } = req.query;

    const startDate = new Date(start)
    const endDate = new Date(end)

    // stages
    const dateFilter = {
      createdAt: {
        $gte: startDate,
        $lt: endDate
      }
    }
    const medicineLookup = {
      from: "medicines",
      localField: "medicineId",
      foreignField: "_id",
      as: "medicineDetail",
    }

    const matchStage = {
      $and: [
        { "medicineDetail.name": { $regex: medicineName } },
        { "medicineDetail.companyName": { $regex: companyName } }
      ],
    }

    const limitStage = limit * 1
    const skipStage = (page - 1) * limit

    const reviews = await Reviews.aggregate([
      { $match: dateFilter },
      { $lookup: medicineLookup },
      { $match: matchStage },
      { $sort: { id: -1 } },
      { $skip: skipStage },
      { $limit: limitStage }
    ])

    return res.status(200).json({ statusCode: 200, payload: { reviews }, message: "" })

  } catch (err) {
    next(err);
  }
};

const getByReviewId = async (req, res, next) => {
  try {

    const review = await Reviews.findById(req.params.id);

    return res.status(200).json({ statusCode: 200, payload: { review }, message: "" })

  } catch (err) {
    next(err);
  }
};


// functions
const updateAvgRating = async (medicineId) => {

  const reviews = await Reviews.aggregate([
    { 
      $match: { medicineId: new mongoose.Types.ObjectId(medicineId) }     
    }, 
    { $group: { _id: null, avgRating: { $avg: "$rating" } } }
  ])
  const avgRating = reviews[0].avgRating.toFixed(1)

  await Medicines.findByIdAndUpdate(medicineId, {
    avgRating
  })

}

module.exports = {
  createReview,
  updateReview,
  deleteReview,

  getByReviewId,
  getAllReviews
}