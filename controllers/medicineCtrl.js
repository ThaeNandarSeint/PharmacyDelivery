const cloudinary = require('cloudinary')

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
})

// models
const Medicines = require('../models/medicineModel')

// create
const createMedicine = async (req, res, next) => {
    try {
        const { categoryId, name, details, companyName, expiredAt, price, stocks, pictures } = req.body

        if (!categoryId || !name || !details || !companyName || !expiredAt || !price || !stocks || !pictures) {
            return res.status(400).json({ status: false, msg: "Some required information are missing!" })
        }

        const pictureUrls = []
        const picPublicIds = []

        for (let i = 0; i < pictures.length; i++) {
            const medicinePicture = pictures[i];
            pictureUrls.push(medicinePicture.secure_url)
            picPublicIds.push(medicinePicture.public_id)
        }

        const expiredDate = new Date(expiredAt).toISOString()

        let newMedicineId;   
        
        const documentCount = await Medicines.countDocuments() 
        newMedicineId = "M_" + (documentCount + 1)  

        const lastMedicine = await Medicines.findOne().sort({ createdAt: -1 })

        if(lastMedicine){
            const { medicineId } = lastMedicine
            const charArray = medicineId.split("")
            const newCharArray = charArray.filter((char) => char !== 'M' && char !== "_")            

            const oldMedicineId = newCharArray.toString()

            newMedicineId = "M_" + ((oldMedicineId * 1) + 1)
        }              

        // store new medicine in mongodb
        if(newMedicineId){
            const newMedicine = new Medicines({
                medicineId: newMedicineId, categoryId, name, details, companyName, expiredDate, price, stocks, pictureUrls, picPublicIds
            })
            const savedMedicine = await newMedicine.save()
            return res.json({ status: true, medicineId: savedMedicine._id, msg: "New Medicine has been successfully uploaded!" })
        }

    } catch (err) {
        next(err);
    }
}

// update
const updateMedicine = async (req, res, next) => {
    try {
        const { categoryId, name, details, companyName, expiredAt, price, stocks, pictures } = req.body

        if (!categoryId || !name || !details || !companyName || !expiredAt || !price || !stocks || !pictures) {
            return res.status(400).json({ status: false, msg: "Some required information are missing!" })
        }
        const expiredDate = new Date(expiredAt).toISOString()

        const medicine = await Medicines.findById(req.params.id)

        const deletePromises = [];

        // contain 
        if (medicine.picPublicIds[0] !== '' && medicine.pictureUrls[0] !== '') {
            // delete old picture from cloudinary
            for (let i = 0; i < medicine.picPublicIds.length; i++) {
                const oldPicPublicId = medicine.picPublicIds[i];
                deletePromises.push(cloudinary.v2.uploader.destroy(oldPicPublicId));
            }
            medicine.picPublicIds = ['']
            medicine.pictureUrls = ['']
        }

        // not include photo in request body
        if (pictures[0].public_id === '' && pictures[0].secure_url === '') {
            // not exist old 
            const picPublicIds = ['']
            const pictureUrls = ['']

            // update new picture in mongodb  
            await Medicines.findByIdAndUpdate(req.params.id, {
                categoryId, name, details, companyName, expiredDate, price, stocks, pictureUrls, picPublicIds
            })
            return res.json({ status: true, msg: "Your Medicine has been successfully updated!" })
        }

        // update new picture in cloudinary
        const pictureUrls = []
        const picPublicIds = []

        Promise.all(deletePromises)
            .then(() => {
                for (let i = 0; i < pictures.length; i++) {
                    const medicinePicture = pictures[i];
                    pictureUrls.push(medicinePicture.secure_url)
                    picPublicIds.push(medicinePicture.public_id)
                }
            }).then(async () => {
                // update new picture in mongodb
                await Medicines.findByIdAndUpdate(req.params.id, {
                    categoryId, name, details, companyName, expiredDate, price, stocks, pictureUrls, picPublicIds
                })

                return res.json({ status: true, msg: "Your medicine has been successfully updated!" })
            })
            .catch((err) => {
                console.log(err);
            });

    } catch (err) {
        next(err);
    }
}

// update stocks
const updateStocks = async (req, res, next) => {
    try{

        const { stocks } = req.body

        await Medicines.findByIdAndUpdate(req.params.id, {
            stocks
        })
        return res.json({ status: true, msg: "Stocks have been successfully updated!" })

    }catch(err){
        next(err)
    }
}

// delete
const deleteMedicine = async (req, res, next) => {
    try {
        const { picPublicIds } = await Medicines.findById(req.params.id)

        // // not include photo
        if (picPublicIds[0] === '') {
            await Medicines.findByIdAndDelete(req.params.id)
            return res.json({ status: true, msg: "Your medicine has been successfully deleted!" })
        }

        // // include photo
        const deletePromises = [];

        for (let i = 0; i < picPublicIds.length; i++) {
            const picPublicId = picPublicIds[i];
            deletePromises.push(cloudinary.v2.uploader.destroy(picPublicId));
        }

        Promise.all(deletePromises)
            .then(async () => {
                await Medicines.findByIdAndDelete(req.params.id)
                return res.json({ status: true, msg: "Your medicine has been successfully deleted!" })
            })
            .catch((err) => {
                console.log(err);
            });

    } catch (err) {
        next(err);
    }
}


// read -----------------------------------------------

