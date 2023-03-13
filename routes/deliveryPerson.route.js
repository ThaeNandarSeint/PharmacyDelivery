const router = require('express').Router()

const { register, login, logout, getAllOrders, getAllDeliveryPersons } = require('../controllers/deliveryPerson.controller');
const { deliverOrder } = require('../controllers/order.controller');
const { auth } = require('../middlewares/auth');

// middlewares
const { roleAuth } = require('../middlewares/roleAuth');

// router.post('/', roleAuth("Superadmin", "Admin"), createDeliveryPerson)
// router.get('/', roleAuth("Superadmin", "Admin"), getAllDeliveryPersons)

router.post('/register', register)
router.post('/login', login)
router.get('/logout', logout)

router.get("/orders", auth, roleAuth("Superadmin", "Admin", "DeliveryPerson"), getAllOrders);
router.put('/orders/complete/:id', auth, roleAuth("Superadmin", "Admin", "DeliveryPerson"), deliverOrder)

router.get("/", auth, roleAuth("Superadmin", "Admin"), getAllDeliveryPersons);

module.exports = router;