const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");
const cors = require("cors");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();


app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wwafz.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    await client.connect();
    const toolsCollection = client.db("manufacture").collection("tools");
    const categoriesCollection = client.db("manufacture").collection("category");
    const orderCollection = client.db("manufacture").collection("orders");
    const reviewCollection = client.db("manufacture").collection("review");
    const userCollection = client.db("manufacture").collection("user");
    const profileCollection = client.db("manufacture").collection("profile");
    app.get("/tools", async (req, res) => {
      const query = {};
      const cursor = toolsCollection.find(query);
      const tools = await cursor.toArray();
      res.send(tools);
    });
    //delet api
    app.delete('/tools/:id' , async(req,res)=>{
     const id = req.params.id ;
     const query = {_id: ObjectId(id)}
     const result  = await toolsCollection.deleteOne(query)
     res.send(result)
   })
    app.post("/tools", async (req, res) => {
      const newTools = req.body;
      const result = await toolsCollection.insertOne(newTools);
      res.send(result);
    });
    app.get("/tools/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const tools = await toolsCollection.findOne(query);
      res.send(tools);
    });
    app.post("/order", async (req, res) => {
      const newOrder = req.body;
      const result = await orderCollection.insertOne(newOrder);
      res.send(result);
    });
    app.get("/order", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;
      if (email === decodedEmail) {
        const query = { email: email };
        const cursor = orderCollection.find(query);
        const order = await cursor.toArray();
        return res.send(order);
      } else {
        return res.status(403).send({ message: "Forbidden access" });
      }
    });
    //payment
     app.get('/payment/:id' ,verifyJWT, async(req,res)=>{
       const id = req.params.id
       const query = {_id:ObjectId(id)}
       const payment = await orderCollection.findOne(query)
       res.send(payment)
     })
    app.post("/category",  async (req, res) => {
     const newCategory = req.body;
     const result = await categoriesCollection.insertOne(newCategory);
     res.send(result);
   });
   app.get("/category", async (req, res) => {
     const query = {};
     const cursor = categoriesCollection.find(query);
     const category = await cursor.toArray();
     res.send(category);
   });
    app.post("/review", async (req, res) => {
      const newReview = req.body;
      const result = await reviewCollection.insertOne(newReview);
      res.send(result);
    });
    app.get("/reviews", async (req, res) => {
      const query = {};
      const cursor = reviewCollection.find(query);
      const reviews = await cursor.toArray();
      res.send(reviews);
    });



    //admin
    app.put("/user/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({
        email: requester,
      });
      if (requesterAccount.role === "admin") {
        const filter = { email: email };
        const updateDoc = {
          $set: { role: "admin" },
        };
        const result = await userCollection.updateOne(filter, updateDoc);
        res.send(result);
      } else {
        res.status(403).send({ message: "forbidden" });
      }
    });


    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "3h" }
      );
      res.send({ result, token });
    });





    app.get("/user", verifyJWT, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    app.get('/admin/:email', async(req, res) =>{
     const email = req.params.email;
     const user = await userCollection.findOne({email: email});
     const isAdmin = user.role === 'admin';
     res.send({admin: isAdmin})
   })


   //profile
   app.post("/profile", async (req, res) => {
    const profile = req.body;
    const result = await profileCollection.insertOne(profile);
    res.send(result);
  });

  app.get("/profile", verifyJWT, async (req, res) => {
    const email = req.query.email;
    const decodedEmail = req.decoded.email;
    if (email === decodedEmail) {
      const query = { email: email };
      const cursor = profileCollection.find(query);
      const profile = await cursor.toArray();
      return res.send(profile);
    } else {
      return res.status(403).send({ message: "Forbidden access" });
    }
  });
   //payment
   app.post("/create-payment-intent", verifyJWT,  async (req, res) => {
    const service = req.body;
    const price = service.price;
    console.log(price);
    const amount = price*100;  
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount ,
      currency: "usd",
      payment_method_types:['card']
    });
   console.log('data',paymentIntent);
    res.send({
      clientSecret: paymentIntent.client_secret,
      
    });
  });
  










  } finally {
    //await client.close()
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("manufacturer server running");
});

app.listen(port, () => {
  console.log("listening to the port", port);
});
