const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const Users = require("../models/userModel");

const cloudinary = require('cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
})

// update My Password
const updatePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ status: 400, msg: "Some required information are missing!" })
        }

        const user = await Users.findById(req.params.id);
        if (!user) {
            return res.status(400).json({ status: 400, msg: "Something went wrong!" });
        }
        // check password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ status: 400, msg: "Current password is incorrect!" });
        }
        // change password
        const passwordHash = await bcrypt.hash(newPassword, 12);

        await Users.findByIdAndUpdate(req.params.id, {
            password: passwordHash,
        })

        return res.status(200).json({ status: 200, msg: "Your password has been successfully changed!" })

    } catch (err) {
        next(err);
        return res.status(500).json({ status: 500, msg: err.message });
    }
}

// update Me
const updateMe = async (req, res, next) => {
    try{
        const { name, pictures } = req.body
        if (!name) {
            return res.status(400).json({ status: 400, msg: "Some required information are missing!" })
        }

        const user = await Users.findById(req.params.id)

        const deletePromises = [];

        // contain 
        if (user.picPublicIds[0] !== '' && user.pictureUrls[0] !== '') {
            // delete old picture from cloudinary
            for (let i = 0; i < user.picPublicIds.length; i++) {
                const oldPicPublicId = user.picPublicIds[i];
                deletePromises.push(cloudinary.v2.uploader.destroy(oldPicPublicId));
            }
            user.picPublicIds = ['']
            user.pictureUrls = ['']
        }

        // not include photo in request body
        if (pictures[0].public_id === '' && pictures[0].secure_url === '') {
            // not exist old 
            const picPublicIds = ['PharmacyDelivery/Users/default-profile-picture_nop9jb.webp']
            const pictureUrls = ['https://res.cloudinary.com/dm5vsvaq3/image/upload/v1673412749/PharmacyDelivery/Users/default-profile-picture_nop9jb.webp']

            // update new picture in mongodb  
            await Users.findByIdAndUpdate(req.params.id, {
                name, picPublicIds, pictureUrls
            })
            return res.status(200).json({ status: 200, msg: "Your profile has been successfully updated!" })
        }

        // update new picture in mongodb
        const pictureUrls = []
        const picPublicIds = []

        Promise.all(deletePromises)
            .then(() => {
                for (let i = 0; i < pictures.length; i++) {
                    const userPicture = pictures[i];
                    pictureUrls.push(userPicture.secure_url)
                    picPublicIds.push(userPicture.public_id)
                }
            })
            .then(async () => {
                // update new picture in mongodb
                await Users.findByIdAndUpdate(req.params.id, {
                    name, pictureUrls, picPublicIds
                })

                return res.status(200).json({ status: 200, msg: "Your profile has been successfully updated!" })
            })
            .catch((err) => {
                next(err)
            });

    }catch(err){
        next(err);
        return res.status(500).json({ msg: err.message });
    }
}

// ----------------------- can do only Super Admin -------------------------------

// add new user with role


// update user
const updateUser = async (req, res, next) => {
    try {
        const { name, superAdmin, pharmacyTeam, pictures } = req.body
        if (!name && !superAdmin && !pharmacyTeam) {
            return res.status(400).json({ status: 400, msg: "Some required information are missing!" })
        }

        const isSuperAdmin = superAdmin === 'true' ? true : false
        const isPharmacyTeam = pharmacyTeam === 'true' ? true : false

        const user = await Users.findById(req.params.id)

        const deletePromises = [];

        // // contain 
        if (user.picPublicIds[0] !== '' && user.pictureUrls[0] !== '') {
            // delete old picture from cloudinary
            for (let i = 0; i < user.picPublicIds.length; i++) {
                const oldPicPublicId = user.picPublicIds[i];
                deletePromises.push(cloudinary.v2.uploader.destroy(oldPicPublicId));
            }
            user.picPublicIds = ['']
            user.pictureUrls = ['']
        }

        // // not include photo in request body
        if (pictures[0].public_id === '' && pictures[0].secure_url === '') {
            // not exist old 
            const picPublicIds = ['PharmacyDelivery/Users/default-profile-picture_nop9jb.webp']
            const pictureUrls = ['https://res.cloudinary.com/dm5vsvaq3/image/upload/v1673412749/PharmacyDelivery/Users/default-profile-picture_nop9jb.webp']

            // update new picture in mongodb  
            await Users.findByIdAndUpdate(req.params.id, {
                name, picPublicIds, pictureUrls, isSuperAdmin, isPharmacyTeam,
            })
            return res.status(200).json({ status: 200, msg: "Your profile has been successfully updated!" })
        }

        // // update new picture in cloudinary
        const pictureUrls = []
        const picPublicIds = []

        Promise.all(deletePromises)
            .then(() => {
                for (let i = 0; i < pictures.length; i++) {
                    const userPicture = pictures[i];
                    pictureUrls.push(userPicture.secure_url)
                    picPublicIds.push(userPicture.public_id)
                }
            })
            .then(async () => {
                // update new picture in mongodb
                await Users.findByIdAndUpdate(req.params.id, {
                    name, pictureUrls, picPublicIds, isSuperAdmin, isPharmacyTeam
                })

                return res.status(200).json({ status: 200, msg: "Your profile has been successfully updated!" })
            })
            .catch((err) => {
                next(err)
            });

    } catch (err) {
        next(err);
        return res.status(500).json({ status: 500, msg: err.message })
    }
}

// search user
const searchUsers = async (req, res, next) => {
    try {
        const users = await Users.find({
            "$or": [
                { name: { $regex: req.params.key } }
            ]
        }).select('-password')
        return res.status(200).json({ status: 200, users })
    } catch (err) {
        next(err);
        return res.status(500).json({ status: 500, msg: err.message })
    }
}

// get by id
const getByUserId = async (req, res, next) => {
    try {
        const user = await Users.findById(req.params.id)
        return res.status(200).json({ status: 200, user })

    } catch (err) {
        next(err);
        return res.status(500).json({ status: 500, msg: err.message })
    }
}

// get all users
const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query
        const users = await Users.find().limit(limit * 1).skip((page - 1) * limit).sort({ createdAt: -1 })

        return res.status(200).json({ status: 200, users })

    } catch (err) {
        next(err);
        return res.status(500).json({ status: 500, msg: err.message })
    }
}

// delete



module.exports = {
    updatePassword,
    updateMe,

    searchUsers,
    getByUserId,
    getAllUsers,
    updateUser
};
