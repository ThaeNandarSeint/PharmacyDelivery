const bcrypt = require('bcrypt')
const mongoose = require('mongoose')

// models
const DeliveryPersons = require('../models/deliveryPerson.model')
const Orders = require('../models/order.model')

const { createAccessToken } = require("../helpers/createTokens");
const { createCustomId } = require('../services/createCustomId')

// 
const register = async (req, res, next) => {
    try {
        const { name, email, password, phoneNumber, vehicleType, vehicleNumber, address } = req.body
        // unique validation
        const userEmail = await DeliveryPersons.findOne({ email })
        if (userEmail) {
            const error = new Error("This email already exists!");
            error.status = 400;
            return next(error)
        }

        // create user model
        const passwordHash = await bcrypt.hash(password, 12)

        // create custom id
        const id = await createCustomId(DeliveryPersons, "D")

        // create user model & save in mongodb
        if (id) {
            const newUser = new DeliveryPersons({
                id,
                name,
                email,
                password: passwordHash,
                pictureUrls: ["https://res.cloudinary.com/dm5vsvaq3/image/upload/v1673412749/PharmacyDelivery/DeliveryPersons/default-profile-picture_nop9jb.webp"],
                picPublicIds: ["PharmacyDelivery/DeliveryPersons/default-profile-picture_nop9jb.webp"],
                phoneNumber,
                vehicleType,
                vehicleNumber,
                address,
                status: "inactive"
            })

            const savedUser = await newUser.save()

            // create token
            const accessToken = createAccessToken({ id: savedUser._id })

            return res.status(201).json({ statusCode: 201, payload: { user: savedUser, accessToken }, message: "Account has been created!" })
        }

    } catch (err) {
        next(err);
    }
}

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // check email
        const user = await DeliveryPersons.findOne({ email })
        if (!user) {
            const error = new Error("Wrong credentials!");
            error.status = 400;
            return next(error)
        }
        // check password
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            const error = new Error("Wrong credentials!");
            error.status = 400;
            return next(error)
        }


        // create token
        const accessToken = createAccessToken({ id: user._id, roleType: "DeliveryPerson" })

        return res.status(200).json({ statusCode: 200, payload: { user, accessToken }, message: "Login Success!" })

    } catch (err) {
        next(err);
    }
}

const logout = async (req, res, next) => {
    try {
        // res.clearCookie('access_token', { path: '/api' })
        return res.status(200).json({ statusCode: 200, payload: {}, message: "Logged out!" })

    } catch (err) {
        next(err);
    }
}

const getAllOrders = async (req, res, next) => {
    try {
        const { page = 1, limit = 12, start = "2023-01-01", end = "2024-01-01", status = "" } = req.query

        const startDate = new Date(start)
        const endDate = new Date(end)

        const dateFilter = {
            createdAt: {
                $gte: startDate,
                $lt: endDate
            }
        }

        let filter = {
            deliveryPerson: {
                $eq: mongoose.Types.ObjectId(req.user.id)
            }
        }

        const userLookup = {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "userDetail",
        }

        const deliveryPersonLookup = {
            from: "deliverypersons",
            localField: "deliveryPerson",
            foreignField: "_id",
            as: "deliveryPersonDetail",
        }

        const projectStage = {
            "userDetail.password": 0,
            "deliveryPersonDetail._id": 0
        }

        const limitStage = limit * 1
        const skipStage = (page - 1) * limit
        
        const pipelines = [
            { $match: dateFilter },
            { $match: filter },

            { $lookup: userLookup },
            { $lookup: deliveryPersonLookup },
            { $project: projectStage },    

            { $sort: { createdAt: -1 } },
            { $skip: skipStage },
            { $limit: limitStage }
        ]

        const sortedOrders = await Orders.aggregate(pipelines).exec()

        const populatedOrders = await Orders.populate(sortedOrders, { path: 'orderDetails.medicine' })

        return res.status(200).json({ statusCode: 200, payload: populatedOrders, total: sortedOrders.length, message: "" })

    } catch (err) {
        next(err)
    }
}

const getAllDeliveryPersons = async (req, res, next) => {
    try {

        const { page = 1, limit = 12, start = "2023-01-01", end = "2024-01-01", name = "" } = req.query;

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
                { "name": { $regex: name } }
            ],
        }
        const projectStage = {
            "password": 0
        }

        const limitStage = limit * 1
        const skipStage = (page - 1) * limit

        const deliveryPersons = await DeliveryPersons.aggregate([
            { $match: dateFilter },
            { $match: matchStage },
            { $project: projectStage },
            { $sort: { createdAt: -1 } },
            { $skip: skipStage },
            { $limit: limitStage }
        ])

        const documentCount = await DeliveryPersons.countDocuments()

        return res.status(200).json({ statusCode: 200, payload: deliveryPersons, total: documentCount, message: "" })

    } catch (err) {
        next(err)
    }
}

module.exports = {
    register,
    login,
    logout,

    getAllDeliveryPersons,

    getAllOrders
}