const Orders = require('../models/orderModel')
const Medicines = require('../models/medicineModel')

// create
const createOrder = async (req, res, next) => {
    try{

        const { userId, medicineId, orderCount } = req.body
        if(!userId || !medicineId || !orderCount){
            return res.status(400).json({ status: false, msg: "Some required information are missing!" })
        }

        const { stocks } = await Medicines.findById(medicineId)
        if(!stocks){
            return res.status(410).json({ status: 410, msg: "Out of stocks!" })
        }

        if(orderCount > stocks){
            return res.status(410).json({ status: 410, msg: `Can order less than ${stocks} products!` })
        }

        const newStocks = stocks - orderCount

        // // store new order in mongodb
        const newOrder = new Orders({
            userId, medicineId, orderCount, isPending: true
        })
        const savedOrder = await newOrder.save()

        await Medicines.findByIdAndUpdate(medicineId, { stocks: newStocks })

        return res.status(201).json({ status: 201, orderId: savedOrder._id, msg: "New order has been successfully created!" })

    }catch(err){
        next(err)
    }
}

// approve order -> deliver stage
const approveOrder = async (req, res, next) => {
    try{

        const { isCancel } = await Orders.findById(req.params.id)
        if(isCancel){
            return res.status(400).json({ status: 400, msg: "This order has been already cancelled!" })
        }

        await Orders.findByIdAndUpdate(req.params.id, { isPending: false, isDeliver: true })

        return res.status(200).json({ status: 200, msg: "This order has been successfully approved!" })

    }catch(err){
        next(err)
    }
}

// cancel order
const cancelOrder = async (req, res, next) => {
    try{
        const userId = req.user.id

        const { isDeliver } = await Orders.findById(req.params.id)
        const { isCancel } = await Orders.findById(req.params.id)        

        if(isCancel){
            return res.status(400).json({ status: 400, msg: "This order has been already cancelled!" })
        }
        if(isDeliver){
            return res.status(406).json({ status: 406, msg: "Not allowed to cancel. This order is on deliver stage!" })
        } 

        const { orderCount } = await Orders.findById(req.params.id)
        const { medicineId } = await Orders.findById(req.params.id)

        const { stocks } = await Medicines.findById(medicineId)
        const newStocks = stocks + orderCount
        
        await Medicines.findByIdAndUpdate(medicineId, { stocks: newStocks })

        await Orders.findByIdAndUpdate(req.params.id, { isPending: false, isDeliver: false, isCancel: true, orderCount: 0, cancelBy: userId })  
        
        return res.status(200).json({ status: 200, msg: "This order has been successfully cancelled!" })

    }catch(err){
        next(err)
    }
}

// update

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
        if(!start || !end){
            
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
        if(!start || !end){
            
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
const getAllOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query

        const { start, end } = req.query //2023-01-01
        if(!start || !end){
            
            const orders = await Orders.find().limit(limit * 1).skip((page - 1) * limit).sort({ createdAt: -1 })

            return res.status(200).json({ status: 200, orders })
        }

        const startDate = new Date(start).toISOString()
        const endDate = new Date(end).toISOString()

        const orders = await Orders.find({
            createdAt: {
               "$gte": startDate,
               "$lt": endDate
            }
        }).limit(limit * 1).skip((page - 1) * limit).sort({ createdAt: -1 })

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
        if(!start || !end){
            
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
        if(!start || !end){
            
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
        if(!start || !end){
            
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