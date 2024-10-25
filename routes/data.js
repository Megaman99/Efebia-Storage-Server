'use strict'

import crypto from 'crypto'

async function dataRoutes (fastify, options) {

    // Verifica JWT
    fastify.decorate("authenticate", async function(request, reply) {
        try {
            await request.jwtVerify()
        } catch (err) {
            reply.send(err)
        }
    })

    fastify.post('/data', {
        onRequest: [fastify.authenticate],
        schema: {
            body: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: {type: 'string', format: 'email'},
                    password: {type: 'string'}
                }
            }
        }
    }, async (request, reply) => {
        const password = request.body.password;
        console.log('Text: ', password)
        const email = request.body.email;
        console.log('Email: ', email)

        const cript = crypto.createHash('sha256')
        console.log('Cript: ', cript)
        cript.update(password)

        const hash = cript.digest('hex')

        console.log('Hash: ', hash)

        const user = {
            email: email,
            password: hash
        };

        const userData = JSON.stringify(user);

        fs.appendFile('./data.json', userData, err => {
            if (err) {
                return reply.send({ message: 'Errore nella scrittura del file' })
            }
        });
        
        return reply.send({ message: `Dato scritto correttamente` })
    })
    
    fastify.get('/data/:key', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        const key = request.params.key;

        reply.send({ title: '' })
    })

    fastify.patch('/data/:key', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        const key = request.params.key;

        reply.send({ title: '' })
    })

    fastify.delete('/data/:key', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        const key = request.params.key;
        
        reply.send({ title: 'Delete' })
    })
}

export default dataRoutes