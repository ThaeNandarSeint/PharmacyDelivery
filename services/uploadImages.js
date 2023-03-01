const cloudinary = require('cloudinary')
const fs = require('fs')

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
})

const uploadImages = (files, folderName) => {
    // not upload 
    if (!files || Object.keys(files).length === 0) {
        const pictures = [
            {
                secure_url: 'https://res.cloudinary.com/dm5vsvaq3/image/upload/v1673412749/PharmacyDelivery/Users/default-profile-picture_nop9jb.webp',
                public_id: 'PharmacyDelivery/Users/default-profile-picture_nop9jb.webp'
            }
        ]
        return pictures
    }

    const { pictures } = files

    const uploadPromises = [];

    if (!pictures.length) {
        // validatePicture(pictures)
        uploadPromises.push(cloudinary.v2.uploader.upload(pictures.tempFilePath, {
            folder: `${folderName}/`,
            width: 600,
            height: 600,
            crop: 'fill'
        }));
    }

    for (let i = 0; i < pictures.length; i++) {
        const picture = pictures[i];

        // validatePicture(picture)

        uploadPromises.push(cloudinary.v2.uploader.upload(picture.tempFilePath, {
            folder: `${folderName}/`,
            width: 600,
            height: 600,
            crop: 'fill'
        }));
    }
    if(uploadPromises.length){
        return uploadPromises
    }    
}

const validatePicture = (picture) => {
    // file size validation
    if (picture.size > 1024 * 1024) {
        removeTmp(picture.tempFilePath)
        return res.status(400).json({ msg: "File size is too large!" })
    }//1mb

    // file type validation
    if (picture.mimetype !== 'image/jpeg' && picture.mimetype !== 'image/png') {
        removeTmp(picture.tempFilePath)
        return res.status(400).json({ msg: "File format is incorrect" })
    }
}


// remove temp file
const removeTmp = (path) => {
    fs.unlink(path, (err) => {
        if (err) throw err
    })
}

module.exports = {
    uploadImages
}