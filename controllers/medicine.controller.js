// models
const Medicines = require("../models/medicine.model");
const Users = require('../models/user.model')

// services
const { createCustomId } = require("../services/createCustomId");
const { deleteImages } = require("../services/deleteImages");
const { addMedicine, modifyMedicine } = require("../services/medicine.service");
const { uploadImages } = require("../services/uploadImages");

const getByMedicineId = async (req, res, next) => {
  try {

    const medicine = await Medicines.findById(req.params.id);

    return res.status(200).json({ statusCode: 200, payload: medicine, message: "" })

  } catch (err) {
    next(err);
  }
};

// 
const getAllMedicines = async (req, res, next) => {
  try {
    // for one year
    const { page = 1, limit = 12, start = "2023-01-01", end = "2024-01-01", below = 0, above = 10000, filterBy = "date", sortBy = "", medicineName = "", categoryTitle = "", companyName = "" } = req.query;

    const startDate = new Date(start)
    const endDate = new Date(end)

    //---------------- stages --------------

    // filter stage
    const dateFilter = {
      createdAt: {
        $gte: startDate,
        $lt: endDate
      }
    }
    const expiredDateFilter = {
      expiredDate: {
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
    const stocksFilter = {
      stocks: { $ne: 0 }
    }
    const outOfStocksFilter = {
      stocks: { $eq: 0 }
    }

    let filterStage;

    if (filterBy === "expiredDate") {
      filterStage = expiredDateFilter

    } else if (filterBy === "price") {
      filterStage = priceFilter

    } else if (filterBy === "stocks") {
      filterStage = stocksFilter

    } else if (filterBy === "outOfStocks") {
      filterStage = outOfStocksFilter

    }
    else {
      filterStage = dateFilter
    }

    // lookup stage
    const categoryLookup = {
      from: "categories",
      localField: "categoryId",
      foreignField: "_id",
      as: "categoryDetail",
    }

    // ------------------
    const matchStage = {
      $and: [
        { name: { $regex: medicineName } },
        { "categoryDetail.title": { $regex: categoryTitle } },
        { companyName: { $regex: companyName } },
      ],
    }

    // ------------------
    let sortStage;

    if (sortBy === "orderCount") {
      sortStage = { orderCount: -1 }
    } else
      if (sortBy === "avgRating") {
        sortStage = { avgRating: -1 }
      } else
        if (sortBy === "stocks") {
          sortStage = { stocks: -1 }
        } else
          if (sortBy === "price") {
            sortStage = { price: -1 }
          } else {
            sortStage = { updatedAt: -1 }
          }

    // ----------------------
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

    const documentCount = await Medicines.countDocuments()

    return res.status(200).json({ statusCode: 200, payload: medicines, total: documentCount, message: "" })

  } catch (err) {
    next(err);
  }
};

const addToFavourite = async (req, res, next) => {
  try {

    const userId = req.user.id

    const { favouriteMedicines } = req.body

    if (!favouriteMedicines) {
      const error = new Error("Required to add favourite medicine!");
      error.status = 400;
      return next(error)
    }

    await Users.findByIdAndUpdate(userId, {
      favouriteMedicines
    })

    return res.status(200).json({ statusCode: 200, payload: {}, message: "Successfully added!" })

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

    return res.status(200).json({ statusCode: 200, payload: medicines, message: "" })

  } catch (err) {
    next(err)
  }
}

// ----------------------- can do only SuperAdmin & Admin & Supervisor -------------------------------

// create
const createMedicine = async (req, res, next) => {
  try {

    const { categoryId, name, details, companyName, expiredAt, price, stocks } = req.body;

    const expiredDate = new Date(expiredAt)

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

        const id = await createCustomId(Medicines, "M")

        if (id) {

          const savedMedicine = await addMedicine({ id, categoryId, name, details, companyName, expiredDate, price, stocks, pictureUrls, picPublicIds })

          return res.status(201).json({ statusCode: 201, payload: { medicine: savedMedicine }, message: "New Medicine has been successfully uploaded!" })

        }

      }).catch((err) => next(err))

  } catch (err) {
    next(err);
  }
};

// update
const updateMedicine = async (req, res, next) => {
  try {

    const { categoryId, name, details, companyName, expiredAt, price, stocks } = req.body;

    const expiredDate = new Date(expiredAt)

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

        await modifyMedicine(req.params.id, {
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

        return res.status(200).json({ statusCode: 200, payload: {}, message: "Your Medicine has been successfully updated!" })
      })

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
      return res.status(200).json({ statusCode: 200, payload: {}, message: "Your category has been successfully deleted!" })
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

module.exports = {
  createMedicine,
  updateMedicine,
  deleteMedicine,

  addToFavourite,
  getAllFavouriteMedicines,

  getByMedicineId,
  getAllMedicines,
};
