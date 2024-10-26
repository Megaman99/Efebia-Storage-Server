'use strict'

import Fastify from 'fastify'
// import fastifyJwt from '@fastify/jwt'
import userRoute from './routes/user.js'
import dataRoute from './routes/data.js'

const fastify = Fastify({
  logger: true
  // {
  //   prettyprint: true
  // }
})

fastify.register(userRoute)
fastify.register(dataRoute)

fastify.listen({ port: 3000 }, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  // Server is now listening on ${address}
})