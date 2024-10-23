'use strict'

async function routes (fastify, options) {
    fastify.post('/data', async (request, reply) => {
        return { title: 'Data' }
    })
    
    fastify.get('/data/:key', async (request, reply) => {
        return { title: '' }
    })

    fastify.patch('/data/:key', async (request, reply) => {
        return { title: '' }
    })

    fastify.delete('/data/:key', async (request, reply) => {
        return { title: 'Delete' }
    })
}

export default routes