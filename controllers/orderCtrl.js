const Users = require('../models/userModel')
const Orders = require('../models/orderModel')
const Medicines = require('../models/medicineModel')
const Categories = require('../models/categoryModel')

// services
const sendMail = require('../services/sendMail')

// create
const createOrder = async (req, res, next) => {
    try {
        const userId = req.user.id

        const { medicines } = req.body
        if (!userId || !medicines) {
            return res.status(400).json({ status: false, msg: "Some required information are missing!" })
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

        let newOrderId;

        const documentCount = await Orders.countDocuments()
        newOrderId = "O_" + (documentCount + 1)

        const lastOrder = await Orders.findOne().sort({ createdAt: -1 })

        if (lastOrder) {
            const { orderId } = lastOrder
            const charArray = orderId.split("")
            const newCharArray = charArray.filter((char) => char !== 'O' && char !== "_")
            const oldOrderId = newCharArray.toString()

            newOrderId = "O_" + ((oldOrderId * 1) + 1)
        }

        const { email } = await Users.findById(userId)        

        if (newOrderId) {
            // store new order in mongodb
            const newOrder = new Orders({
                orderId: newOrderId, userId, medicines, isPending: true
            })
            const savedOrder = await newOrder.save()          

            const html = `
            <div style="max-width: 700px; margin:auto; border: 10px solid #ddd; padding: 50px 20px; font-size: 110%;">
                <h2 style="text-align: center; text-transform: uppercase;color: #009688;">Welcome From Pharmacy Delivery App</h2>
                <p>Congratulations! Order Confirmed!</span>
                </p>
            </div>
            `

            

            Promise.all(uploadPromises).then(() => {
                console.log('ok');
            })

            // sendMail(email, html)

            return res.status(201).json({ status: 201, orderId: savedOrder._id, msg: "New order has been successfully created!" })
        }

    } catch (err) {
        next(err)
    }
}

// approve order -> deliver stage
const approveOrder = async (req, res, next) => {
    try {

        const { isCancel } = await Orders.findById(req.params.id)
        if (isCancel) {
            return res.status(400).json({ status: 400, msg: "This order has been already cancelled!" })
        }

        await Orders.findByIdAndUpdate(req.params.id, { isPending: false, isDeliver: true })

        return res.status(200).json({ status: 200, msg: "This order has been successfully approved!" })

    } catch (err) {
        next(err)
    }
}

// cancel order
const cancelOrder = async (req, res, next) => {
    try {
        const userId = req.user.id

        const { isDeliver } = await Orders.findById(req.params.id)
        const { isCancel } = await Orders.findById(req.params.id)

        if (isCancel) {
            return res.status(400).json({ status: 400, msg: "This order has been already cancelled!" })
        }
        if (isDeliver) {
            return res.status(406).json({ status: 406, msg: "Not allowed to cancel. This order is on deliver stage!" })
        }

        const { orderCount } = await Orders.findById(req.params.id)
        const { medicineId } = await Orders.findById(req.params.id)

        const { stocks } = await Medicines.findById(medicineId)
        const newStocks = stocks + orderCount

        await Medicines.findByIdAndUpdate(medicineId, { stocks: newStocks })

        await Orders.findByIdAndUpdate(req.params.id, { isPending: false, isDeliver: false, isCancel: true, orderCount: 0, cancelBy: userId })

        return res.status(200).json({ status: 200, msg: "This order has been successfully cancelled!" })

    } catch (err) {
        next(err)
    }
}

// update order status -> cannot process
const changeToPending = async (req, res, next) => {
    try{       

        const userId = req.user.id

        const { isCancel } = await Orders.findById(req.params.id)

        if (isCancel) {
            return res.status(400).json({ status: 400, msg: "This order has been already cancelled!" })
        }

        

    }catch(err){
        next(err)
    }
}

// delete

// get medicine by medicine id
const getByOrderId = async (req, res, next) => {
    try {
        const order = await Orders.findById(req.params.id)

        return res.status(200).json({ status: 200, order })

    } catch (err) {
        next(err);
    }
}

// search orders

// get order by medicine id
const getOrderByMedicineId = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query

        const { start, end } = req.query //2023-01-01
        if (!start || !end) {

            const orders = await Orders.find({ medicineId: req.params.id }).limit(limit * 1).skip((page - 1) * limit).sort({ createdAt: -1 })

            return res.status(200).json({ status: 200, orders })
        }

        const startDate = new Date(start).toISOString()
        const endDate = new Date(end).toISOString()

        const orders = await Orders.find({
            createdAt: {
                "$gte": startDate,
                "$lt": endDate
            }
        }, { medicineId: req.params.id }).limit(limit * 1).skip((page - 1) * limit).sort({ createdAt: -1 })

        return res.status(200).json({ status: 200, orders })

    } catch (err) {
        next(err);
    }
}

