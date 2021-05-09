const { hgetAsync, hgetallAsync, incrAsync, smembersAsync } = require('./async-redis-fns')
const { client } = require('./client')
const { ask } = require('./console-fns')

  async function register(client, username) {
    const user = await hgetAsync(client)('users', username)
    if (user) {
      console.log('User already exists!')
      return
    }

    const userId = await incrAsync(client)('user:id')

    client.hset('users', username, userId)
    client.hset(`user:${userId}`, 'login', username)
    client.hset(`user:${userId}`, 'queue', 0)
    client.hset(`user:${userId}`, 'checking', 0)
    client.hset(`user:${userId}`, 'blocked', 0)
    client.hset(`user:${userId}`, 'sent', 0)
    client.hset(`user:${userId}`, 'delivered', 0)

    console.log(`User ${user} was successfully registered with id ${userId}!`)
  }

  async function login(client, username) {
    try {
      const userId = await hgetAsync(client)('users', username)
      client.sadd('online', username)
      client.publish('users', `${username} logged in`)
      console.log(`User ${username} with id ${userId} was successfully logged in!`)
      return userId
    } catch(err) {
      console.log(`User ${username} was not found!`)
      return
    }
  }

  async function logout(client, userId) {
    try {
      const username = await hgetAsync(client)(`user:${userId}`, 'login')

      client.srem('online', username)
      client.publish('users', `User ${username} signed out`)
      console.log(`User ${username} with id ${userId} was successfully logged out!`)
    } catch(err) {
      console.log(`Can't logout user with id ${userId}!`)
      return
    }
  }

  async function createMessage(client, userId, receiver, text) {
    try {
      const receiverId = await hgetAsync(client)(`users`, receiver)
      console.log(userId, receiverId)
      if (!receiverId) {
        console.log(`Receiver not found!`)
        return
      }

      const messageId = await incrAsync(client)('message:id')
      const currentUser = await hgetAsync(client)(`user:${userId}`, 'login')

      const msgKey = `message:${messageId}`

      client.hset(msgKey, 'id', messageId)
      client.hset(msgKey, 'senderId', userId)
      client.hset(msgKey, 'receiverId', receiverId)
      client.hset(msgKey, 'text', text)
      client.hset(msgKey, 'status', 'created')

      client.lpush('queue', messageId)
      client.hset(messageId, 'status', 'queue')

      client.zincrby('sent', 1, `${userId}:${currentUser}`)
      client.hincrby(`user:${userId}`, 'queue', 1)

      console.log(`Message was successfully created!`)
    } catch(err) {
      console.log(err)
      console.log(`Error during creating message!`)
      return
    }
  }

  async function showInbox(client, userId) {
    const messages = await smembersAsync(client)(`sent-to:${userId}`)
    console.log(userId, messages)
    console.log(`Inbox: `, messages)

    for (const messageId of messages) {
      const messageObject = await hgetallAsync(client)(`message:${messageId}`)
      const senderUsername = await hgetAsync(client)(`user:${messageObject.senderId}`, ['login'])

      console.log(`From: ${senderUsername}`)
      console.log(`Text: ${messageObject.text}\n`)

      if (messageObject.status !== 'delivered') {
        client.hset(`message:${messageId}`, 'status', 'delivered')
        client.hincrby(`user:${messageObject.senderId}`, 'sent', -1)
        client.hincrby(`user:${messageObject.senderId}`, 'delivered', 1)
      }
    }
  }

  async function showStats(client, userId) {
    const userStatsObject = await hgetallAsync(client)(`user:${userId}`)
    console.clear()
    console.log(`In queue: ${userStatsObject.queue}`)
    console.log(`To be checked: ${userStatsObject.checking}`)
    console.log(`Blocked: ${userStatsObject.blocked}`)
    console.log(`Sent: ${userStatsObject.sent}`)
    console.log(`Delivered: ${userStatsObject.delivered}`)
  }

  async function menu(client, userId) {
    while (true) {
      console.clear()
      console.log('1. Create new message')
      console.log('2. Show inbox messages')
      console.log('3. Show message statistics')
      console.log('4. Logout')
  
      const choice = await ask('\n')
  
      if (choice == 1) {
        const receiver = await ask(`Enter receiver's login: `)
        const text = await ask('Enter text to be sent: ')
        await createMessage(client, Number(userId), receiver, text)
      }
      else if (choice == 2) {
        await showInbox(client, userId)
      }
      else if (choice == 3) {
        await showStats(client, userId)
      }
      else if (choice == 4) {
        await logout(client, userId)
        break
      }
      else {
        console.log('Incorrect option!')
      }
      await ask('\nPress any key\n')
    }
  }

  async function main(client) {
    while (true) {
      console.clear()
      console.log('1. Login')
      console.log('2. Register')
      console.log('3. Exit')
  
      const choice = Number(await ask('\n'))
  
      if (choice === 1) {
        console.clear()
        const username = await ask('Enter login: ')
        const userId = await login(client, username)
        if (userId) {
          await menu(client, userId)
        }
      }
      else if (choice === 2) {
        const username = await ask('Enter username: ')
        await register(client, username)
      }
      else if (choice === 3) {
        return
      }
      else {
        console.log('Incorrect option!')
      }
    }
  }

main(client).then(() => {
  console.log(`Program was stopped`)
  process.exit(0)
})