const { brpopAsync, hgetAsync } = require('./async-redis-fns')
const { client } = require('./client')

  async function main(client) {
    while (true) {
      const messageArrOfQueueAndIndex = await brpopAsync(client)('queue', 1, 0)
      if (messageArrOfQueueAndIndex) {
        const messageId = Number(messageArrOfQueueAndIndex[1])
        client.hset(`message:${messageId}`, 'status', 'checking')
        
        const senderId = Number(await hgetAsync(client)(`message:${messageId}`, 'senderId'))
        const receiverId = Number(await hgetAsync(client)(`message:${messageId}`, 'receiverId'))
        const messageText = await hgetAsync(client)(`message:${messageId}`, 'text')

        client.hincrby(`user:${senderId}`, 'queue', -1)
        client.hincrby(`user:${senderId}`, 'checking', 1)

        const isSpam = Math.random() < 0.5

        client.hincrby(`user:${senderId}`, 'checking', -1)

        if (isSpam) {
          const senderUsername = await hgetAsync(client)(`user:${senderId}`, 'login')
          client.zincrby('spam', 1, `${senderId}:${senderUsername}`)
          client.hset(`message:${messageId}`, 'status', 'blocked')
          client.hincrby(`user:${senderId}`, 'blocked', 1)
          client.publish('spam', `User ${senderUsername} sent spam message: \'${messageText}\'`)
        } else {
          client.hset(`message:${messageId}`, 'status', 'sent')
          client.hincrby(`user:${senderId}`, 'sent', 1)
          client.sadd(`sent-to:${receiverId}`, messageId)
        }
      }
    }
  }

main(client)