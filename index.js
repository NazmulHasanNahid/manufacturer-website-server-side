const express = require('express')
const app = express()
const port = process.env.PORT || 5000
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wwafz.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run(){
     try{
          await client.connect()
          const toolsCollection = client.db('manufacture').collection('tools')
          const orderCollection = client.db('manufacture').collection('orders')
          app.get('/tools' , async(req, res)=>{
               const query = {}
               const cursor = toolsCollection.find(query)
               const tools = await cursor.toArray()
               res.send(tools)
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