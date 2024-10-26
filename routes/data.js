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
        // Controllare key in modo che non ci siano duplicati
        // Capire se si vogliono più dati per lo stesso utente

        console.log('Questa è la request: ', request)
        const key = request.body.key;
        const email = request.user.email;

        let data = fs.readFileSync(userFilePath, 'utf-8');
        data = JSON.parse(data || '[]')
        if(!Array.isArray(data)){
            data = [];
        }
        console.log('Lettura file data: ', data)

        // let user_data;

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

                    // const userData = JSON.stringify(new_data);
                    fs.writeFile(userFilePath, JSON.stringify(data, null, 2), (err) => {
                        if (err) {
                            console.error(err);
                        } else {
                            console.log('Dati aggiunti con successo!');
                        }
                    })
                }
            }
        });

        // console.log('user_data', user_data);
        
        // if (user_data) {
        //     return reply.status(401).send({ message: 'Esiste già una risorsa con questo nome' });
        // }

        
        // fs.appendFile(userFilePath, userData, err => {
        //     if (err) {
        //         return reply.send({ message: 'Errore nella scrittura del file' })
        //     }
        // });

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