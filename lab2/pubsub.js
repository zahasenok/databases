const { client } = require('./client')

  client.subscribe(['users', 'spam'])

  client.on('message', function (channel, message) {
    console.log(`Channel ${channel}: ${message}`);
  });
