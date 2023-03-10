const router = require("express").Router();

// controllers
const { createOrder, getAllOrders, getByOrderId, approveOrder, cancelOrder, deliverOrder, getMyOrders } = require('../controllers/order.controller');

// middlewares
const { roleAuth } = require("../middlewares/roleAuth");

// routes
router.post('/', createOrder)
router.put('/approve/:id', roleAuth("Superadmin", "Admin", "Supervisor", "Operator"), approveOrder)
router.put('/complete/:id', roleAuth("Superadmin", "Admin", "Supervisor", "Operator", "DeliveryPerson"), deliverOrder)

// can do all users
router.get("/", roleAuth("Superadmin", "Admin", "Supervisor", "Operator"), getAllOrders);
router.get("/me", getMyOrders);
router.get("/orderId/:id", getByOrderId);

router.put("/cancel/:id", cancelOrder);

module.exports = router;
