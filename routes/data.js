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
            
            try {
                fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
                return reply.send({ message: 'Dati memorizzati con successo' });
            } catch (error) {
                return reply.send({ message: 'Errore nella memorizzazione dei dati' });
            }
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

            try {
                fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
                return reply.send({ message: 'Dati memorizzati con successo' });
            } catch (error) {
                return reply.send({ message: 'Errore nella memorizzazione dei dati' });
            }
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
        const email_log = request.user.email;

        let data = fs.readFileSync(dataFilePath, 'utf-8');
        data = JSON.parse(data || '[]')
        if(!Array.isArray(data)){
            data = [];
        }

        const email_found = await data.find(dat => dat.email === email && dat.email === email_log)
        if(role === 'admin'){
            for(let i = 0; i < data.length; i++){
                data[i].data.forEach(element => {
                    const buffer = Buffer.from(element.data, 'base64')
                    const converted = buffer.toString();
                    element.data = converted;
                });
            }
            return reply.send({data: data})
        }
        else if(email_found){
            let array = email_found.data;
            for(let i = 0; i < array.length; i++){
                array[i].data = Buffer.from(array[i].data, 'base64').toString();
            }
            return reply.send({data: array})
        }
        else{
            // L'user non admin non può accedere ai dati
            // Errore generico in modo da non dare informazioni a chi prova ad accedere a dati non propri
            return reply.send({message: 'Impossibile trovare i dati richiesti'})
        }
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
        const role = request.user.role;

        let data = fs.readFileSync(dataFilePath, 'utf-8');
        data = JSON.parse(data || '[]')
        if(!Array.isArray(data)){
            return reply.send({message: 'Errore nella lettura del file'})
        }
        const data_insert = Buffer.from(new_data).toString('base64');
        const user_found = data.find(obj => obj.email === email_tomod)
        if(user_found && (email_tomod === email_log || role === 'admin')){
            const tomod = user_found.data.find(el => el.key === key)
            if(tomod){
                tomod.data = data_insert
                try {
                    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
                    return reply.send({ message: 'Dato aggiornato correttamente' });
                } catch (error) {
                    return reply.send({ message: 'Errore durante la modifica del dato' });
                }
            }
            else{
                return reply.send({message: 'Dato non trovato'})
            }
        }
        else{
            return reply.send({message: 'Impossibile modificare i dati'})
        }
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
        if(email_found.email === email_del && email_del === email_log){
            const result = await email_found.data.findIndex((el) => el.key === key)
            if(result === -1){
                return reply.send({message: 'Dato non trovato'})
            }
            
            for(let i = 0; i < data.length; i++){
                if(data[email_index].email === email_del){
                    data[email_index].data.splice(result, 1)

                    try {
                        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
                        return reply.send({ message: 'Dato eliminato correttamente' });
                    } catch (error) {
                        return reply.send({ message: 'Errore durante l\'eliminazione del dato' });
                    }
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