const cloudinary = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// models
const Medicines = require("../models/medicineModel");
const Users = require('../models/userModel')

// services
const { createCustomId } = require("../services/createCustomId");
const { deleteImages } = require("../services/deleteImages");
const { uploadImages } = require("../services/uploadImages");

// create
const createMedicine = async (req, res, next) => {
  try {

    const { categoryId, name, details, companyName, expiredAt, price, stocks } = req.body;
    // empty validation
    if (!categoryId || !name || !details || !companyName || !expiredAt || !price || !stocks) {
      return res.status(400).json({ status: false, msg: "Some required information are missing!" });
    }

    const expiredDate = new Date(expiredAt).toISOString();
    // create custom id
    const id = await createCustomId(Medicines, "M")

    // store new medicine in mongodb
    const storeNewMedicine = async (pictureUrls, picPublicIds) => {
      if (id) {

        const newMedicine = new Medicines({
          id, categoryId, name, details, companyName, expiredDate, price, stocks, pictureUrls, picPublicIds,
        });

        const savedMedicine = await newMedicine.save();

        return res.status(201).json({ status: 201, medicineId: savedMedicine._id, msg: "New Medicine has been successfully uploaded!" });

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

        await storeNewMedicine(pictureUrls, picPublicIds)

      }).catch((err) => next(err))

  } catch (err) {
    next(err);
  }
};

// update
const updateMedicine = async (req, res, next) => {
  try {

    const { categoryId, name, details, companyName, expiredAt, price, stocks } = req.body;
    // empty validation
    if (!categoryId || !name || !details || !companyName || !expiredAt || !price || !stocks) {
      return res.status(400).json({ status: false, msg: "Some required information are missing!" });
    }

    const expiredDate = new Date(expiredAt).toISOString();

    const medicine = await Medicines.findById(req.params.id);

    let deletePromises = []

    let oldPicPublicIds = medicine.picPublicIds
    let oldPictureUrls = medicine.pictureUrls

    // already exist photo in database
    if (oldPicPublicIds[0] !== "" && oldPictureUrls[0] !== "") {
      // delete old picture from cloudinary
      deletePromises = deleteImages(oldPicPublicIds)

      oldPicPublicIds = [""];
      oldPictureUrls = [""];
    }

    const uploadPromises = uploadImages(req.files, req.folderName)

    const updateMedicine = async (medicineId, payload) => {
      await Medicines.findByIdAndUpdate(medicineId, payload);
      return res.status(200).json({ status: 200, msg: "Your Medicine has been successfully updated!" });
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

        await updateMedicine(req.params.id,
          {
            categoryId,
            name,
            details,
            companyName,
            expiredDate,
            price,
            stocks,
            pictureUrls,
            picPublicIds,
          })

      })

  } catch (err) {
    next(err);
  }
};

// update stocks
const updateStocks = async (req, res, next) => {
  try {
    const { stocks } = req.body;

    await Medicines.findByIdAndUpdate(req.params.id, {
      stocks,
    });
    return res.json({
      status: true,
      msg: "Stocks have been successfully updated!",
    });
  } catch (err) {
    next(err);
  }
};

// delete
const deleteMedicine = async (req, res, next) => {
  try {
    const { picPublicIds } = await Medicines.findById(req.params.id);

    const deleteMedicine = async (medicineId) => {
      await Medicines.findByIdAndDelete(medicineId);
      return res.status(200).json({ status: 200, msg: "Your category has been successfully deleted!" });
    }

    // not include photo
    if (picPublicIds[0] === "") {
      await deleteMedicine(req.params.id)
    }

    // include photo
    const deletePromises = deleteImages(picPublicIds)
    Promise.all(deletePromises).then(async () => {

      await deleteMedicine(req.params.id)

    }).catch((err) => {

      next(err);
    });

  } catch (err) {
    next(err);
  }
};

// normal users --------------------------------------------
const addToFavourite = async (req, res, next) => {
  try {

    const userId = req.user.id

    const { favouriteMedicines } = req.body

    await Users.findByIdAndUpdate(userId, {
      favouriteMedicines
    })

    return res.status(200).json({
      status: 200,
      msg: "Successfully added!",
    });

  } catch (err) {
    next(err)
  }
}

const getAllFavouriteMedicines = async (req, res, next) => {
  try {

    const userId = req.user.id
    const { favouriteMedicines } = await Users.findById(userId)

    const medicines = []

    for (let i = 0; i < favouriteMedicines.length; i++) {
      const medicineId = favouriteMedicines[i];

      const medicine = await Medicines.findById(medicineId)
      medicines.push(medicine)

    }

    return res.status(200).json({ status: 200, medicines });

  } catch (err) {
    next(err)
  }
}

// read -----------------------------------------------

// get medicine by medicine id
const getByMedicineId = async (req, res, next) => {
  try {

    const medicine = await Medicines.findById(req.params.id);

    return res.status(200).json({ status: 200, medicine });

  } catch (err) {
    next(err);
  }
};

