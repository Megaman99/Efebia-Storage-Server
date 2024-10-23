'use strict'

async function routes (fastify, options) {
    // Home
    fastify.get('/', async (request, reply) => {
        return { title: 'Home' }
    })
    
    // Register
    fastify.post('/register', async (request, reply) => {
        return { title: 'Register' }
    })

    // Login
    fastify.post('/login', async (request, reply) => {
        return { title: 'Login' }
    })

    // Delete
    fastify.delete('/delete', async (request, reply) => {
        return { title: 'Delete' }
    })
}

export default routes