// get medicine by medicine id
const getByMedicineId = async (req, res, next) => {
    try {
        const medicine = await Medicines.findById(req.params.id)

        return res.status(200).json({ status: 200, medicine })

    } catch (err) {
        next(err);
    }
}

// search medicines
const searchMedicines = async (req, res, next) => {
    try {

        const { page = 1, limit = 10 } = req.query

        const { start, end } = req.query //2023-01-01
        if (!start || !end) {

            const medicines = await Medicines.find({
                "$or": [
                    { name: { $regex: req.params.key } }
                ]
            }).limit(limit * 1).skip((page - 1) * limit).sort({ createdAt: -1 })
    
            return res.status(200).json({ status: 200, medicines })
        }

        const startDate = new Date(start).toISOString()
        const endDate = new Date(end).toISOString()

        const medicines = await Medicines.find({
            "$or": [
                { name: { $regex: req.params.key } }
            ]
        }, {
            createdAt: {
                "$gte": startDate,
                "$lt": endDate
            }
        }).limit(limit * 1).skip((page - 1) * limit).sort({ createdAt: -1 })

        return res.status(200).json({ status: 200, medicines })          

    } catch (err) {
        next(err);
    }
}

// get medicine by category id
const getMedicineByCategoryId = async (req, res, next) => {
    try {

        const { page = 1, limit = 10 } = req.query

        const { start, end } = req.query //2023-01-01
        if (!start || !end) {

            const medicines = await Medicines.find({ categoryId: req.params.id }).limit(limit * 1).skip((page - 1) * limit).sort({ createdAt: -1 })

            return res.status(200).json({ status: 200, medicines })
        }

        const startDate = new Date(start).toISOString()
        const endDate = new Date(end).toISOString()

        const medicines = await Medicines.find({ categoryId: req.params.id }, {
            createdAt: {
                "$gte": startDate,
                "$lt": endDate
            }
        }).limit(limit * 1).skip((page - 1) * limit).sort({ createdAt: -1 })

        return res.status(200).json({ status: 200, medicines })  

    } catch (err) {
        next(err);
    }
}

// get all medicines for every users
const getAllMedicines = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query

        const { start, end } = req.query //2023-01-01
        if (!start || !end) {

            const medicines = await Medicines.find().limit(limit * 1).skip((page - 1) * limit).sort({ createdAt: -1 })

            return res.status(200).json({ status: 200, medicines })
        }

        const startDate = new Date(start).toISOString()
        const endDate = new Date(end).toISOString()

        const medicines = await Medicines.find({
            createdAt: {
                "$gte": startDate,
                "$lt": endDate
            }
        }).limit(limit * 1).skip((page - 1) * limit).sort({ createdAt: -1 })

        return res.status(200).json({ status: 200, medicines })        

    } catch (err) {
        next(err);
    }
}

// get all expired medicines
const getAllExpiredMedicines = async (req, res, next) => {
    try{

        const { page = 1, limit = 10 } = req.query

        const { start, end } = req.query //2023-01-01
        if (!start || !end) {
            return res.status(400).json({ status: false, msg: "Some required information are missing!" })
        }

        const startDate = new Date(start).toISOString()
        const endDate = new Date(end).toISOString()

        const medicines = await Medicines.find({
            expiredDate: {
                "$gte": startDate,
                "$lt": endDate
            }
        }).limit(limit * 1).skip((page - 1) * limit).sort({ createdAt: -1 })

        return res.status(200).json({ status: 200, medicines }) 

    }catch(err){
        next(err)
    }
}

// get all stocks
const getAllStocks = async (req, res, next) => {
    try{

        const { page = 1, limit = 10 } = req.query

        const { start, end } = req.query //2023-01-01
        if (!start || !end) {

            const medicines = await Medicines.find({ stocks: { $ne: 0 } }).limit(limit * 1).skip((page - 1) * limit).sort({ createdAt: -1 })

            return res.status(200).json({ status: 200, medicines })
        }

        const startDate = new Date(start).toISOString()
        const endDate = new Date(end).toISOString()

        const medicines = await Medicines.find({ stocks: { $ne: 0 } }, {
            createdAt: {
                "$gte": startDate,
                "$lt": endDate
            }
        }).limit(limit * 1).skip((page - 1) * limit).sort({ createdAt: -1 })

        return res.status(200).json({ status: 200, medicines }) 

    }catch(err){
        next(err)
    }
}

// get all out of stocks
const getAllOutOfStocks = async (req, res, next) => {
    try{

        const { page = 1, limit = 10 } = req.query

        const { start, end } = req.query //2023-01-01
        if (!start || !end) {

            const medicines = await Medicines.find({ stocks: { $eq: 0 } }).limit(limit * 1).skip((page - 1) * limit).sort({ createdAt: -1 })

            return res.status(200).json({ status: 200, medicines })
        }

        const startDate = new Date(start).toISOString()
        const endDate = new Date(end).toISOString()

        const medicines = await Medicines.find({ stocks: { $eq: 0 } }, {
            createdAt: {
                "$gte": startDate,
                "$lt": endDate
            }
        }).limit(limit * 1).skip((page - 1) * limit).sort({ createdAt: -1 })

        return res.status(200).json({ status: 200, medicines })       

    }catch(err){
        next(err)
    }
}

module.exports = {
    createMedicine,
    updateMedicine,
    updateStocks,
    deleteMedicine,
    
    getAllExpiredMedicines,
    getAllStocks,
    getAllOutOfStocks,

    searchMedicines,
    getAllMedicines,
    getByMedicineId,
    getMedicineByCategoryId
}