const Permissions = require('../models/permissionModel')

const createPermission = async (req, res, next) => {
    try{

        // validation testing
        const { permissionType } = req.body
        if (!permissionType) {
            return res.status(400).json({ status: false, msg: "Some required information are missing!" });
        }

        // unique testing
        const existingPermissionType = await Permissions.findOne({ permissionType })
        if(existingPermissionType){
            return res.status(400).json({ status: false, msg: "This permission type already exist!" });
        }

        const permissionCount = await Permissions.countDocuments()

        const permissionId = "P" + (permissionCount + 1)

        const newPermission = new Permissions({
            permissionId, permissionType
        })
        const savedPermission = await newPermission.save()

        return res.json({ status: 200, permissionId: savedPermission.permissionId, msg: "New Permission has been successfully created!" })

    }catch(err){
        next(err)
    }
}

module.exports = {
    createPermission
}