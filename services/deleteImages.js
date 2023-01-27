const cloudinary = require('cloudinary')

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
})

const deleteImages = (picPublicIds) => {

    const deletePromises = [];

    for (let i = 0; i < picPublicIds.length; i++) {
        const picPublicId = picPublicIds[i];
        deletePromises.push(cloudinary.v2.uploader.destroy(picPublicId));
        // return cloudinary.v2.uploader.destroy(picPublicId)
    }

    if (deletePromises.length) {
        return deletePromises
    }

}

module.exports = {
    deleteImages
}