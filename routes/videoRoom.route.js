const { createRoom, getAllRooms, getByRoomSid, closeRoom, listenTwilioEvent } = require('../controllers/videoRoom.controller');

const router = require('express').Router()

router.post('/', createRoom)
router.get('/', getAllRooms)
router.get('/:sid', getByRoomSid)
router.post('/:sid/complete', closeRoom)

// twilio
router.post('/room-events', listenTwilioEvent)

  module.exports = router;