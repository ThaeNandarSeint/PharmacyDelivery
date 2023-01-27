const createCustomId = async (Collection, prefix) => {

  const documents = await Collection.find().limit(1).sort({$natural:-1}) 
  const lastDocument = documents[0]

  if (lastDocument) {

    const { id } = lastDocument

    const charArray = id.split("_")
    const newCharArray = charArray.filter((char) => char !== prefix)
    const oldId = newCharArray.toString()

    const newId = prefix + "_" + ((oldId * 1) + 1)

    return newId

  } else {

    const documentCount = await Collection.countDocuments()

    const newId = prefix +  "_" + (documentCount + 1)

    return newId

  }
}

module.exports = {
  createCustomId
}