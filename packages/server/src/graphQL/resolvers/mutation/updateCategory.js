module.exports = async (_, { id, newCategory, sync }, { schemas: { Purchase } }) => {
    // Find the purchase by id to get its name
    const purchase = await Purchase.findById(id);
    if (!purchase) {
      throw new Error("Purchase not found");
    }

    if (sync) {
      // Update all purchases with the same name
      await Purchase.updateMany({ name: purchase.name }, { $set: { category: newCategory } });
      // Return updated purchases by finding all with the same name
      return await Purchase.find({ name: purchase.name });
    } else {
      // Update only the single purchase
      const updatedPurchase = await Purchase.findByIdAndUpdate(
        id,
        { category: newCategory },
        { new: true }
      );
      if (!updatedPurchase) {
        throw new Error("Purchase not found");
      }
      // Return the updated purchase in an array for consistency
      return [updatedPurchase];
    }
  };
