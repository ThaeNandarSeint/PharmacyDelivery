const router = require("express").Router();

// controllers
const { createMessage, getMessages } = require("../controllers/messageCtrl");

router.post("/add", createMessage);
router.get("/", getMessages);

module.exports = router;