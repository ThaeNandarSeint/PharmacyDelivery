const joi = require("joi");

const validation = joi.object({
     password: joi.string().min(8).trim(true).required()
});

const resetPwValidator = async (req, res, next) => {
	const payload = {
		password: req.body.password
	};

	const { error } = validation.validate(payload);
	if (error) {
		
		next(error)

	} else {		
		next();
	}
};

module.exports = resetPwValidator;