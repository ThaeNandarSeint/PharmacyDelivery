const router = require('express').Router()

// controllers
const { createOrder, getAllOrders, getByOrderId, approveOrder, cancelOrder } = require('../controllers/orderCtrl');

// middlewares
const { roleAuth } = require('../middlewares/roleAuth');

// routes
router.post('/', roleAuth("Superadmin", "Admin", "Supervisor", "Operator"), createOrder)
router.put('/confirm/:id', roleAuth("Superadmin", "Admin", "Supervisor", "Operator"), approveOrder)

// can do all users
router.get('/', getAllOrders)
router.get('/:id', getByOrderId)

router.put('/cancel/:id', cancelOrder)

module.exports = router;