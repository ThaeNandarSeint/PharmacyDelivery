const bcrypt = require('bcrypt')

const cloudinary = require('cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
})

// models
const Users = require("../models/userModel");
const DeliveryBoys = require('../models/deliveryBoyModel')

// services
const { uploadImages } = require('../services/uploadImages');
const { deleteImages } = require('../services/deleteImages');
const { createCustomId } = require('../services/createCustomId');

const updatePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ status: 400, msg: "Some required information are missing!" })
        }

        const userId = req.user.id

        const user = await Users.findById(userId);
        if (!user) {
            return res.status(400).json({ status: 400, msg: "Something went wrong!" });
        }
        // check password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ status: 400, msg: "Current password is incorrect!" });
        }
        // change password
        const passwordHash = await bcrypt.hash(newPassword, 12);

        await Users.findByIdAndUpdate(userId, {
            password: passwordHash,
        })

        return res.status(200).json({ status: 200, msg: "Your password has been successfully changed!" })

    } catch (err) {
        next(err);
    }
}

const updateMe = async (req, res, next) => {
    try {
        const { name } = req.body
        if (!name) {
            return res.status(400).json({ status: 400, msg: "Some required information are missing!" })
        }

        const userId = req.user.id

        const user = await Users.findById(userId)

        let deletePromises = []

        let oldPicPublicIds = user.picPublicIds
        let oldPictureUrls = user.pictureUrls

        // already exist photo in database
        if (oldPicPublicIds[0] !== "" && oldPictureUrls[0] !== "") {
            // delete old picture from cloudinary
            deletePromises = deleteImages(oldPicPublicIds)

            oldPicPublicIds = [""];
            oldPictureUrls = [""];
        }

        const uploadPromises = uploadImages(req.files, req.folderName)

        const updateUser = async (userId, payload) => {
            await Users.findByIdAndUpdate(userId, payload);
            return res.status(200).json({ status: 200, msg: "Your profile has been successfully updated!" })
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

                await updateUser(userId, {
                    name, picPublicIds, pictureUrls
                })
            })

    } catch (err) {
        next(err);
    }
}

const getByUserId = async (req, res, next) => {
    try {

        const user = await Users.findById(req.params.id).select('-password')

        return res.status(200).json({ status: 200, user })

    } catch (err) {
        next(err);
    }
}

// get all users
const getAllUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, start = "2023-01-01", end = "2024-01-01", name = "" } = req.query;

        const startDate = new Date(start)
        const endDate = new Date(end)

        // stages
        const dateFilter = {
            createdAt: {
                $gte: startDate,
                $lt: endDate
            }
        }
        const matchStage = {
            $or: [
                { name: { $regex: name } }
            ],
        }
        const projectStage = {
            password: 0
        }
        const limitStage = limit * 1
        const skipStage = (page - 1) * limit

        const users = await Users.aggregate([
            { $match: dateFilter },
            { $match: matchStage },
            { $project: projectStage },
            { $sort: { id: -1 } },
            { $skip: skipStage },
            { $limit: limitStage }
        ])

        return res.status(200).json({ status: 200, users })

    } catch (err) {
        next(err);
    }
}

// ----------------------- can do only SuperAdmin & Admin -------------------------------

const updateUser = async (req, res, next) => {
    try {
        const { name } = req.body
        if (!name) {
            return res.status(400).json({ status: 400, msg: "Some required information are missing!" })
        }

        const user = await Users.findById(req.params.id)

        let deletePromises = []

        let oldPicPublicIds = user.picPublicIds
        let oldPictureUrls = user.pictureUrls

        // already exist photo in database
        if (oldPicPublicIds[0] !== "" && oldPictureUrls[0] !== "") {
            // delete old picture from cloudinary
            deletePromises = deleteImages(oldPicPublicIds)

            oldPicPublicIds = [""];
            oldPictureUrls = [""];
        }

        const uploadPromises = uploadImages(req.files, req.folderName)

        const updateUser = async (userId, payload) => {
            await Users.findByIdAndUpdate(userId, payload);
            return res.status(200).json({ status: 200, msg: "This user's profile has been successfully updated!" })
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

                await updateUser(req.params.id, {
                    name, picPublicIds, pictureUrls
                })
            })

    } catch (err) {
        next(err);
    }
}

const createDeliveryBoy = async (req, res, next) => {
    try {
        const { email, phoneNumber, vehicleType, vehicleNumber, buildingNo, street, quarter, township, city, state } = req.body
        if (!email || !phoneNumber || !vehicleType || !vehicleNumber || !buildingNo || !street || !quarter || !township || !city || !state) {
            return res.status(400).json({ status: 400, msg: "Some required information are missing!" })
        }

        const address = {
            buildingNo, street, quarter, township, city, state
        }

        const { _id } = await Users.findOne({ email })

        // create custom id
        const id = await createCustomId(DeliveryBoys, "D")

        if (id) {

            const newDeliveryBoy = new DeliveryBoys({
                id, userId: _id, phoneNumber, vehicleType, vehicleNumber, address, status: 'inactive'
            });

            const savedDeliveryBoy = await newDeliveryBoy.save();

            await Users.findByIdAndUpdate(_id, {
                roleType: "DeliveryBoy"
            })

            return res.status(201).json({ status: 201, deliveryBoyId: savedDeliveryBoy._id, msg: "New Delivery Boy has been successfully created!" });
        }

    } catch (err) {
        next(err)
    }
}

const getAllDeliveryBoys = async (req, res, next) => {
    try{

        const { page = 1, limit = 10, start = "2023-01-01", end = "2024-01-01", name = "" } = req.query;

        const startDate = new Date(start)
        const endDate = new Date(end)

        // stages
        const dateFilter = {
            createdAt: {
                $gte: startDate,
                $lt: endDate
            }
        }        
        const userLookup = {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userDetail",
        }
        const matchStage = {
            $or: [
                { "userDetail.name": { $regex: name } }
            ],
        }
        const projectStage = {
            "userDetail.password": 0
        }
        const limitStage = limit * 1
        const skipStage = (page - 1) * limit

        const deliveryBoys = await DeliveryBoys.aggregate([
            { $match: dateFilter },
            { $lookup: userLookup },
            { $match: matchStage },
            { $project: projectStage },
            { $sort: { id: -1 } },
            { $skip: skipStage },
            { $limit: limitStage }
        ])

        return res.status(200).json({ status: 200, deliveryBoys })

    }catch(err){
        next(err)
    }
}

// ----------------------- can do only Super Admin -------------------------------

const grantRole = async (req, res, next) => {
    try {
        // validation testing
        const { roleType } = req.body
        if (!roleType) {
            return res.status(400).json({ status: false, msg: "Some required information are missing!" });
        }

        await Users.findByIdAndUpdate(req.params.id, { roleType })

        return res.status(200).json({ status: 200, msg: `This user has been successfully granted as ${roleType}` })

    } catch (err) {
        next(err)
    }
}

module.exports = {
    updatePassword,
    updateMe,

    createDeliveryBoy,
    getAllDeliveryBoys,

    getByUserId,
    getAllUsers,

    updateUser,
    grantRole
};
