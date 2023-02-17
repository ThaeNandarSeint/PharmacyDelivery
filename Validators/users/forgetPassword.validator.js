const joi = require("joi");

const validation = joi.object({
	email: joi.string().email().trim(true).required()
});

const forgetPwValidator = async (req, res, next) => {
	const payload = {
		email: req.body.email
	};

	const { error } = validation.validate(payload);
	if (error) {

		const err = new Error(error.message);
		err.status = 406;
		return next(err)

	} else {
		next();
	}
};

module.exports = forgetPwValidator;