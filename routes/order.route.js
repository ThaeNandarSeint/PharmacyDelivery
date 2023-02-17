const router = require("express").Router();

// controllers
const { createOrder, getAllOrders, getByOrderId, approveOrder, cancelOrder, deliverOrder } = require('../controllers/order.controller');

// middlewares
const { roleAuth } = require("../middlewares/roleAuth");

// routes
router.post('/', createOrder)
router.put('/approve/:id', roleAuth("Superadmin", "Admin", "Supervisor", "Operator"), approveOrder)
router.put('/deliver/:id', roleAuth("Superadmin", "Admin", "Supervisor", "Operator", "DeliveryBoy"), deliverOrder)

// can do all users
router.get("/", getAllOrders);
router.get("/orderId/:id", getByOrderId);

router.put("/cancel/:id", cancelOrder);

module.exports = router;
