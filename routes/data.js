'use strict'

import fs, { readFileSync } from 'fs'
import crypto from 'crypto'
import fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import { format } from 'path'

async function dataRoutes (fastify, options) {

    fastify.register(fastifyJwt, {
        secret: 'f45471d7322c299b9f160de66a937be2a020647a452019d9d0f0ec2d58ba7bb2'
    })

    const dataFilePath = './data.json'
    
    if (!fs.existsSync(dataFilePath)) {
        fs.writeFileSync(dataFilePath, '[]', 'utf8');
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

        let data = fs.readFileSync(dataFilePath, 'utf-8');
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

                    fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), (err) => {
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
        const role = request.user.role;

        let data = fs.readFileSync(dataFilePath, 'utf-8');
        data = JSON.parse(data || '[]')
        if(!Array.isArray(data)){
            data = [];
        }

        await data.find(async function(dat){
            if(dat.email === email || role === 'admin'){
                if(dat.data.length === 0){
                    return reply.send({data: 'Non ci sono dati per questo utente'})
                }
                console.log('Dat: ', dat.data)
                let array = dat.data;
                for(let i = 0; i < array.length; i++){
                    let buffer = Buffer.from(array[i].data, 'base64');
                    array[i].data = buffer.toString();
                }
                return reply.send({data: array})
            }
            else{
                // L'user non admin non può accedere ai dati
                // Errore generico in modo da non dare informazioni a chi prova ad accedere a dati non propri
                return reply.send({message: 'Errore nella visualizzazione'})
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
                    key: {type: 'string', format: 'email'}
                }
            },
            body: {
                type: 'object',
                required: ['key'],
                properties: {
                    key: {type: 'string'}
                }
            }
        }
    }, async (request, reply) => {
        const email_tomod = request.params.key;
        console.log('Email to mod: ', email_tomod)
        const email_log = request.user.email;
        console.log('Email logged: ', email_log)
        const key = request.body.key;
        console.log('Key: ', key)
        let new_data = request.body.data;
        console.log('New data: ', new_data)

        let data = fs.readFileSync(dataFilePath, 'utf-8');
        data = JSON.parse(data || '[]')
        if(!Array.isArray(data)){
            return reply.send({message: 'Errore nella lettura del file'})
        }
        console.log('Lettura file data: ', data)
        const buffer = Buffer.from(new_data)
        const data_insert = buffer.toString('base64');
        console.log('Data insert', data_insert)

        await data.find(async function (obj){
            if((obj.email === email_tomod && email_tomod === email_log) || role === 'admin'){
                // console.log('Obj', obj)
                for(let i = 0; i < obj.data.length; i++){
                    console.log('Obj', obj.data[i])
                    if(obj.data[i].key === key){
                        obj.data[i].data = data_insert
                    }
                }

                // console.log('Dati aggiornati: ', data[0])
                fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), (writeErr) => {
                    if (writeErr) {
                        return reply.send({message: 'Errore durante la modifica del dato'})
                    } else {
                        return reply.send({message: 'Dato aggiornato correttamente'})
                    }
                });
            }
            else{
                return reply.send({message: 'Impossibile modificare i dati'})
            }
        })
        return reply.send({message: 'Dato modificato correttamente'})
    })

    fastify.delete('/data/:key', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        const email_del = request.params.key;
        console.log('Email del', email_del)
        const email_log = request.user.email
        console.log('Email log', email_log)
        const key = request.body.key
        console.log('Chiave da eliminare: ', key)
        const role = request.user.role

        let data = fs.readFileSync(dataFilePath, 'utf-8');
        data = JSON.parse(data || '[]')
        if(!Array.isArray(data)){
            return reply.send({message: 'Errore nella lettura del file'})
        }
        console.log('Lettura file data: ', data)
        
        const email_found = await data.find((obj) => obj.email === email_del)
        const email_index = data.findIndex((obj) => obj.email === email_del)
        console.log('Found: ', email_found)
        if(email_found.email === email_del && email_del === email_log){
            const result = await email_found.data.findIndex((el) => el.key === key)
            console.log('Result: ', result)
            if(result === -1){
                return reply.send({message: 'Dato non trovato'})
            }
            
            for(let i = 0; i < data.length; i++){
                if(data[email_index].email === email_del){
                    data[email_index].data.splice(result, 1)

                    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), (writeErr) => {
                        if (writeErr) {
                            return reply.send({message: 'Errore durante l\'eliminazione del dato'})
                        } else {
                            return reply.send({message: 'Dato eliminato correttamente'})
                        }
                    });
                }
            }
        }
        else{
            return reply.send({message: 'Errore durante l\'eliminazione'})
        }
        return reply.send({ message: 'Eliminazione avvenuta con successo' })
    })
}

export default dataRoutes