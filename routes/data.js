'use strict'

import fs, { readFileSync } from 'fs'
import crypto from 'crypto'
import fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import { format } from 'path'

async function dataRoutes (fastify, options) {

    fastify.register(fastifyJwt, {
        secret: process.env.JWT_SECRET
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
        const key = request.body.key;
        const email = request.user.email;

        let data = fs.readFileSync(dataFilePath, 'utf-8');
        data = JSON.parse(data || '[]')
        if(!Array.isArray(data)){
            data = [];
        }

        const user_found = await data.find(dat => dat.email === email);
        if(user_found){
            const check_key = user_found.data.find(el => el.key === key)
            if(check_key){
                return reply.send({message: 'Chiave già esistente'})
            }
            const new_message = Buffer.from(message).toString('base64')
            user_found.data.push({key: key, data: new_message})
            
            fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), (err) => {
                if (err) {
                    return reply.send({message: 'Errore nella memorizzazione dei dati'})
                } else {
                    return reply.send({message: 'Dati memorizzati con successo'})
                }
            })
        }
        else{
            // Non esiste lo user e devo creare un nuovo campo
            const new_message = Buffer.from(message).toString('base64')

            data.push({
                email: email,
                data: [
                    {
                        key: key,
                        data: new_message
                    }
                ]
            })

            fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), (err) => {
                if (err) {
                    return reply.send({message: 'Errore nella memorizzazione dei dati'})
                } else {
                    return reply.send({message: 'Dati memorizzati con successo'})
                }
            })
        }     
    });
    
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
            if(dat.email === email){
                if(dat.data.length === 0){
                    return reply.send({data: 'Non ci sono dati per questo utente'})
                }
                let array = dat.data;
                for(let i = 0; i < array.length; i++){
                    let buffer = Buffer.from(array[i].data, 'base64');
                    array[i].data = buffer.toString();
                }
                return reply.send({data: array})
            }
            else if(role === 'admin'){
                console.log('Data', data)
                for(let i = 0; i < data.length; i++){
                    data[i].data.forEach(element => {
                        const buffer = Buffer.from(element.data, 'base64')
                        const converted = buffer.toString();
                        element.data = converted;
                    });
                }
                return reply.send({data: data})
            }
            else{
                // L'user non admin non può accedere ai dati
                // Errore generico in modo da non dare informazioni a chi prova ad accedere a dati non propri
                return reply.send({message: 'Nessun dato presente'})
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
        const email_log = request.user.email;
        const key = request.body.key;
        let new_data = request.body.data;

        let data = fs.readFileSync(dataFilePath, 'utf-8');
        data = JSON.parse(data || '[]')
        if(!Array.isArray(data)){
            return reply.send({message: 'Errore nella lettura del file'})
        }
        const buffer = Buffer.from(new_data)
        const data_insert = buffer.toString('base64');

        await data.find(async function (obj){
            if((obj.email === email_tomod && email_tomod === email_log) || role === 'admin'){
                for(let i = 0; i < obj.data.length; i++){
                    if(obj.data[i].key === key){
                        obj.data[i].data = data_insert
                    }
                }

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
        const email_log = request.user.email
        const key = request.body.key
        const role = request.user.role

        let data = fs.readFileSync(dataFilePath, 'utf-8');
        data = JSON.parse(data || '[]')
        if(!Array.isArray(data)){
            return reply.send({message: 'Errore nella lettura del file'})
        }
        
        const email_found = await data.find((obj) => obj.email === email_del)
        const email_index = data.findIndex((obj) => obj.email === email_del)
        console.log('Found: ', email_found)
        if(email_found.email === email_del && email_del === email_log){
            const result = await email_found.data.findIndex((el) => el.key === key)
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