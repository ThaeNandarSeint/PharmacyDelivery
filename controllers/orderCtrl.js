const Users = require('../models/userModel')
const Orders = require('../models/orderModel')
const Medicines = require('../models/medicineModel')
const Categories = require('../models/categoryModel')

// services
const sendMail = require('../services/sendMail')
const { orderConfirmHtml } = require('../helpers/orderConfirmHtml')
const { createCustomId } = require('../services/createCustomId')

// create
const createOrder = async (req, res, next) => {
    try {
        const userId = req.user.id

        const { medicines } = req.body
        // empty validation
        if (!userId || !medicines) {
            return res.status(400).json({ status: 400, msg: "Some required information are missing!" })
        }

        let uploadPromises = []

        for (let i = 0; i < medicines.length; i++) {
            const { medicineId, orderCount } = medicines[i];

            const { stocks, name } = await Medicines.findById(medicineId)
            if (!stocks) {
                return res.status(410).json({ status: 410, msg: `This medicine ${name} is out of stocks!` })
            }
            if (orderCount > stocks) {
                return res.status(410).json({ status: 410, msg: `This medicine ${name} can be ordered less than ${stocks}!` })
            }
            const newStock = stocks - orderCount

            uploadPromises.push(Medicines.findByIdAndUpdate(medicineId, { stocks: newStock }))
        }

        // create custom id
        const id = await createCustomId(Orders, "O")

        const { email } = await Users.findById(userId)

        if (id) {
            // store new order in mongodb
            const newOrder = new Orders({
                id, userId, medicines, status: 'pending'
            })
            const savedOrder = await newOrder.save()

            Promise.all(uploadPromises).then(() => {

                const html = orderConfirmHtml()
                sendMail(email, html)

                return res.status(201).json({ status: 201, orderId: savedOrder._id, msg: "New order has been successfully created!" })
            })
        }

    } catch (err) {
        next(err)
    }
}

// approve order -> (pending -> confirm stage)
const confirmOrder = async (req, res, next) => {
    try {

        const { status } = await Orders.findById(req.params.id)

        if (status === "confirm" || status === "deliver" || status === "complete" || status === "cancel") {
            return res.status(400).json({ status: 400, msg: `Not allowed to confirm. This order has been already on ${status} stage!` })
        }

        await Orders.findByIdAndUpdate(req.params.id, { status: "confirm" })

        return res.status(200).json({ status: 200, msg: "This order has been successfully confirmed!" })

    } catch (err) {
        next(err)
    }
}

// deliver order -> (confirm -> deliver stage)

// (deliver -> complete stage)

// cancel order
const cancelOrder = async (req, res, next) => {
    try {
        const { status } = await Orders.findById(req.params.id)

        if (status === "confirm" || status === "deliver" || status === "complete" || status === "cancel") {
            return res.status(400).json({ status: 400, msg: `Not allowed to cancel. This order has been already on ${status} stage!` })
        }

        const { medicines } = await Orders.findById(req.params.id)

        for (let i = 0; i < medicines.length; i++) {
            const { medicineId, orderCount } = medicines[i];

            const { stocks } = await Medicines.findById(medicineId)

            const newStocks = stocks + orderCount

            await Medicines.findByIdAndUpdate(medicineId, { stocks: newStocks })
        }
        
        const userId = req.user.id;

        await Orders.findByIdAndUpdate(req.params.id, { status: "cancel", medicines: [], cancelBy: userId })

        return res.status(200).json({ status: 200, msg: "This order has been successfully cancelled!" })

    } catch (err) {
        next(err)
    }
}

// read ----------------------------------------------

const getByOrderId = async (req, res, next) => {
    try {
        const order = await Orders.findById(req.params.id)

        return res.status(200).json({ status: 200, order })

    } catch (err) {
        next(err);
    }
}

const getAllOrders = async (req, res, next) => {
    try {
        // for one year
        const { page = 1, limit = 10, start = "2023-01-01", end = "2024-01-01", status = "", userName = "", medicineName = "", categoryTitle = "" } = req.query;

        const startDate = new Date(start)
        const endDate = new Date(end)

        // stages
        const dateFilter = {
            createdAt: {
                $gte: startDate,
                $lt: endDate
            }
        }
        const statusFilter = {
            status: {
                $eq: status
            }
        }
        const userLookup = {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userDetail",
        }
        const medicineLookup = {
            from: "medicines",
            localField: "medicines.medicineId",
            foreignField: "_id",
            as: "medicineDetail",
        }
        const categoryLookup = {
            from: "categories",
            localField: "medicineDetail.categoryId",
            foreignField: "_id",
            as: "categoryDetail",
        }
        const matchStage = {
            $and: [
                { "userDetail.name": { $regex: userName } },
                { "medicineDetail.name": { $regex: medicineName } },
                { "categoryDetail.title": { $regex: categoryTitle } },
            ],
        }
        const groupStage = {
            _id: "$_id",
            totalOrderCount: { $sum: "medicines.orderCount" }
        }

        const limitStage = limit * 1
        const skipStage = (page - 1) * limit

        const pipelines = [
            { $match: dateFilter },
            { $match: statusFilter },
            { $lookup: userLookup },
            { $lookup: medicineLookup },
            { $lookup: categoryLookup },
            { $match: matchStage },
            // { $group: groupStage },

            { $sort: { id: -1 } },
            { $skip: skipStage },
            { $limit: limitStage }
        ]

        const orders = await Orders.aggregate(pipelines)

        return res.status(200).json({ status: 200, orders })

        // const group = {
        //     _id: "$_id",
        //     orderId: { "$first": "$orderId" },
        //     totalOrderCount: { $sum: "$medicines.orderCount" },
        //     totalPrice: { $sum: "$medicineDetails.price" },

        //     saleByCategory: {
        //         "$first": {
        //             categoryTitle: "$categoryDetails.title",
        //             totalOrderCount: { $sum: "$medicines.orderCount" },
        //             totalPrice: { $sum: "$medicineDetails.price" },
        //             items: [
        //                 {
        //                     medicineName: "$medicineDetails.name",
        //                     price: "$medicineDetails.price",
        //                     orderCount: "$medicines.orderCount"
        //                 }
        //             ]
        //         },
        //         // "$second": {
        //         //     
        //         // }
        //     }
        // }

    } catch (err) {
        next(err)
    }
}

module.exports = {
    createOrder,

    getByOrderId,

    getAllOrders,

    confirmOrder,
    cancelOrder
}