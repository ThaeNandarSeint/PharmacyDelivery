const joi = require("joi");

const validation = joi.object({
	name: joi.string().min(3).max(25).trim(true).required(),
});

const profileUpdateValidator = async (req, res, next) => {
	const { name } = req.body;
	const payload = { name }

	const { error } = validation.validate(payload);
	if (error) {

		const err = new Error(error.message);
		err.status = 406;
		return next(err)

	} else {
		req.folderName = `PharmacyDelivery/Users/${req.body.name}`
		next();
	}
};

module.exports = profileUpdateValidator