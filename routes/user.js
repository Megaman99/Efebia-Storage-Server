'use strict'

import fs, { readFileSync } from 'fs'
import crypto from 'crypto'
import fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
// import { v4 as uuidv4 } from 'uuid';


async function userRoutes (fastify, options) { 
    
    fastify.register(fastifyJwt, {
        secret: 'f45471d7322c299b9f160de66a937be2a020647a452019d9d0f0ec2d58ba7bb2'
    })

    const userFilePath = './users.json'

    if (!fs.existsSync(userFilePath)) {
        fs.writeFileSync(userFilePath, '[]', 'utf8');
    }


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
        const {email, password} = request.body;
        console.log('Email: ', email)
        console.log('Password: ', password)
        const role = 'user';

        let users = fs.readFileSync(userFilePath, 'utf-8');
        users = JSON.parse(users || '[]')
        if(!Array.isArray(users)){
            users = [];
        }
        console.log('Lettura utenti file: ', users)

        if (users.find(user => user.email === email)) {
            console.log('Controllo user: ', users)
            return reply.status(400).send({ message: 'Utente già registrato' }); //Cercare errore giusto
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
        const password = request.body.password;
        
        let users = fs.readFileSync(userFilePath, 'utf-8');
        users = JSON.parse(users || '[]')
        if(!Array.isArray(users)){
            users = [];
        }

        let cript = crypto.createHash('sha256');
        cript.update(password)
        const hash_pwd = cript.digest('hex')

        const user = users.find(user => user.email === email && user.password === hash_pwd);
        if (!user) {
            return reply.status(401).send({ message: 'Credenziali non valide' });
        }

        const token = fastify.jwt.sign({ email: user.email, role: user.role });
        return reply.send({ token });
    })


    // Verifica JWT
    fastify.decorate("authenticate", async function(request, reply) {
        try {
            await request.jwtVerify()
        } catch (err) {
            reply.send(err)
        }
    })

    // Delete
    fastify.delete('/delete', {
            onRequest: [fastify.authenticate]
        }, async (request, reply) => {

        let users = fs.readFileSync(userFilePath, 'utf-8');
        users = JSON.parse(users || '[]')
        if(!Array.isArray(users)){
            users = [];
        }

        console.log('Utenti file eliminazione', request)

        const userIndex = users.findIndex(user => user.email === request.user.email);

        if (userIndex === -1) {
            return reply.status(404).send({ message: 'Utente non trovato' });
        }

        console.log('Users: ', users)

        users.splice(userIndex, 1);

        console.log('Users: ', users)

        fs.writeFileSync(userFilePath, JSON.stringify(users, null, 2), 'utf8');

        return reply.send({ message: 'Utente eliminato con successo' });
    })
}

export default userRoutes