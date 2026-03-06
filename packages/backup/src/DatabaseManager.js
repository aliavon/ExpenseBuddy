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

  async restoreFromBackup(backupData) {
    const client = new MongoClient(this.MONGO_URI);
    const data = JSON.parse(backupData);

    try {
      await client.connect();
      const database = client.db(this.databaseName);

      // Clear existing collections
      const existingCollections = await database.listCollections().toArray();
      for (const collection of existingCollections) {
        await database.collection(collection.name).deleteMany({});
        console.log(`Cleared collection "${collection.name}"`);
      }

      // Restore data
      for (const [collectionName, documents] of Object.entries(data)) {
        if (documents.length > 0) {
          await database.collection(collectionName).insertMany(documents);
          console.log(`Restored ${documents.length} documents to "${collectionName}"`);
        }
      }

      console.log('Database restoration completed!');
    } catch (error) {
      console.error('Error restoring database:', error);
      throw error;
    } finally {
      await client.close();
    }
  }
}

module.exports = DatabaseManager; 