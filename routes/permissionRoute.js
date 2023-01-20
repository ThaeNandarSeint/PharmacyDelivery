const { createPermission } = require("../controllers/permissionCtrl");

const router = require("express").Router();

// controllers


// routes
router.post('/', createPermission)

module.exports = router;
