const fs = require("fs");
const path = require('path');
const crypto = require('crypto');

class FileManager {
  getJsonHash(data) {
    const hash = crypto.createHash('sha256');
    hash.update(data);
    return hash.digest('hex');
  }

  async createBackupFile(backupData) {
    const fileName = 'tmp.json';
    const filePath = path.join(fileName);

    fs.writeFileSync(filePath, backupData);
    console.log('Database export completed to tmp file!');

    return {
      filePath,
      cleanup: () => {
        fs.unlinkSync(filePath);
        console.log("Local backup file removed.");
      }
    };
  }
}

module.exports = FileManager; 