// get order by user id
const getOrderByUserId = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query

        const { start, end } = req.query //2023-01-01
        if (!start || !end) {

            const orders = await Orders.find({ userId: req.params.id }).limit(limit * 1).skip((page - 1) * limit).sort({ createdAt: -1 })

            return res.status(200).json({ status: 200, orders })
        }

        const startDate = new Date(start).toISOString()
        const endDate = new Date(end).toISOString()

        const orders = await Orders.find({
            createdAt: {
                "$gte": startDate,
                "$lt": endDate
            }
        }, { userId: req.params.id }).limit(limit * 1).skip((page - 1) * limit).sort({ createdAt: -1 })

        return res.status(200).json({ status: 200, orders })

    } catch (err) {
        next(err);
    }
}

// get all medicines for every users
const getAllOrders = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query

        const { start = 2023-01-01 , end = 2023-02-01 } = req.query //2023-01-01
        
        // const startDate = new Date(start).toISOString() <- can use in find()

        const startDate = new Date(start)
        const endDate = new Date(end)

        const filter = {
            createdAt: {
                $gte: startDate,
                $lt: endDate
            }
        }

        const medicineLookup = {
            from: "medicines",
            localField: "medicines.medicineId",
            foreignField: "_id",
            as: "medicineDetails"
        }

        const categoryLookup = {
            from: "categories",
            localField: "medicineDetails.categoryId",
            foreignField: "_id",
            as: "categoryDetails"
        }

        const group = {
            _id: "$_id",
            orderId: { "$first": "$orderId" },
            totalOrderCount: { $sum: "$medicines.orderCount" },
            totalPrice: { $sum: "$medicineDetails.price" },

            saleByCategory: {
                "$first": {
                    categoryTitle: "$categoryDetails.title",
                    totalOrderCount: { $sum: "$medicines.orderCount" },
                    totalPrice: { $sum: "$medicineDetails.price" },
                    items: [
                        {
                            medicineName: "$medicineDetails.name",
                            price: "$medicineDetails.price",
                            orderCount: "$medicines.orderCount"
                        }
                    ]
                },
                // "$second": {
                //     
                // }
            }
        }

        const orders = await Orders.aggregate([
            { $match: filter },
            { $unwind: "$medicines" },
            { $lookup: medicineLookup },
            { $unwind: "$medicineDetails" },
            { $lookup:  categoryLookup},
            { $unwind: "$categoryDetails" },
            { $group: group },
            // { $unwind: "$saleByCategory.items" }
        ]).limit(limit * 1).skip((page - 1) * limit).sort({ createdAt: -1 })

        return res.status(200).json({ status: 200, orders })

    } catch (err) {
        next(err);
    }
}

// get all pending orders
const getAllPendingOrders = async (req, res, next) => {
    try {

        const { page = 1, limit = 10 } = req.query

        const { start, end } = req.query //2023-01-01
        if (!start || !end) {

            const orders = await Orders.find({ isPending: true }).limit(limit * 1).skip((page - 1) * limit).sort({ createdAt: -1 })

            return res.status(200).json({ status: 200, orders })
        }

        const startDate = new Date(start).toISOString()
        const endDate = new Date(end).toISOString()

        const orders = await Orders.find({
            createdAt: {
                "$gte": startDate,
                "$lt": endDate
            }
        }, { isPending: true }).limit(limit * 1).skip((page - 1) * limit).sort({ createdAt: -1 })

        return res.status(200).json({ status: 200, orders })

    } catch (err) {
        next(err);
    }
}

// get all deliver orders
const getAllDeliverOrders = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query

        const { start, end } = req.query //2023-01-01
        if (!start || !end) {

            const orders = await Orders.find({ isDeliver: true }).limit(limit * 1).skip((page - 1) * limit).sort({ createdAt: -1 })

            return res.status(200).json({ status: 200, orders })
        }

        const startDate = new Date(start).toISOString()
        const endDate = new Date(end).toISOString()

        const orders = await Orders.find({
            createdAt: {
                "$gte": startDate,
                "$lt": endDate
            }
        }, { isDeliver: true }).limit(limit * 1).skip((page - 1) * limit).sort({ createdAt: -1 })

        return res.status(200).json({ status: 200, orders })

    } catch (err) {
        next(err);
    }
}

// get all cancel orders
const getAllCancelOrders = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query

        const { start, end } = req.query //2023-01-01
        if (!start || !end) {

            const orders = await Orders.find({ isCancel: true }).limit(limit * 1).skip((page - 1) * limit).sort({ createdAt: -1 })

            return res.status(200).json({ status: 200, orders })
        }

        const startDate = new Date(start).toISOString()
        const endDate = new Date(end).toISOString()

        const orders = await Orders.find({
            createdAt: {
                "$gte": startDate,
                "$lt": endDate
            }
        }, { isCancel: true }).limit(limit * 1).skip((page - 1) * limit).sort({ createdAt: -1 })

        return res.status(200).json({ status: 200, orders })

    } catch (err) {
        next(err);
    }
}

module.exports = {
    createOrder,

    getByOrderId,
    getOrderByMedicineId,
    getOrderByUserId,
    getAllOrders,
    getAllPendingOrders,
    getAllDeliverOrders,
    getAllCancelOrders,

    approveOrder,
    cancelOrder
}