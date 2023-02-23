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

        await twilioClient.video.v1.rooms(roomName).fetch()

    } catch (error) {

        if (error.code == 20404) {
            await twilioClient.video.v1.rooms.create({
                uniqueName: roomName,
                type: "go",
            });

        } else {
            throw error;
        }
    }
}

const getAccessToken = (roomName, userId) => {
    const token = new AccessToken(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_API_KEY_SID,
        process.env.TWILIO_API_KEY_SECRET,
        
        { identity: userId }
    );
    
    const videoGrant = new VideoGrant({
        room: roomName,
    });

    
    token.addGrant(videoGrant);

    return token.toJwt();
};

module.exports = {
    findOrCreateRoom,
    getAccessToken
}