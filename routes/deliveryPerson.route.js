const router = require('express').Router()

const { getAllDeliveryPersons, createDeliveryPerson } = require('../controllers/user.controller');
// middlewares
const { roleAuth } = require('../middlewares/roleAuth');

router.post('/', createDeliveryPerson)
router.get('/', getAllDeliveryPersons)

module.exports = router;