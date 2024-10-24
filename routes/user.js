'use strict'

import bcrypt from 'bcrypt'
import fs from 'fs'

async function routes (fastify, options) {    
    // Register
    fastify.post('/register', {
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
        const saltRounds = 10;
        const password = request.body.password;
        console.log('Password: ', password)
        const email = request.body.email;
        console.log('Email: ', email)

        bcrypt.hash(password, saltRounds, function(err, hash) {
            if(err){
                reply.send('Problema durante l\'elaborazione della password')
            }
            console.log('Hash: ', hash)

            const user = {
                email: email,
                password: hash
            };

            const userData = JSON.stringify(user) + "\n";

            fs.appendFile('./data.txt', userData, err => {
                if (err) {
                    return reply.send({message: 'Errore nella scrittura del file'})
                } else {
                    reply.send({message: 'File scritto con successo'})
                }
            });
        });
        reply.send({ message: `Utente registrato correttamente` })
    })

    // Login
    fastify.post('/login', {
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

        reply.send( { title: 'Login' })
    })

    // Delete
    fastify.delete('/delete', async (request, reply) => {
        reply.send( { title: 'Delete' })
    })
}

export default routes