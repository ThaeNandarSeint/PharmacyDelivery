const Medicines = require('../models/medicine.model')

const addMedicine = async ({
    id, categoryId, name, details, companyName, expiredDate, price, stocks, pictureUrls, picPublicIds,
}) => {

    const newMedicine = new Medicines({
        id, categoryId, name, details, companyName, expiredDate, price, stocks, pictureUrls, picPublicIds,
    });

    const savedMedicine = await newMedicine.save();

    return savedMedicine

}

const modifyMedicine = async (medicineId, {
    categoryId,
    name,
    details,
    companyName,
    expiredDate,
    price,
    stocks,
    pictureUrls,
    picPublicIds,
}) => {
    await Medicines.findByIdAndUpdate(medicineId, {
        categoryId,
        name,
        details,
        companyName,
        expiredDate,
        price,
        stocks,
        pictureUrls,
        picPublicIds,
    });
}

const removeMedicine = async (medicineId) => {
    await Medicines.findByIdAndDelete(medicineId);
}

module.exports = {
    addMedicine,
    modifyMedicine,
    removeMedicine
}