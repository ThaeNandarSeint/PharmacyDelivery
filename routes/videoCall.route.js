const { createVideoCall } = require('../controllers/videoCall.controller');

const router = require('express').Router()

router.post('/join', createVideoCall)

  module.exports = router;