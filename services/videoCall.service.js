const AccessToken = require("twilio").jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;
const { v4: uuidv4 } = require("uuid");

const twilioClient = require("twilio")(
    process.env.TWILIO_API_KEY_SID,
    process.env.TWILIO_API_KEY_SECRET,
    { accountSid: process.env.TWILIO_ACCOUNT_SID }
);

const findOrCreateRoom = async (roomName) => {
    try {

        await twilioClient.video.rooms(roomName).fetch();

    } catch (error) {

        if (error.code == 20404) {
            await twilioClient.video.rooms.create({
                uniqueName: roomName,
                type: "go",
            });

        } else {
            throw error;
        }
    }
}

const getAccessToken = (roomName) => {
    const token = new AccessToken(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_API_KEY_SID,
        process.env.TWILIO_API_KEY_SECRET,
        // generate a random unique identity for this participant
        { identity: uuidv4() }
    );
    // create a video grant for this specific room
    const videoGrant = new VideoGrant({
        room: roomName,
    });

    // add the video grant
    token.addGrant(videoGrant);
    // serialize the token and return it
    return token.toJwt();
};

module.exports = {
    findOrCreateRoom,
    getAccessToken
}