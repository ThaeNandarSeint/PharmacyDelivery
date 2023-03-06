const Users = require('../models/user.model')
const Orders = require('../models/order.model')
const Medicines = require('../models/medicine.model')
const DeliveryInfos = require('../models/deliveryInfo.model')
const DeliveryPersons = require('../models/deliveryPerson.model')
const OrderDetails = require('../models/orderDetail.model')

// services
const sendMail = require('../services/sendMail')
const { orderConfirmHtml } = require('../helpers/orderConfirmHtml')
const { createCustomId } = require('../services/createCustomId')

// create
const createOrder = async (req, res, next) => {
    try {
        const userId = req.user.id

        const { medicines, address } = req.body

        let uploadPromises = []
        let quantityArray = []
        let priceArray = []

        for (let i = 0; i < medicines.length; i++) {
            const { medicineId, quantity } = medicines[i];

            const { stocks, name, orderCount, price } = await Medicines.findById(medicineId)
            if (!stocks) {
                const error = new Error(`This medicine ${name} is out of stocks!`);
                error.status = 410;
                return next(error)
            }
            if (quantity > stocks) {
                const error = new Error(`This medicine ${name} can be ordered less than ${stocks}!`);
                error.status = 410;
                return next(error)
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

        // const newOrderDetails = await OrderDetails.insertMany(medicines)
        
        // let orderDetails = []

        // for (let i = 0; i < newOrderDetails.length; i++) {
        //     const { _id } = newOrderDetails[i];
        //     orderDetails.push(_id)
        // }

        // create custom id
        const id = await createCustomId(Orders, "O")

        const { email } = await Users.findById(userId)

        if (id) {
            // store new order in mongodb
            const newOrder = new Orders({
                id, userId, address, orderDetails: medicines, totalPrice, totalQuantity, status: 'pending'
            })
            const savedOrder = await newOrder.save()

            Promise.all(uploadPromises).then(() => {

                // const html = orderConfirmHtml()
                // // sendMail(email, html)

                return res.status(201).json({ statusCode: 201, payload: savedOrder, message: "New order has been successfully created!" })
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
            const error = new Error(`Not allowed to confirm. This order has been already on ${status} stage!`);
            error.status = 400;
            return next(error)
        }

        const timeTaken = (7 * 24 * 60 * 60 * 1000) + (prepareTime * 1)  //default -> 1 week
        const deliveryTime = timeTaken / (24 * 60 * 60 * 1000)

        const matchStage = {
            status: {
                $eq: "inactive"
            }
        }

        const deliveryBoys = await DeliveryPersons.aggregate([{ $match: matchStage }, { $sample: { size: 1 } }])
        if (!deliveryBoys) {
            const error = new Error("All delivery boys are busy!");
            error.status = 400;
            return next(error)
        }

        const deliveryBoyId = deliveryBoys[0]._id
        const deliveryBoyStatus = deliveryBoys[0].status

        if (deliveryBoyStatus === "active") {
            const error = new Error(`This delivery boy has been already on ${deliveryBoyStatus} stage!`);
            error.status = 400;
            return next(error)
        }
        // create custom id
        const id = await createCustomId(DeliveryInfos, "DI")

        const deliveryInfo = new DeliveryInfos({
            id, deliveryTime, customerId: userId, deliveryFee, deliveryBoyId
        })

        await deliveryInfo.save()

        await Orders.findByIdAndUpdate(req.params.id, { status: "deliver" })
        await DeliveryPersons.findByIdAndUpdate(deliveryBoyId, { status: "active" })

        const { email } = await Users.findById(userId)

        const html = `You order has been on deliver stage and will be reach within ${deliveryTime} days`

        sendMail(email, html)

        return res.status(200).json({ statusCode: 200, payload: {}, message: "This order has been on deliver stage!" })

    } catch (err) {
        next(err)
    }
}

// deliver order -> (deliver -> complete stage)
const deliverOrder = async (req, res, next) => {
    try {

        const { status, userId } = await Orders.findById(req.params.id)

        if (status === "pending" || status === "complete" || status === "cancel") {
            const error = new Error(`Not allowed to confirm. This order has been already on ${status} stage!`);
            error.status = 400;
            return next(error)
        }

        await Orders.findByIdAndUpdate(req.params.id, { status: "complete" })

        const { email } = await Users.findById(userId)

        const html = `You order has been on complete stage. If you do not receive your order, contact us`

        sendMail(email, html)

        return res.status(200).json({ statusCode: 200, payload: {}, message: "This order has been on complete stage!" })

    } catch (err) {
        next(err)
    }
}

// cancel order
const cancelOrder = async (req, res, next) => {
    try {
        const { status } = await Orders.findById(req.params.id)

        if (status === "confirm" || status === "deliver" || status === "complete" || status === "cancel") {
            const error = new Error(`Not allowed to cancel. This order has been already on ${status} stage!`);
            error.status = 400;
            return next(error)
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

        return res.status(200).json({ statusCode: 200, payload: {}, message: "This order has been successfully cancelled!" })

    } catch (err) {
        next(err)
    }
}

// read ----------------------------------------------

const getByOrderId = async (req, res, next) => {
    try {
        const order = await Orders.findById(req.params.id)

        return res.status(200).json({ statusCode: 200, payload: order, message: "" })

    } catch (err) {
        next(err);
    }
}

const getAllOrders = async (req, res, next) => {
    try {
        // for one year
        const { page = 1, limit = 12, start = "2023-01-01", end = "2024-01-01", status = "pending", userName = "", medicineName = "", categoryTitle = "" } = req.query;

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
        const orderDetailLookup = {
            from: "orderdetails",
            localField: "orderDetails",
            foreignField: "_id",
            as: "orderDetail",
        }

        const userLookup = {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userDetail",
        }
        const medicineLookup = {
            from: "medicines",
            localField: "medicines[0].medicineId",
            foreignField: "_id",
            as: "medicineDetails",
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

        const projectStage = {
            "userDetail._id": 0,
            "userDetail.id": 0,
            "userDetail.email": 0,
            "userDetail.password": 0,
            "userDetail.pictureUrls": 0,
            "userDetail.picPublicIds": 0,

            "userDetail.isTwoFactor": 0,
            "userDetail.phoneNumber": 0,
            "userDetail.favouriteMedicines": 0,
            "userDetail.createdAt": 0,
            "userDetail.updatedAt": 0,
            "userDetail.roleType": 0,
        }

        const limitStage = limit * 1
        const skipStage = (page - 1) * limit

        const pipelines = [
            { $match: dateFilter },
            { $match: statusFilter },

            { $lookup: userLookup },
            { $project: projectStage },            

            // { $unwind: "$orderDetails" },
            // { $lookup: orderDetailLookup },

            // { $lookup: medicineLookup },
            // { $unwind: "$medicineDetails" },
            // { $lookup: categoryLookup },
            // { $unwind: "$categoryDetail" },
            { $match: matchStage },
            // { $group: groupStage },

            { $sort: { updatedAt: -1 } },
            { $skip: skipStage },
            { $limit: limitStage }
        ]

        const orders = await Orders.aggregate(pipelines)

        const documentCount = await Orders.countDocuments()

        return res.status(200).json({ statusCode: 200, payload: orders, total: documentCount, message: "" })

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