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
const { userAuth } = require("../middlewares/userAuth");

//validation middlewares
const {
  medicineValidator,
} = require("../validators/medicines/medicine.validator");

// routes
router.post(
  "/",
  userAuth,
  roleAuth("Superadmin", "Admin", "Supervisor"),
  medicineValidator,
  createMedicine
);
router.put(
  "/:id",
  userAuth,
  roleAuth("Superadmin", "Admin", "Supervisor"),
  medicineValidator,
  updateMedicine
);
router.delete(
  "/:id",
  userAuth,
  roleAuth("Superadmin", "Admin", "Supervisor"),
  deleteMedicine
);

//---------------------- can do all users ----------------------
router.get("/", getAllMedicines);
router.get("/:id", getByMedicineId);

router.put('/favourite/add', userAuth, addToFavourite)
router.get('/favourite/get', userAuth, getAllFavouriteMedicines)

module.exports = router;
