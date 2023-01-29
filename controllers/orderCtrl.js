const Users = require('../models/userModel')
const Orders = require('../models/orderModel')
const Medicines = require('../models/medicineModel')
const Categories = require('../models/categoryModel')
const DeliveryInfos = require('../models/deliveryInfoModel')
const DeliveryBoys = require('../models/deliveryBoyModel')

// services
const sendMail = require('../services/sendMail')
const { orderConfirmHtml } = require('../helpers/orderConfirmHtml')
const { createCustomId } = require('../services/createCustomId')

// create
const createOrder = async (req, res, next) => {
    try {
        const userId = req.user.id

        const { medicines, buildingNo, street, quarter, township, city, state } = req.body
        // empty validation
        if (!userId || !medicines || !buildingNo || !street || !quarter || !township || !city || !state) {
            return res.status(400).json({ status: 400, msg: "Some required information are missing!" })
        }

        const address = {
            buildingNo, street, quarter, township, city, state
        }

        let uploadPromises = []
        let quantityArray = []
        let priceArray = []

        for (let i = 0; i < medicines.length; i++) {
            const { medicineId, quantity } = medicines[i];

            const { stocks, name, orderCount, price } = await Medicines.findById(medicineId)
            if (!stocks) {
                return res.status(410).json({ status: 410, msg: `This medicine ${name} is out of stocks!` })
            }
            if (quantity > stocks) {
                return res.status(410).json({ status: 410, msg: `This medicine ${name} can be ordered less than ${stocks}!` })
            }
            priceArray.push(quantity * price)
            quantityArray.push(quantity)
            // 
            const newStock = stocks - quantity

            const newOrderCount = orderCount + 1

            uploadPromises.push(Medicines.findByIdAndUpdate(medicineId, { stocks: newStock, orderCount: newOrderCount }))
        }

        const add = (array) => {
            let total = 0
            for (let i = 0; i < array.length; i++) {
                total = total + array[i];    
            }
            return total
        }

        const totalPrice = add(priceArray)
        const totalQuantity = add(quantityArray)

        // create custom id
        const id = await createCustomId(Orders, "O")

        const { email } = await Users.findById(userId)

        if (id) {
            // store new order in mongodb
            const newOrder = new Orders({
                id, userId, medicines, address, totalPrice, totalQuantity, status: 'pending'
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

// approve order -> (pending -> deliver stage)
const approveOrder = async (req, res, next) => {
    try {

        const { prepareTime = 0, deliveryFee } = req.body

        const { status, userId } = await Orders.findById(req.params.id)

        if (status === "deliver" || status === "complete" || status === "cancel") {
            return res.status(400).json({ status: 400, msg: `Not allowed to confirm. This order has been already on ${status} stage!` })
        }

        const timeTaken = (7 * 24 * 60 * 60 * 1000) + (prepareTime * 1)  //default -> 1 week
        const deliveryTime = timeTaken / (24 * 60 * 60 * 1000)

        const deliveryBoys = await DeliveryBoys.aggregate([{ $sample: { size: 1 } }])

        const deliveryBoyId = deliveryBoys[0]._id
        const deliveryBoyStatus = deliveryBoys[0].status

        if (deliveryBoyStatus === "active") {
            return res.status(400).json({ status: 400, msg: `This delivery boy has been already on ${deliveryBoyStatus} stage!` })
        }

        const deliveryInfo = new DeliveryInfos({
            deliveryTime, customerId: userId, deliveryFee, deliveryBoyId
        })

        await deliveryInfo.save()

        await Orders.findByIdAndUpdate(req.params.id, { status: "deliver" })

        const { email } = await Users.findById(userId)

        const html = `You order has been on deliver stage and will be reach within ${deliveryTime} days`

        sendMail(email, html)

        return res.status(200).json({ status: 200, msg: "This order has been on deliver stage!" })

    } catch (err) {
        next(err)
    }
}

// deliver order -> (deliver -> complete stage)
const deliverOrder = async (req, res, next) => {
    try {

        const { status, userId } = await Orders.findById(req.params.id)

        if (status === "pending" || status === "complete" || status === "cancel") {
            return res.status(400).json({ status: 400, msg: `Not allowed to confirm. This order has been already on ${status} stage!` })
        }

        await Orders.findByIdAndUpdate(req.params.id, { status: "complete" })

        const { email } = await Users.findById(userId)

        const html = `You order has been on complete stage. If you do not receive your order, contact us`

        sendMail(email, html)

        return res.status(200).json({ status: 200, msg: "This order has been on complete stage!" })

    } catch (err) {
        next(err)
    }
}

// cancel order
const cancelOrder = async (req, res, next) => {
    try {
        const { status } = await Orders.findById(req.params.id)

        if (status === "confirm" || status === "deliver" || status === "complete" || status === "cancel") {
            return res.status(400).json({ status: 400, msg: `Not allowed to cancel. This order has been already on ${status} stage!` })
        }

        const { medicines } = await Orders.findById(req.params.id)

        for (let i = 0; i < medicines.length; i++) {
            const { medicineId, quantity } = medicines[i];

            const { stocks } = await Medicines.findById(medicineId)

            const newStocks = stocks + quantity

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
        const { page = 1, limit = 10, start = "2023-01-01", end = "2024-01-01", status = "complete", userName = "", medicineName = "", categoryTitle = "" } = req.query;

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
            $or: [
                { "userDetail.name": { $regex: userName } },
                { "medicineDetail.name": { $regex: medicineName } },
                { "categoryDetail.title": { $regex: categoryTitle } },
            ],
        }

        const groupStage = {
            _id: "$_id",
            totalQuantity: { $first: "$totalQuantity" },
            totalPrice: { $first: "$totalPrice" },
            saleByCategory: {
                $first: { 
                    categoryTitle: { $second: "$categoryDetail.title" }
                }
            }
          }

        const limitStage = limit * 1
        const skipStage = (page - 1) * limit

        const pipelines = [
            { $match: dateFilter },
            { $match: statusFilter },
            { $lookup: userLookup },
            { $lookup: medicineLookup },
            { $unwind: "$medicineDetail" },
            { $lookup: categoryLookup },
            { $unwind: "$categoryDetail" },
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

    approveOrder,
    deliverOrder,
    cancelOrder
}