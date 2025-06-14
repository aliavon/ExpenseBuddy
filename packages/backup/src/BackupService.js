const { google } = require("googleapis");
const DatabaseManager = require('./DatabaseManager');
const FileManager = require('./FileManager');
const GoogleDriveManager = require('./GoogleDriveManager');

class BackupService {
  constructor() {
    this.databaseManager = new DatabaseManager();
    this.fileManager = new FileManager();
    this.googleDriveManager = new GoogleDriveManager();
  }

  async start() {
    try {
      const data = await this.databaseManager.getMongoData();
      const fileHashName = this.fileManager.getJsonHash(data) + '.json';
      const drive = google.drive({ version: "v3", auth: await this.googleDriveManager.authenticate() });
      const folderId = await this.googleDriveManager.getFolderId(drive, 'backups');
      const fileFind = await this.googleDriveManager.getFileData(drive, fileHashName, folderId);
      
      if (fileFind) {
        console.log(`Checksum ${fileFind.name.slice(0, -5)} already exists. No backup is needed!`);
        return;
      }
      
      const {filePath, cleanup} = await this.fileManager.createBackupFile(data);
      await this.googleDriveManager.uploadToGoogleDrive(drive, filePath, fileHashName, folderId);

      cleanup();
    } catch (error) {
      console.error("Error:", error.message);
    }
  }
}

module.exports = BackupService; 