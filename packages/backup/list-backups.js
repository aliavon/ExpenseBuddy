const { google } = require("googleapis");
const GoogleDriveManager = require('./src/GoogleDriveManager');

async function listBackups() {
  try {
    const googleDriveManager = new GoogleDriveManager();
    const drive = google.drive({ version: "v3", auth: await googleDriveManager.authenticate() });
    const folderId = await googleDriveManager.getFolderId(drive, 'backups');

    if (!folderId) {
      console.error('Backups folder not found!');
      return;
    }

    const backups = await googleDriveManager.listBackups(drive, folderId);

    if (backups.length === 0) {
      console.log('No backups found.');
      return;
    }

    console.log('\nAvailable backups:');
    console.log('─'.repeat(80));
    backups.forEach((backup, index) => {
      const date = new Date(backup.createdTime).toLocaleString();
      const size = backup.size ? `${(parseInt(backup.size) / 1024).toFixed(2)} KB` : 'N/A';
      console.log(`${index + 1}. ${backup.name}`);
      console.log(`   Created: ${date}`);
      console.log(`   Size: ${size}`);
      console.log('');
    });
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

listBackups();
