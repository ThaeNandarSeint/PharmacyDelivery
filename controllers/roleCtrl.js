const Roles = require('../models/roleModel')

// add new role
const createRole = async (req, res, next) => {
    try{
        // validation testing
        const { roleType } = req.body
        if (!roleType) {
            return res.status(400).json({ status: false, msg: "Some required information are missing!" });
        }

        // unique testing
        const existingRoleType = await Roles.findOne({ roleType })
        if(existingRoleType){
            return res.status(400).json({ status: false, msg: "This role type already exist!" });
        }

        // const roleCount = await Roles.countDocuments()

        // const roleId = "R" + (roleCount + 1)

        const newRole = new Roles({ roleType })
        const savedRole = await newRole.save()

        return res.json({ status: 200, roleId: savedRole._id, msg: "New Role has been successfully created!" })

    }catch(err){
        next(err)
    }
}

// update role

// delete role

// get all role


// revoke

module.exports = {
    createRole
}