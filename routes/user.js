'use strict'

import fs, { readFileSync } from 'fs'
import crypto from 'crypto'
import fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'


async function userRoutes (fastify, options) { 
    
    fastify.register(fastifyJwt, {
        secret: process.env.JWT_SECRET
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
        const role = 'user';

        let users = fs.readFileSync(userFilePath, 'utf-8');
        users = JSON.parse(users || '[]')
        if(!Array.isArray(users)){
            users = [];
        }

        if (users.find(user => user.email === email)) {
            return reply.status(400).send({ message: 'Utente già registrato' }); //Cercare errore giusto
        }

        const cript = crypto.createHash('sha256')
        cript.update(password)
        const hash = cript.digest('hex')

        const new_user = {
            email: email,
            password: hash,
            role: role
        };

        users.push(new_user);
        
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
            onRequest: [fastify.authenticate],
            schema: {
                body: {
                    type: 'object',
                    required: ['email'],
                    properties: {
                        email: {type: 'string', format: 'email'}
                    }
                }
            }
        }, async (request, reply) => {

        const email = request.body.email
        let users = fs.readFileSync(userFilePath, 'utf-8');
        users = JSON.parse(users || '[]')
        if(!Array.isArray(users)){
            users = [];
        }

        const dataFilePath = './data.json'
        let data = fs.readFileSync(dataFilePath, 'utf-8');
        data = JSON.parse(data || '[]')
        if(!Array.isArray(data)){
            data = [];
        }

        if(email === request.user.email){
            const userIndex = users.findIndex(user => user.email === request.user.email);
            
            if (userIndex === -1) {
                return reply.status(404).send({ message: 'Utente non trovato' });
            }
            
            users.splice(userIndex, 1);
            
            fs.writeFileSync(userFilePath, JSON.stringify(users, null, 2), 'utf8');

            const data_index = data.findIndex(dat => dat.email === email)
            if(data_index !== -1){
                data.splice(data_index, 1);
                fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8')
            }
        }
        else{
            return reply.send({message: 'Impossibile eliminare l\'utenza'})
        }
        return reply.send({ message: 'Utente eliminato con successo' });
    })
}

export default userRoutes