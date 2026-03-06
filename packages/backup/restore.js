const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const GoogleDriveManager = require('./src/GoogleDriveManager');
const DatabaseManager = require('./src/DatabaseManager');

async function restore(backupFileName) {
  if (!backupFileName) {
    console.error('Usage: node restore.js <backup-file-name>');
    console.error('Example: node restore.js a1b2c3d4e5f6...json');
    process.exit(1);
  }

  try {
    const googleDriveManager = new GoogleDriveManager();
    const databaseManager = new DatabaseManager();
    
    const drive = google.drive({ version: "v3", auth: await googleDriveManager.authenticate() });
    const folderId = await googleDriveManager.getFolderId(drive, 'backups');

    if (!folderId) {
      console.error('Backups folder not found!');
      process.exit(1);
    }

    // Find file by name
    const fileData = await googleDriveManager.getFileData(drive, backupFileName, folderId);
    
    if (!fileData) {
      console.error(`Backup file "${backupFileName}" not found!`);
      console.log('Use "node list-backups.js" to see available backups.');
      process.exit(1);
    }

    console.log(`Found backup: ${fileData.name}`);
    console.log(`Downloading...`);

    // Download file
    const tempFilePath = path.join(__dirname, 'temp-restore.json');
    await googleDriveManager.downloadFile(drive, fileData.id, tempFilePath);
    console.log('Downloaded to temporary file');

    // Read and restore
    const backupData = fs.readFileSync(tempFilePath, 'utf8');
    console.log('Restoring to database...');
    
    await databaseManager.restoreFromBackup(backupData);

    // Cleanup
    fs.unlinkSync(tempFilePath);
    console.log('Temporary file removed');
    console.log('Restore completed successfully!');
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

const backupFileName = process.argv[2];
restore(backupFileName);
