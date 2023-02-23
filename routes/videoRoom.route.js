const { createRoom, getAllRooms, getByRoomSid, closeRoom } = require('../controllers/videoRoom.controller');

const router = require('express').Router()

router.post('/', createRoom)
router.get('/', getAllRooms)
router.get('/:sid', getByRoomSid)
router.post('/:sid/complete', closeRoom)

  module.exports = router;