'use strict'

async function routes (fastify, options) {
    fastify.post('/data', async (request, reply) => {
        reply.send({ title: 'Data' })
    })
    
    fastify.get('/data/:key', async (request, reply) => {
        reply.send({ title: '' })
    })

    fastify.patch('/data/:key', async (request, reply) => {
        reply.send({ title: '' })
    })

    fastify.delete('/data/:key', async (request, reply) => {
        reply.send({ title: 'Delete' })
    })
}

export default routes