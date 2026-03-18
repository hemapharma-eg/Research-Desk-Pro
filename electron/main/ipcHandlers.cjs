const { ipcMain } = require('electron');

ipcMain.on('ping', (event, arg) => {
  console.log('ping received, replying with pong');
  event.reply('pong', 'pong');
});
