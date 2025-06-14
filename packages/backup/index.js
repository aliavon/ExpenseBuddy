const BackupService = require('./src/BackupService');
const cron = require('node-cron');

const backupService = new BackupService();

// Run backup once on startup
backupService.start();

// Schedule cron job
cron.schedule('* * * * *', async () => {
  console.log('Start backup script');
  await backupService.start();
  console.log('End backup script');
}); 