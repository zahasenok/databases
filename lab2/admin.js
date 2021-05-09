const { smembersAsync, zrangeAsync } = require('./async-redis-fns')
const { client } = require('./client')
const { ask } = require('./console-fns')

const menuView = () => {
  console.clear()
  console.log('1. Online users')
  console.log('2. Senders list')
  console.log('3. Spammers list')
  console.log('4. Exit')
}

  async function main(client) {
    while (1) {
      menuView()
      
      const choice = Number(await ask('\n'))

      if (choice === 1) {
        console.clear()
        const onlineUsers = await smembersAsync(client)('online')
        console.log('Online users:\n')
        for (user of onlineUsers) {
          console.log(user)
        }
      }
      else if (choice === 2) {
        console.clear()
        const senders = await zrangeAsync(client)('sent', 0, 10, 'withscores')
        console.log('Top senders:\n')
        for (let i = 0; i < senders.length; i++) {
          console.log(`User '${senders[i].split(':')[1]}' with id '${senders[i].split(':')[0]}' sent ${senders[i+1]} messages`)
          i++
        }
      }
      else if (choice === 3) {
        console.clear()
        const spammers = await zrangeAsync(client)('spam', 0, 10, 'withscores')
        console.log('Top spammers:\n')
        for (let i = 0; i < spammers.length; i++) {
          console.log(`User '${spammers[i].split(':')[1]}' with id '${spammers[i].split(':')[0]}' spammed ${spammers[i+1]} times`)
          i++
        }
      }
      else if (choice === 4) {
        return
      }
      else {
        console.log('Incorrect option!')
      }
      await ask('\nPress any key\n')
    }
  }

main(client).then(() => {
  console.log(`Program was stopped`)
  process.exit(0)
})