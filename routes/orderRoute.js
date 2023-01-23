const { createOrder, getAllOrders, getByOrderId, getOrderByMedicineId, getOrderByUserId, getAllPendingOrders, getAllDeliverOrders, getAllCancelOrders, approveOrder, cancelOrder, getOrdersByDateRange } = require('../controllers/orderCtrl');
const { orderValidator } = require('../validators/orders/orderValidator');

const router = require('express').Router()

// routes
router.post('/', orderValidator, createOrder)

// read
router.get('/', getAllOrders)
router.get('/orderId/:id', getByOrderId)
router.get('/medicineId/:id', getOrderByMedicineId)
router.get('/userId/:id', getOrderByUserId)

router.get('/pending', getAllPendingOrders)
router.get('/deliver', getAllDeliverOrders)
router.get('/cancel', getAllCancelOrders)

router.put('/cancel/:id', cancelOrder)

// cannot do normal users
router.put('/approve/:id', approveOrder)

module.exports = router;