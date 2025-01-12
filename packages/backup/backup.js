const fs = require("fs");
const { google } = require("googleapis");
const { MongoClient } = require('mongodb');
const path = require('path');
var cron = require('node-cron');
var crypto = require('crypto');

const databaseName = 'server'
const MONGO_URI = `mongodb://expenseBuddyMongoDB:27017/${databaseName}`;
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

const getMongoData = async () => {
  let backupData = {};
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const database = client.db(databaseName);
    const collections = await database.listCollections().toArray();

    for (const collection of collections) {
      const collectionName = collection.name;
      const data = await database.collection(collectionName).find({}).toArray();
      backupData[collectionName] = data;
      console.log(`Collection "${collectionName}" extracted`);
    }

  } catch (error) {
    console.error('Error exporting database:', err);
  } finally {
    await client.close();
  }
  return JSON.stringify(backupData, null, 2);
};

const getJsonHash = (data) => {
  const hash = crypto.createHash('sha256');
  hash.update(data);
  return hash.digest('hex');
}


async function createBackupFile(backupData) {
  const fileName = 'tmp.json';
  const filePath = path.join(fileName);

  fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));
  console.log('Database export completed to tmp file!');

  return {
    filePath,
    cleanup: () => {
      fs.unlinkSync(filePath);
      console.log("Local backup file removed.");
    }
  };
}

// Google Drive authentication
async function authenticate() {
  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: SCOPES,
  });

  return auth.getClient();
}

const getFolderId = async (drive, folderName) => {
  const response = await drive.files.list({q: `name = '${folderName}'`});
  return response.data.files[0]?.id;
};

const getFileData = async (drive, fileName, folderId) => {
  const folderPrefix = folderId ? `'${folderId}' in parents and ` : '';
  const response = await drive.files.list({q: `${folderPrefix}name = '${fileName}'`});
  return response.data.files[0];
};

async function uploadToGoogleDrive(drive, filePath, fileHashName, folderId) {
  const fileMetadata = {
    name: fileHashName,
    parents: [folderId],
  };
  const media = {
    mimeType: "application/octet-stream",
    body: fs.createReadStream(filePath),
  };

  const response = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: "id",
  });
  console.log("File uploaded successfully! File ID:", response.data.id);
  return response.data.id;
}

const start = async () => {
  try {
    const data = await getMongoData();
    const fileHashName = getJsonHash(data) + '.json';
    const drive = google.drive({ version: "v3", auth: await authenticate() });
    const folderId = await getFolderId(drive, 'backups');
    const fileFind = await getFileData(drive, fileHashName, folderId)
    if (fileFind) {
      console.log(`Checksum ${fileFind.name.slice(0, -5)} already exists. No backup is needed!`);
      return;
    }
    const {filePath, cleanup} = await createBackupFile(data);
    await uploadToGoogleDrive(drive, filePath, fileHashName,  folderId);

    cleanup();
  } catch (error) {
    console.error("Error:", error.message);
  }
}

start();

cron.schedule('* * * * *', async () => {
  console.log('Start backup script');
  await start();
  console.log('End backup script');
});


