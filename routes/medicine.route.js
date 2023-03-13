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
const { auth } = require("../middlewares/auth");

// middlewares
const { roleAuth } = require("../middlewares/roleAuth");

//validation middlewares
const {
  medicineValidator,
} = require("../validators/medicines/medicine.validator");

// routes
router.post(
  "/",
  auth,
  roleAuth("Superadmin", "Admin", "Supervisor"),
  medicineValidator,
  createMedicine
);
router.put(
  "/:id",
  auth,
  roleAuth("Superadmin", "Admin", "Supervisor"),
  medicineValidator,
  updateMedicine
);
router.delete(
  "/:id",
  auth,
  roleAuth("Superadmin", "Admin", "Supervisor"),
  deleteMedicine
);

//---------------------- can do all users ----------------------
router.get("/", getAllMedicines);
router.get("/:id", getByMedicineId);

router.put('/favourite/add', auth, addToFavourite)
router.get('/favourite/get', auth, getAllFavouriteMedicines)

module.exports = router;
