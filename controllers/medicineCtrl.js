const cloudinary = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// models
const Medicines = require("../models/medicineModel");

// create
const createMedicine = async (req, res, next) => {
  try {
    const {
      categoryId,
      name,
      details,
      companyName,
      expiredAt,
      price,
      stocks,
      pictures,
    } = req.body;

    if (
      !categoryId ||
      !name ||
      !details ||
      !companyName ||
      !expiredAt ||
      !price ||
      !stocks ||
      !pictures
    ) {
      return res
        .status(400)
        .json({ status: false, msg: "Some required information are missing!" });
    }

    const pictureUrls = [];
    const picPublicIds = [];

    for (let i = 0; i < pictures.length; i++) {
      const medicinePicture = pictures[i];
      pictureUrls.push(medicinePicture.secure_url);
      picPublicIds.push(medicinePicture.public_id);
    }

    const expiredDate = new Date(expiredAt).toISOString();

    // // store new medicine in mongodb
    const newMedicine = new Medicines({
      categoryId,
      name,
      details,
      companyName,
      expiredDate,
      price,
      stocks,
      pictureUrls,
      picPublicIds,
    });
    const savedMedicine = await newMedicine.save();
    return res.json({
      status: true,
      medicineId: savedMedicine._id,
      msg: "New Medicine has been successfully uploaded!",
    });
  } catch (err) {
    next(err);
  }
};

// update
const updateMedicine = async (req, res, next) => {
  try {
    const {
      categoryId,
      name,
      details,
      companyName,
      expiredAt,
      price,
      stocks,
      pictures,
    } = req.body;

    if (
      !categoryId ||
      !name ||
      !details ||
      !companyName ||
      !expiredAt ||
      !price ||
      !stocks ||
      !pictures
    ) {
      return res
        .status(400)
        .json({ status: false, msg: "Some required information are missing!" });
    }
    const expiredDate = new Date(expiredAt).toISOString();

    const medicine = await Medicines.findById(req.params.id);

    const deletePromises = [];

    // contain
    if (medicine.picPublicIds[0] !== "" && medicine.pictureUrls[0] !== "") {
      // delete old picture from cloudinary
      for (let i = 0; i < medicine.picPublicIds.length; i++) {
        const oldPicPublicId = medicine.picPublicIds[i];
        deletePromises.push(cloudinary.v2.uploader.destroy(oldPicPublicId));
      }
      medicine.picPublicIds = [""];
      medicine.pictureUrls = [""];
    }

    // not include photo in request body
    if (pictures[0].public_id === "" && pictures[0].secure_url === "") {
      // not exist old
      const picPublicIds = [""];
      const pictureUrls = [""];

      // update new picture in mongodb
      await Medicines.findByIdAndUpdate(req.params.id, {
        categoryId,
        name,
        details,
        companyName,
        expiredDate,
        price,
        stocks,
        pictureUrls,
        picPublicIds,
      });
      return res.json({
        status: true,
        msg: "Your Medicine has been successfully updated!",
      });
    }

    // update new picture in cloudinary
    const pictureUrls = [];
    const picPublicIds = [];

    Promise.all(deletePromises)
      .then(() => {
        for (let i = 0; i < pictures.length; i++) {
          const medicinePicture = pictures[i];
          pictureUrls.push(medicinePicture.secure_url);
          picPublicIds.push(medicinePicture.public_id);
        }
      })
      .then(async () => {
        // update new picture in mongodb
        await Medicines.findByIdAndUpdate(req.params.id, {
          categoryId,
          name,
          details,
          companyName,
          expiredDate,
          price,
          stocks,
          pictureUrls,
          picPublicIds,
        });

        return res.json({
          status: true,
          msg: "Your medicine has been successfully updated!",
        });
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (err) {
    next(err);
  }
};

// delete
const deleteMedicine = async (req, res, next) => {
  try {
    const { picPublicIds } = await Medicines.findById(req.params.id);

    // // not include photo
    if (picPublicIds[0] === "") {
      await Medicines.findByIdAndDelete(req.params.id);
      return res.json({
        status: true,
        msg: "Your medicine has been successfully deleted!",
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
        await Medicines.findByIdAndDelete(req.params.id);
        return res.json({
          status: true,
          msg: "Your medicine has been successfully deleted!",
        });
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (err) {
    next(err);
  }
};

// get medicine by medicine id
const getByMedicineId = async (req, res, next) => {
  try {
    const medicine = await Medicines.findById(req.params.id);

    return res.status(200).json({ status: 200, medicine });
  } catch (err) {
    next(err);
  }
};

// search medicines
const searchMedicines = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const medicines = await Medicines.find({
      $or: [{ name: { $regex: req.params.key / i } }],
    })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    return res.status(200).json({ status: 200, medicines });
  } catch (err) {
    next(err);
  }
};

// get medicine by category id
const getMedicineByCategoryId = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const medicines = await Medicines.find({ categoryId: req.params.id })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    return res.status(200).json({ status: 200, medicines });
  } catch (err) {
    next(err);
  }
};

// get all medicines for every users
const getAllMedicines = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const medicines = await Medicines.find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    return res.status(200).json({ status: 200, medicines });
  } catch (err) {
    next(err);
  }
};

//instock medicines
const getAllStocks = async (req, res, next) => {
  try {
    const medicines = await Medicines.find({ stocks: { $ne: 0 } });
    {
      return res.status(200).json({
        status: true,
        data: medicines,
      });
    }
  } catch (err) {
    next(err);
  }
};

//outofstock medicines
const getOutOfStocks = async (req, res, next) => {
  try {
    const medicines = await Medicines.find({ stocks: { $eq: 0 } });
    {
      return res.status(404).json({
        status: false,
        data: medicines,
      });
    }
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createMedicine,
  updateMedicine,
  deleteMedicine,

  searchMedicines,
  getAllMedicines,
  getByMedicineId,
  getMedicineByCategoryId,
  getAllStocks,
  getOutOfStocks,
};
