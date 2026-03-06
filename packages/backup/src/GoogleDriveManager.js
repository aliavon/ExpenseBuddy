const fs = require("fs");
const { google } = require("googleapis");

class GoogleDriveManager {
  constructor() {
    this.SCOPES = ["https://www.googleapis.com/auth/drive.file"];
  }

  async authenticate() {
    const auth = new google.auth.GoogleAuth({
      keyFile: "credentials.json",
      scopes: this.SCOPES,
    });

    return auth.getClient();
  }

  async getFolderId(drive, folderName) {
    const response = await drive.files.list({q: `name = '${folderName}'`});
    return response.data.files[0]?.id;
  }

  async getFileData(drive, fileName, folderId) {
    const folderPrefix = folderId ? `'${folderId}' in parents and ` : '';
    const response = await drive.files.list({q: `${folderPrefix}name = '${fileName}'`});
    return response.data.files[0];
  }

  async uploadToGoogleDrive(drive, filePath, fileHashName, folderId) {
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

  async listBackups(drive, folderId) {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, createdTime, size)',
      orderBy: 'createdTime desc'
    });
    return response.data.files || [];
  }

  async downloadFile(drive, fileId, outputPath) {
    const file = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });
    const writeStream = fs.createWriteStream(outputPath);
    
    return new Promise((resolve, reject) => {
      file.data
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .pipe(writeStream);
    });
  }
}

module.exports = GoogleDriveManager; 