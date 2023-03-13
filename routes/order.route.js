const router = require("express").Router();

// controllers
const { createOrder, getAllOrders, getByOrderId, approveOrder, cancelOrder, deliverOrder, getMyOrders } = require('../controllers/order.controller');
const { deliveryPersonAuth } = require("../middlewares/deliveryPersonAuth");

// middlewares
const { roleAuth } = require("../middlewares/roleAuth");

// routes
router.post('/', roleAuth("Customer"), createOrder)
router.put('/approve/:id', roleAuth("Superadmin", "Admin", "Supervisor", "Operator"), approveOrder)


// can do all users
router.get("/", roleAuth("Superadmin", "Admin", "Supervisor", "Operator"), getAllOrders);


router.get("/me", getMyOrders);
router.get("/:id", roleAuth("Superadmin", "Admin", "Supervisor", "Operator"), getByOrderId);

router.put("/cancel/:id", cancelOrder);

module.exports = router;
