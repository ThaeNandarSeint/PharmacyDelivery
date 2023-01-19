const router = require('express').Router()

const { createMedicine, updateMedicine, deleteMedicine, getAllMedicines, getByMedicineId, getMedicineByCategoryId, searchMedicines } = require('../controllers/medicineCtrl');
// controllers


// middlewares
const { uploadImages } = require('../middlewares/uploadImages');
const { medicineValidator } = require('../validators/medicines/medicineValidator');

// routes
router.post('/', medicineValidator, uploadImages, createMedicine)
router.put('/:id', medicineValidator, uploadImages, updateMedicine)
router.delete('/:id', deleteMedicine)

// read
router.get('/', getAllMedicines)
router.get('/:id', getByMedicineId)
router.get('/categoryId/:id', getMedicineByCategoryId)

router.get('/search/:key', searchMedicines)

module.exports = router;