// get all medicines for every users
const getAllMedicines = async (req, res, next) => {
  try {
    // for one year
    const { page = 1, limit = 10, start = "2023-01-01", end = "2024-01-01", below = 0, above = 10000, filterBy = "date", sortBy = "", name = "", title = "", companyName = "" } = req.query;

    const startDate = new Date(start)
    const endDate = new Date(end)

    // stages

    // filter stage
    const dateFilter = {
      createdAt: {
        $gte: startDate,
        $lt: endDate
      }
    }
    const priceFilter = {
      price: {
        $gte: (below * 1),
        $lt: (above * 1)
      }
    }

    let filterStage;

    if(filterBy === "price"){
      filterStage = priceFilter
    }else {
      filterStage = dateFilter
    }
    
    // lookup stage
    const categoryLookup = {
      from: "categories",
      localField: "categoryId",
      foreignField: "_id",
      as: "categoryDetail",
    }

    // 
    const matchStage = {
      $and: [
        { name: { $regex: name } },
        { "categoryDetail.title": { $regex: title } },
        { companyName: { $regex: companyName } },
      ],
    }

    // 
    let sortStage;

    if(sortBy === "orderCount"){
      sortStage = { orderCount: -1 }
    } else
    if(sortBy === "avgRating"){
      sortStage = { avgRating: -1 }
    } else
    if(sortBy === "stocks"){
      sortStage = { stocks: -1 }
    } else
    if(sortBy === "price"){
      sortStage = { price: -1 }
    } else
    {
      sortStage = { id: -1 }
    }

    // 
    const limitStage = limit * 1
    const skipStage = (page - 1) * limit

    const pipelines = [
      { $match: filterStage },
      { $lookup: categoryLookup },
      { $unwind: "$categoryDetail" },
      { $match: matchStage },
      { $sort: sortStage },
      { $skip: skipStage },
      { $limit: limitStage }
    ]

    const medicines = await Medicines.aggregate(pipelines)

    return res.status(200).json({ status: 200, medicines });

  } catch (err) {
    next(err);
  }
};

// get all expired medicines
const getAllExpiredMedicines = async (req, res, next) => {
  try {
    // for next one year
    const { page = 1, limit = 10, start = "2024-01-01", end = "2025-01-01", name = "", title = "" } = req.query;

    const startDate = new Date(start)
    const endDate = new Date(end)

    // stages
    const dateFilter = {
      expiredDate: {
        $gte: startDate,
        $lt: endDate
      }
    }
    const categoryLookup = {
      from: "categories",
      localField: "categoryId",
      foreignField: "_id",
      as: "categoryDetail",
    }
    const matchStage = {
      $and: [
        { name: { $regex: name } },
        { "categoryDetail.title": { $regex: title } },
      ],
    }
    const limitStage = limit * 1
    const skipStage = (page - 1) * limit

    const pipelines = [
      { $match: dateFilter },
      { $lookup: categoryLookup },
      { $unwind: "$categoryDetail" },
      { $match: matchStage },
      { $sort: { id: -1 } },
      { $skip: skipStage },
      { $limit: limitStage }
    ]

    const medicines = await Medicines.aggregate(pipelines)

    return res.status(200).json({ status: 200, medicines });

  } catch (err) {
    next(err);
  }
};

// get all stocks
const getAllStocks = async (req, res, next) => {
  try {
    // for one year
    const { page = 1, limit = 10, start = "2023-01-01", end = "2024-01-01", name = "", title = "" } = req.query;

    const startDate = new Date(start)
    const endDate = new Date(end)

    // stages
    const dateFilter = {
      createdAt: {
        $gte: startDate,
        $lt: endDate
      }
    }
    const filterStocks = {
      stocks: { $ne: 0 }
    }
    const categoryLookup = {
      from: "categories",
      localField: "categoryId",
      foreignField: "_id",
      as: "categoryDetail",
    }
    const matchStage = {
      $and: [
        { name: { $regex: name } },
        { "categoryDetail.title": { $regex: title } },
      ],
    }
    const limitStage = limit * 1
    const skipStage = (page - 1) * limit

    const pipelines = [
      { $match: dateFilter },
      { $match: filterStocks },
      { $lookup: categoryLookup },
      { $unwind: "$categoryDetail" },
      { $match: matchStage },
      { $sort: { id: -1 } },
      { $skip: skipStage },
      { $limit: limitStage }
    ]

    const medicines = await Medicines.aggregate(pipelines)

    return res.status(200).json({ status: 200, medicines });

  } catch (err) {
    next(err);
  }
};

// get all out of stocks
const getAllOutOfStocks = async (req, res, next) => {
  try {
    // for one year
    const { page = 1, limit = 10, start = "2023-01-01", end = "2024-01-01", name = "", title = "" } = req.query;

    const startDate = new Date(start)
    const endDate = new Date(end)

    // stages
    const dateFilter = {
      createdAt: {
        $gte: startDate,
        $lt: endDate
      }
    }
    const filterStocks = {
      stocks: { $eq: 0 }
    }
    const categoryLookup = {
      from: "categories",
      localField: "categoryId",
      foreignField: "_id",
      as: "categoryDetail",
    }
    const matchStage = {
      $and: [
        { name: { $regex: name } },
        { "categoryDetail.title": { $regex: title } },
      ],
    }
    const limitStage = limit * 1
    const skipStage = (page - 1) * limit

    const pipelines = [
      { $match: dateFilter },
      { $match: filterStocks },
      { $lookup: categoryLookup },
      { $unwind: "$categoryDetail" },
      { $match: matchStage },
      { $sort: { id: -1 } },
      { $skip: skipStage },
      { $limit: limitStage }
    ]

    const medicines = await Medicines.aggregate(pipelines)

    return res.status(200).json({ status: 200, medicines });

  } catch (err) {
    next(err);
  }
};

module.exports = {
  createMedicine,
  updateMedicine,
  deleteMedicine,

  addToFavourite,
  getAllFavouriteMedicines,

  getByMedicineId,

  getAllMedicines,
  getAllStocks,
  getAllOutOfStocks,
  getAllExpiredMedicines,
};
