const router = require('express').Router()

const { getAllDeliveryPersons, createDeliveryPerson } = require('../controllers/user.controller');
// middlewares
const { roleAuth } = require('../middlewares/roleAuth');

router.post('/', roleAuth("Superadmin", "Admin"), createDeliveryPerson)
router.get('/', roleAuth("Superadmin", "Admin"), getAllDeliveryPersons)

module.exports = router;