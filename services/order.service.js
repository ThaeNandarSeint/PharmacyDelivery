const checkStocks = async ({ orderDetails, Medicines }) => {
    let uploadPromises = []
    let priceArray = []
    let quantityArray =[]

    for (let i = 0; i < orderDetails.length; i++) {
        const { medicine, quantity } = orderDetails[i];

        const { stocks, name, orderCount, price } = await Medicines.findById(medicine)
        if (!stocks) {
            const error = new Error(`This medicine ${name} is out of stocks!`);
            error.status = 410;
            return next(error)
        }
        if (quantity > stocks) {
            const error = new Error(`This medicine ${name} can be ordered less than ${stocks}!`);
            error.status = 410;
            return next(error)
        }
        priceArray.push(quantity * price)
        quantityArray.push(quantity)
        // 
        const newStock = stocks - quantity

        const newOrderCount = orderCount + 1

        uploadPromises.push(Medicines.findByIdAndUpdate(medicine, { stocks: newStock, orderCount: newOrderCount }))
    }
    return {
        uploadPromises,
        priceArray,
        quantityArray
    }
}

const calculateTotal = ({ array }) => {
    let total = 0
    for (let i = 0; i < array.length; i++) {
        total = total + array[i];
    }
    return total
}

module.exports = {
    checkStocks,
    calculateTotal
}