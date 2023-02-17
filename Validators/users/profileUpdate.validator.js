const joi = require("joi");

const validation = joi.object({
    name: joi.string().min(3).max(25).trim(true).required(),
});

const profileUpdateValidator = async (req, res, next) => {
	const { name } = req.body;
	const payload = { name }

	const { error } = validation.validate(payload);
	if (error) {
		
		return res.status(406).json({ status: 406, msg: error.message });

	} else {		
        req.folderName = `PharmacyDelivery/Users/${req.body.name}`
		next();
	}
};

module.exports = profileUpdateValidator