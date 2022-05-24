const express = require('express')
const app = express()
const port = process.env.PORT || 5000
const jwt = require('jsonwebtoken')
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wwafz.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
     const authHeader = req.headers.authorization;
     if (!authHeader) {
       return res.status(401).send({ message: 'UnAuthorized access' });
     }
     const token = authHeader.split(' ')[1];
     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
       if (err) {
         return res.status(403).send({ message: 'Forbidden access' })
       }
       req.decoded = decoded;
       next();
     });
   }

async function run(){
     try{
          await client.connect()
          const toolsCollection = client.db('manufacture').collection('tools')
          const orderCollection = client.db('manufacture').collection('orders')
          const reviewCollection = client.db('manufacture').collection('review')
          const userCollection = client.db('manufacture').collection('user')
          app.get('/tools' , verifyJWT, async(req, res)=>{
               const query = {}
               const cursor = toolsCollection.find(query)
               const tools = await cursor.toArray()
               res.send(tools)
          })
          app.post('/tools' , async(req,res)=>{
               const newTools = req.body ;
               const result = await toolsCollection.insertOne(newTools)
               res.send(result)
             })
          app.get('/tools/:id' , async(req,res)=>{
               const id = req.params.id;
               const query = {_id: ObjectId(id)};
               const tools = await toolsCollection.findOne(query)
               res.send(tools)
         
             })
             app.post('/order' , async(req,res)=>{
               const newOrder = req.body;
               const result = await orderCollection.insertOne(newOrder)
               res.send(result)
             })
             app.get('/order' , verifyJWT, async(req,res)=>{
                  const email = req.query.email
                  
                  console.log('authHeader' , authorization);
                  const query ={ email:email}
                  const cursor = orderCollection.find(query)
                  const order = await cursor.toArray()
                  res.send(order)
             })
             app.post('/review' , async(req,res)=>{
               const newReview = req.body ;
               const result = await reviewCollection.insertOne(newReview)
               res.send(result)
             })
             app.get('/reviews', verifyJWT , async(req,res)=>{
               const query = {}
               const cursor = reviewCollection.find(query)
               const reviews = await cursor.toArray()
               res.send(reviews)
          })
          app.put('/user/:email', async(req,res)=>{
               const email = req.params.email;
               const user = req.body;
               const filter = { email: email };
               const options = { upsert: true };
               const updateDoc = {
                 $set: user,
               };
               const result = await userCollection.updateOne(filter, updateDoc, options);
               const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
               res.send({ result, token });
          })
     }
     finally{
          //await client.close()
     }
}
run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('manufacturer server running')
})

app.listen(port, () => {
  console.log("listening to the port" , port)
})