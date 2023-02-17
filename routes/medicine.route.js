const router = require("express").Router();

// controllers
const {
  createMedicine,
  updateMedicine,
  deleteMedicine,
  getAllMedicines,
  getByMedicineId,
  addToFavourite,
  getAllFavouriteMedicines,
} = require("../controllers/medicine.controller");

// middlewares
const { roleAuth } = require("../middlewares/roleAuth");

//validation middlewares
const {
  medicineValidator,
} = require("../validators/medicines/medicine.validator");

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

//---------------------- can do all users ----------------------
router.get("/", getAllMedicines);
router.get("/:id", getByMedicineId);

router.put('/favourite/add', addToFavourite)
router.get('/favourite/get', getAllFavouriteMedicines)

module.exports = router;
