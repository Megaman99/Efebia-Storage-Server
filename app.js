'use strict'

import Fastify from 'fastify'
import firstRoute from './routes/user.js'

const fastify = Fastify({
  logger: false
  // {
  //   prettyprint: true
  // }
})
fastify.register(firstRoute)

fastify.listen({ port: 3000 }, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  // Server is now listening on ${address}
})