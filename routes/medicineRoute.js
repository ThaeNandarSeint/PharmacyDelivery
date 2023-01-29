const router = require("express").Router();

// controllers
const {
  createMedicine,
  updateMedicine,
  deleteMedicine,
  getAllMedicines,
  getByMedicineId,
  getAllExpiredMedicines,
  getAllStocks,
  getAllOutOfStocks,
  addToFavourite,
  getAllFavouriteMedicines,
} = require("../controllers/medicineCtrl");

// middlewares
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
  createMedicine
);
router.put(
  "/:id",
  roleAuth("Superadmin", "Admin", "Supervisor"),
  medicineValidator,
  updateMedicine
);
router.delete(
  "/:id",
  roleAuth("Superadmin", "Admin", "Supervisor"),
  deleteMedicine
);

// can do all users
router.put('/favourite/add', addToFavourite)
router.get('/favourite/get', getAllFavouriteMedicines)

// 
router.get("/", getAllMedicines);
router.get("/expired", getAllExpiredMedicines);
router.get("/stocks", getAllStocks);
router.get("/outOfStocks", getAllOutOfStocks);

router.get("/:id", getByMedicineId);

module.exports = router;
