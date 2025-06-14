const { MongoClient } = require('mongodb');

class DatabaseManager {
  constructor() {
    this.databaseName = 'server';
    this.MONGO_URI = `mongodb://expenseBuddyMongoDB:27017/${this.databaseName}`;
  }

  async getMongoData() {
    let backupData = {};
    const client = new MongoClient(this.MONGO_URI);

    try {
      await client.connect();
      const database = client.db(this.databaseName);
      const collections = await database.listCollections().toArray();

      for (const collection of collections) {
        const collectionName = collection.name;
        const data = await database.collection(collectionName).find({}).toArray();
        backupData[collectionName] = data;
        console.log(`Collection "${collectionName}" extracted`);
      }

    } catch (error) {
      console.error('Error exporting database:', error);
    } finally {
      await client.close();
    }
    return JSON.stringify(backupData);
  }
}

module.exports = DatabaseManager; 