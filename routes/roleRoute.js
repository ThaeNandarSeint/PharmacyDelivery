const router = require("express").Router();

// controllers
const { createRole } = require("../controllers/roleCtrl");

// routes
router.post('/', createRole)

// 
// router.put('/grant/:id', grantRole)

module.exports = router;
