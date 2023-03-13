const router = require('express').Router()

const { register, login, logout, getAllOrders, getAllDeliveryPersons } = require('../controllers/deliveryPerson.controller');

const { deliveryPersonAuth } = require('../middlewares/deliveryPersonAuth');
// middlewares
const { roleAuth } = require('../middlewares/roleAuth');
const { userAuth } = require('../middlewares/userAuth');

// router.post('/', roleAuth("Superadmin", "Admin"), createDeliveryPerson)
// router.get('/', roleAuth("Superadmin", "Admin"), getAllDeliveryPersons)

router.post('/register', register)
router.post('/login', login)
router.get('/logout', logout)

router.get("/orders", deliveryPersonAuth, getAllOrders);

router.get("/", userAuth, roleAuth("Superadmin", "Admin"), getAllDeliveryPersons);

module.exports = router;