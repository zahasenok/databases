const { promisify } = require("util")

module.exports = {
  hgetAsync: (client) => promisify(client.hget).bind(client),
  hgetallAsync: (client) => promisify(client.hgetall).bind(client),
  incrAsync: (client) => promisify(client.incr).bind(client),
  smembersAsync: (client) => promisify(client.smembers).bind(client),
  zrangeAsync: (client) => promisify(client.zrange).bind(client),
  pubsubAsync: (client) => promisify(client.pubsub).bind(client),
  brpopAsync: (client) => promisify(client.brpop).bind(client),
}