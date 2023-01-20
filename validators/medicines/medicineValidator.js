const joi = require("joi");

const validation = joi.object({     
     name: joi.string().trim(true).required(),
     details: joi.string().trim(true).required(),
     companyName: joi.string().trim(true).required(),
     price: joi.number().greater(0).required(),
     stocks: joi.number().required(),
});

const medicineValidator = async (req, res, next) => {
    const { name, details, companyName, price, stocks } = req.body

	const payload = { name, details, companyName, price, stocks };

	const { error } = validation.validate(payload);
	if (error) {

		next(error)

	} else {
		req.folderName = `PharmacyDelivery/Medicines/${req.body.name}`
		next();
	}
};

module.exports = {
	medicineValidator
};