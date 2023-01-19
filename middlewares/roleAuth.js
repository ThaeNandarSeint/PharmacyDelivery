const Admins = require('../models/adminModel')
const SuperAdmins = require('../models/superAdminModel')
const SuperVisors = require('../models/superVisorModel')
const Operators = require('../models/operatorModel')

const accessUserRoleRoute = async (req, res, next) => {
    try{
        const userId = req.user.id
        if (!userId) {
            return res.status(400).json({ status: false, msg: "You need to first login!" })
        }

        const superAdmin = await SuperAdmins.findOne({ userId })

        if(!superAdmin){
            return res.status(403).json({ status: false, msg: "You are not authorized for this action!" })
        }
        next()

    }catch(err){
        next(err)
    }
}

const accessUserRoute = async (req, res, next) => {
    try{
        const userId = req.user.id
        if (!userId) {
            return res.status(400).json({ status: false, msg: "You need to first login!" })
        }

        const superAdmin = await SuperAdmins.findOne({ userId })
        const admin = await Admins.findOne({ userId })

        if(!superAdmin && !admin){
            return res.status(403).json({ status: false, msg: "You are not authorized for this action!" })
        }
        next()

    }catch(err){
        next(err)
    }
}

const accessMedicineRoute = async (req, res, next) => {
    try{
        const userId = req.user.id
        if (!userId) {
            return res.status(400).json({ status: false, msg: "You need to first login!" })
        }

        const superAdmin = await SuperAdmins.findOne({ userId })
        const admin = await Admins.findOne({ userId })
        const superVisor = await SuperVisors.findOne({ userId })

        if(!superAdmin && !admin && !superVisor){
            return res.status(403).json({ status: false, msg: "You are not authorized for this action!" })
        }
        next()
        
    }catch(err){
        next(err)
    }
}

const accessOrderRoute = async (req, res, next) => {
    try{
        const userId = req.user.id
        if (!userId) {
            return res.status(400).json({ status: false, msg: "You need to first login!" })
        }

        const superAdmin = await SuperAdmins.findOne({ userId })
        const admin = await Admins.findOne({ userId })
        const superVisor = await SuperVisors.findOne({ userId })
        const operator = await Operators.findOne({ userId })

        if(!superAdmin && !admin && !superVisor && !operator){
            return res.status(403).json({ status: false, msg: "You are not authorized for this action!" })
        }
        next()
        
    }catch(err){
        next(err)
    }
}

module.exports = {
    accessUserRoleRoute,
    accessUserRoute,
    accessMedicineRoute,
    accessOrderRoute
}