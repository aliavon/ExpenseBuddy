const mongoose = require('mongoose');

const server = require('./src/server');

const {APP_SERVER_PORT, DATABASE_URL, mongooseConfig} = require('./src/config');

mongoose.connect(DATABASE_URL, mongooseConfig)
  .catch(e => console.error(e));

server.start({port: APP_SERVER_PORT, cors: {
      origin: '*',
      credentials: true,
    }}, () => {
  console.info(`Server is up!`);
}).catch(e => console.error(e));
