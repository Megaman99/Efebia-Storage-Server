'use strict'

import fs, { readFileSync } from 'fs'
import crypto from 'crypto'
import fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'

async function dataRoutes (fastify, options) {

    fastify.register(fastifyJwt, {
        secret: 'f45471d7322c299b9f160de66a937be2a020647a452019d9d0f0ec2d58ba7bb2'
    })

    const userFilePath = './data.json'
    
    if (!fs.existsSync(userFilePath)) {
        fs.writeFileSync(userFilePath, '[]', 'utf8');
    }


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
                required: ['key', 'data'],
                properties: {
                    key: {type: 'string'},
                    data: {type: 'string'}
                }
            }
        }
    }, async (request, reply) => {
        const message = request.body.data;
        console.log('Message: ', message)

        console.log('Questa è la request: ', request)
        const key = request.body.key;
        const email = request.user.email;

        let data = fs.readFileSync(userFilePath, 'utf-8');
        data = JSON.parse(data || '[]')
        if(!Array.isArray(data)){
            data = [];
        }
        console.log('Lettura file data: ', data)

        await data.find((dat) => {
            if(dat.email === email){
                let user_data = dat.data.find((obj) => {
                    obj.key === key
                })
                if(user_data){
                    return reply.status(401).send({ message: 'Esiste già una risorsa con questo nome' });
                }
                else{
                    const buffer = Buffer.from(message)
        
                    const new_message = buffer.toString('base64')
                    console.log('New Message', new_message)

                    const new_data = {
                        key: key,
                        data: new_message
                    };

                    dat.data.push(new_data)

                    fs.writeFile(userFilePath, JSON.stringify(data, null, 2), (err) => {
                        if (err) {
                            console.error(err);
                        } else {
                            console.log('Dati aggiunti con successo!');
                        }
                    })
                }
            }
            // manca l'else
        });

        return reply.send({ message: `Dato scritto correttamente` })
    })
    
    fastify.get('/data/:key', {
        onRequest: [fastify.authenticate],
        schema: {
            params: {
                type: 'object',
                required: ['key'],
                properties: {
                    key: {type: 'string', format: 'email'}
                }
            }
        }
    }, async (request, reply) => {
        const email = request.params.key;
        console.log('Key: ', email)
        const role = request.user.role;
        console.log('Role: ', role)

        let data = fs.readFileSync(userFilePath, 'utf-8');
        data = JSON.parse(data || '[]')
        
        // Da ricontrollare
        if(!Array.isArray(data)){
            data = [];
        }
        console.log('Lettura file data: ', data)

        await data.find(async function(dat){
            if(dat.email === email || role === 'admin'){
                // Manca role admin
                if(dat.data.length === 0){
                    return reply.send({data: 'Non ci sono dati per questo utente'})
                }
                console.log('Dat: ', dat.data)
                // Manca decodifica base 64
                let array = dat.data;
                for(let i = 0; i < array.length; i++){
                    let buffer = Buffer.from(array[i].data, 'base64');
                    array[i].data = buffer.toString();
                }
                console.log('array', array)
                return reply.send({data: array})
            }
            else{
                // L'user non admin non può accedere ai dati
                // Errore generico in modo da non dare informazioni a chi prova ad accedere a dati non propri
                return reply.send({data: 'Errore nella visualizzazione'})
            }
        })
    })

    fastify.patch('/data/:key', {
        onRequest: [fastify.authenticate],
        schema: {
            params: {
                type: 'object',
                required: ['key'],
                properties: {
                    key: {type: 'string'}
                }
            }
        }
    }, async (request, reply) => {
        const key = request.params.key;
        console.log('Key: ', key)
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