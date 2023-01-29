const router = require('express').Router()

const { getAllDeliveryBoys, createDeliveryBoy } = require('../controllers/userCtrl');
// middlewares
const { roleAuth } = require('../middlewares/roleAuth');

router.post('/', roleAuth("Superadmin", "Admin"), createDeliveryBoy)
router.get('/', roleAuth("Superadmin", "Admin"), getAllDeliveryBoys)

module.exports = router;