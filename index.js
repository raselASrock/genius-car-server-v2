const express = require('express');
const cors = require('cors');
const jwt = require ('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// Middleware

app.use(cors())
app.use(express.json())

console.log(process.env.DB_USER);
console.log(process.env.DB_PASSWORD);




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster1.yyonl1x.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next){
    // console.log();
    const authHeader = req.headers.authorization;
    if(!authHeader){
        res.status(401).send({message: 'unauthorized access'})
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
        if(err){
            res.status(401).send({message: 'unauthorised access'})
        }
        req.decoded = decoded;
        next()
    })
}

async function run(){
    try{
        const serviceCollection = client.db('genius-car').collection('services')
        const orderCollection = client.db('genius-car').collection('orders')


        app.post('/jwt', (req, res) =>{
            const user = req.body
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{expiresIn: '1h'})
            res.send({token})
        })

        app.get('/services', async (req, res) =>{
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services)
        })

        app.get('/services/:id', async (req, res) =>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)}
            const service = await serviceCollection.findOne(query)
            res.send(service)
        })


        // orders api
        app.get('/orders', verifyJWT, async (req, res) =>{
            // console.log(req.headers.authorization)
            let query = {}
            if(req.query.email){
                query = {
                    email: req.query.email
                }
            }
            const cursor = orderCollection.find(query)
            const orders = await cursor.toArray()
            res.send(orders)
        });
        app.post('/orders', async (req, res) =>{
            const order = req.body;
            const result = await orderCollection.insertOne(order)
            res.send(result)
        })

        app.patch('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const status = req.body.status
            const query = { _id: ObjectId(id) }
            const updatedDoc = {
                $set:{
                    status: status
                }
            }
            const result = await orderCollection.updateOne(query, updatedDoc);
            res.send(result);
        })
        app.delete('/orders/:id', async (req, res) =>{
            const id = req.params.id;
            const query = { _id: ObjectId(id)}
            const result = await orderCollection.deleteOne(query);
            res.send(result);
        })
    }
    finally{

    }
}

run().catch(err => console.error(err))





app.get('/', (req, res) =>{
    res.send('genius car surver is running')
})

app.listen(port, ()=>{
    console.log(`Genius car running on port: ${port}`);
})