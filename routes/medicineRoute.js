const router = require("express").Router();

// controllers
const {
  createMedicine,
  updateMedicine,
  deleteMedicine,
  getAllMedicines,
  getByMedicineId,
  getMedicineByCategoryId,
  searchMedicines,
  getAllExpiredMedicines,
  getAllStocks,
  getAllOutOfStocks,
} = require("../controllers/medicineCtrl");

// middlewares
const { uploadImages } = require("../middlewares/uploadImages");
const { roleAuth } = require("../middlewares/roleAuth");

//validation middlewares
const {
  medicineValidator,
} = require("../validators/medicines/medicineValidator");

// routes
router.post(
  "/",
  roleAuth("Superadmin", "Admin", "Supervisor"),
  medicineValidator,
  uploadImages,
  createMedicine
);
router.put(
  "/:id",
  roleAuth("Superadmin", "Admin", "Supervisor"),
  medicineValidator,
  uploadImages,
  updateMedicine
);
router.delete(
  "/:id",
  roleAuth("Superadmin", "Admin", "Supervisor"),
  deleteMedicine
);

// read
router.get("/", getAllMedicines);
router.get("/expired", getAllExpiredMedicines);
router.get("/stocks", getAllStocks);
router.get("/outOfStocks", getAllOutOfStocks);

router.get("/:id", getByMedicineId);
router.get("/categoryId/:id", getMedicineByCategoryId);

router.get("/search/:key", searchMedicines);

module.exports = router;
