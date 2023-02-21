const bcrypt = require('bcrypt')

const cloudinary = require('cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
})

// models
const Users = require("../models/user.model");
const DeliveryPersons = require('../models/deliveryPerson.model')

// services
const { uploadImages } = require('../services/uploadImages');
const { deleteImages } = require('../services/deleteImages');
const { createCustomId } = require('../services/createCustomId');

const updatePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const userId = req.user.id

        const user = await Users.findById(userId);
        if (!user) {
            const error = new Error("Something went wrong!");
            error.status = 400;
            return next(error)
        }
        // check password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            const error = new Error("Current password is incorrect!");
            error.status = 400;
            return next(error)
        }
        // change password
        const passwordHash = await bcrypt.hash(newPassword, 12);

        await Users.findByIdAndUpdate(userId, {
            password: passwordHash,
        })

        return res.status(200).json({ statusCode: 200, payload: {}, message: "Your password has been successfully changed!" })

    } catch (err) {
        next(err);
    }
}

const updateMe = async (req, res, next) => {
    try {
        const { name } = req.body

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
            return res.status(200).json({ statusCode: 200, payload: {}, message: "Your profile has been successfully updated!" })
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

        return res.status(200).json({ statusCode: 200, payload: user, message: "" })

    } catch (err) {
        next(err);
    }
}

// get all users
const getAllUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, start = "2023-01-01", end = "2024-01-01", userName = "" } = req.query;

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
                { name: { $regex: userName } }
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

        const documentCount = await Users.countDocuments()

        return res.status(200).json({ statusCode: 200, payload: users, documentCount, message: "" })

    } catch (err) {
        next(err);
    }
}

// ----------------------- can do only SuperAdmin & Admin -------------------------------

// const updateUser = async (req, res, next) => {
//     try {
//         const { name } = req.body

//         const user = await Users.findById(req.params.id)

//         let deletePromises = []

//         let oldPicPublicIds = user.picPublicIds
//         let oldPictureUrls = user.pictureUrls

//         // already exist photo in database
//         if (oldPicPublicIds[0] !== "" && oldPictureUrls[0] !== "") {
//             // delete old picture from cloudinary
//             deletePromises = deleteImages(oldPicPublicIds)

//             oldPicPublicIds = [""];
//             oldPictureUrls = [""];
//         }

//         const uploadPromises = uploadImages(req.files, req.folderName)

//         const updateUser = async (userId, payload) => {
//             await Users.findByIdAndUpdate(userId, payload);
//             return res.status(200).json({ statusCode: 200, payload: {  }, message: "This user's profile has been successfully updated!" })
//         }

//         // include photo in request body
//         const pictureUrls = [];
//         const picPublicIds = [];

//         Promise.all(deletePromises).then(() => Promise.all(uploadPromises))
//             .then(async (pictures) => {

//                 for (let i = 0; i < pictures.length; i++) {
//                     const { secure_url, public_id } = pictures[i];
//                     pictureUrls.push(secure_url);
//                     picPublicIds.push(public_id);
//                 }

//                 await updateUser(req.params.id, {
//                     name, picPublicIds, pictureUrls
//                 })
//             })

//     } catch (err) {
//         next(err);
//     }
// }

const createDeliveryPerson = async (req, res, next) => {
    try {
        const { email, phoneNumber, vehicleType, vehicleNumber, buildingNo, street, quarter, township, city, state } = req.body

        const address = {
            buildingNo, street, quarter, township, city, state
        }

        const { _id } = await Users.findOne({ email })

        // create custom id
        const id = await createCustomId(DeliveryPersons, "D")

        if (id) {

            const newDeliveryPerson = new DeliveryPersons({
                id, userId: _id, phoneNumber, vehicleType, vehicleNumber, address, status: 'inactive'
            });

            const savedDeliveryPerson = await newDeliveryPerson.save();

            await Users.findByIdAndUpdate(_id, {
                roleType: "DeliveryPerson"
            })

            return res.status(201).json({ statusCode: 201, payload: { deliveryPerson: savedDeliveryPerson }, message: "New Delivery Person has been successfully created!" })
        }

    } catch (err) {
        next(err)
    }
}

const getAllDeliveryPersons = async (req, res, next) => {
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

        const deliveryPersons = await DeliveryPersons.aggregate([
            { $match: dateFilter },
            { $lookup: userLookup },
            { $match: matchStage },
            { $project: projectStage },
            { $sort: { updatedAt: -1 } },
            { $skip: skipStage },
            { $limit: limitStage }
        ])

        const documentCount = await DeliveryPersons.countDocuments()

        return res.status(200).json({ statusCode: 200, payload: deliveryPersons, total: documentCount, message: "" })

    } catch (err) {
        next(err)
    }
}

// ----------------------- can do only Super Admin -------------------------------

const grantRole = async (req, res, next) => {
    try {
        // validation testing
        const { roleType } = req.body

        await Users.findByIdAndUpdate(req.params.id, { roleType })

        return res.status(200).json({ statusCode: 200, payload: {}, message: `This user has been successfully granted as ${roleType}` })

    } catch (err) {
        next(err)
    }
}

module.exports = {
    updatePassword,
    updateMe,

    createDeliveryPerson,
    getAllDeliveryPersons,

    getByUserId,
    getAllUsers,

    // updateUser,
    grantRole
};
