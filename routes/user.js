'use strict'

import fs, { readFileSync } from 'fs'
import crypto from 'crypto'
import fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
// import fastify from 'fastify'
// fastify.register(), {
//     secret: 'f45471d7322c299b9f160de66a937be2a020647a452019d9d0f0ec2d58ba7bb2'
// }

async function routes (fastify, options) { 
    
    fastify.register(fastifyJwt, {
        secret: 'f45471d7322c299b9f160de66a937be2a020647a452019d9d0f0ec2d58ba7bb2'
    })

    if (!fs.existsSync('./users.json')) {
        fs.writeFileSync('./users.json', '[]', 'utf8');
    }

    const userFilePath = './users.json'

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
        const password = request.body.password;
        console.log('Password: ', password)
        const email = request.body.email;
        console.log('Email: ', email)
        let role = request.body.role;
        console.log('Role: ', role)

        if(role !== 'admin' && role!== 'user'){
            role = 'user';
        }

        let users = fs.readFileSync(userFilePath, 'utf-8');
        users = JSON.parse(users || '[]')
        if(!Array.isArray(users)){
            users = [];
        }
        console.log('Lettura utenti file: ', users)

        if (users.find(user => user.email === email)) {
            console.log('Controllo user: ', users)
            return reply.status(400).send({ message: 'Utente già registrato' });
        }

        const cript = crypto.createHash('sha256')
        console.log('Cript: ', cript)
        cript.update(password)

        const hash = cript.digest('hex')

        console.log('Hash: ', hash)

        const new_user = {
            email: email,
            password: hash,
            role: role
        };

        users.push(new_user);

        console.log('Utenti: ', users)
        
        fs.writeFileSync(userFilePath, JSON.stringify(users, null, 2), 'utf8');

        return reply.send({ message: `Utente registrato correttamente` })
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
        const email = request.body.email;
        console.log('Email: ', email)
        const password = request.body.password;
        console.log('Password: ', password)
        
        let users = fs.readFileSync(userFilePath, 'utf-8');
        users = JSON.parse(users || '[]')
        if(!Array.isArray(users)){
            users = [];
        }
        console.log('Lettura utenti file: ', users)

        let cript = crypto.createHash('sha256');
        cript.update(password)
        const hash_pwd = cript.digest('hex')

        const user = users.find(user => user.email === email && user.password === hash_pwd);
        if (!user) {
            return reply.status(401).send({ message: 'Credenziali non valide' });
        }

        const token = fastify.jwt.sign({ email: user.email, role: user.role });
        console.log('Token', token)
        return reply.send({ token });
    })

    // Delete
    fastify.delete('/delete', async (request, reply) => {
        reply.send( { title: 'Delete' })
    })
}

export default routes