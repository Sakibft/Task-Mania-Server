const express = require('express')
const app = express()
const cors = require('cors')
const jwt = require('jsonwebtoken')

require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRETE_KEY)
const port = process.env.PORT || 5000;
require('dotenv').config()
// console.log(stripe,'secrete');
// middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://taskmania-85588.web.app'
  ],
}));
app.use(express.json())



console.log('hahah');


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rriax4f.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const userCollection = client.db('TaskMania').collection('Users')
const taskCollection = client.db('TaskMania').collection('Tasks')
const purchaseCoinCollection = client.db('TaskMania').collection('PurchaseCoin')
const paymentCoinCollection = client.db('TaskMania').collection('payment')
const submissionCollection = client.db('TaskMania').collection('Submission')
async function run() {
  try {
    // jwt related api 
    app.post('/jwt', async (req, res) => {
      const user = req.body;
       const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h'
      });
      res.send({ token })
    })
    // middleware 
    const verifyToken = async (req, res, next) => {
      console.log(req.headers.authorization,'inside verifyToken');
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'forbidden access1' });
      }
      const token = req.headers.authorization.split(' ')[1];

      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'forbidden access' });
        }
        req.decoded = decoded;
        next();
      })

      // next();
    }
    // post user
    app.post('/user', async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const isExist = await userCollection.findOne(query)
      if (isExist) {
        return res.send({ message: 'user all ready exist ', insertedId: null })
      }
      console.log(user);
      const result = await userCollection.insertOne(user)
      res.send(result)
    })
    // update user coin 
    app.put('/user', async (req, res) => {
      const cn = req.body;
      const email = cn.email;
      const coin = cn.coin;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (user) {
        const newCoinValue = (user.coin || 0) + coin;
        const newUp = {
          $set: {
            coin: newCoinValue
          }
        }
        const result = await userCollection.updateOne(query, newUp)
        res.send(result)
      }
      console.log(coin, 'update this coin in the database');
    })
    // get specific user
    // done!get header .
    app.get('/user/:email', verifyToken, async (req, res) => {
      // console.log(req.headers.authorization,'from jwt');
      const email = req.params.email;
      // console.log(email);
      const query = { email: email }
      const result = await userCollection.findOne(query)
      res.send(result)
      // console.log(user);
    })
    // get all user
    app.get('/user', async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result)
    })
    // delete user
    app.delete('/user/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await userCollection.deleteOne(query);
      res.send(result)
      console.log(id);
    })
    // update user status 
    app.put('/userStatus', async (req, res) => {
      const usr = req.body;
      const email = usr?.email;
      const status = usr?.status;
      // console.log(email, status);
      // console.log(usr);
      const query = {email:email}
      const user = userCollection.findOne(query)
      if(user){
        const newUp = {
          $set: {
           category : status
          }
        }
        const result = await userCollection.updateOne(query,newUp)
        res.send(result)
      }
    })
    // post task 
    app.post('/task', async (req, res) => {
      const task = req.body;
      const { quantity, amount, email } = task;
      const qantity = parseInt(quantity);
      const amnt = parseInt(amount);
      const totalCost = qantity * amnt;
      const creator = await userCollection.findOne({ email: email })
      if (creator.coin < totalCost) {
        return res.status(400).json({ message: "Not enough coins. Please purchase more coins." });
      }
      console.log(creator);
      const result = await taskCollection.insertOne(task)
      res.send(result)
    })
    // get all task 
    // /tasks
    // GET
    // It will send all documents from  taskCollection where the taskCount is greater than 0  from Database.   ( use $gt ) 
    app.get('/tasks', async (req, res) => {
      const tasks = await taskCollection.find().toArray();
      res.send(tasks)
    })
    // delete task 
    app.delete('/deleteTask/:id', async(req,res)=>{
      const id = req.params.id;
      console.log(id);
      const query = {_id: new ObjectId(id)};
      const task = await taskCollection.deleteOne(query);
      res.send(task)
    })
    //  my tasks 
    app.get('/tasks/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email }
      // date time diya sort hocce na .
      const result = await taskCollection.find(query).sort({ date: -1 }).toArray();
      console.log(email, 'hah');
      res.send(result)
    })
    // get id based tsk for show task detail => worker
    app.get('/task/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await taskCollection.findOne(query)
      res.send(result)
      console.log(id, 'id from worker detail');
    })
    // post submission details
    app.post('/submission', async (req, res) => {
      const submit = req.body;
      console.log(submit);
      const result = await submissionCollection.insertOne(submit)
      res.send(result)
    })
    // get submission detail with email ;
    app.get('/submission/:email', async (req, res) => {
      const email = req.params.email;
      const query = { workerEmail: email };
      const result = await submissionCollection.find(query).toArray();
      res.send(result)
      console.log(email, 'in side the submission');
    })
    // get ll task 
    app.get('/submission', async (req, res) => {
      const status = req.query.status;
      console.log(status);
      const query = { status: status }
      const result = await submissionCollection.find(query).toArray();
      res.send(result)
    })
    // Update status
    app.put('/submission', async (req, res) => {
      const info = req.body;
      const status = info.status;

      const id = info.id;
      console.log(id, 'client theke id ');
      const query = { taskId: id }
      const task = await submissionCollection.findOne(query);
      console.log(query, 'match');
      if (task) {
        const newUp = {
          $set: {
            status: status,

          }
        }
        const result = await submissionCollection.updateMany(query, newUp);
        res.send(result);
      }

      // const result = await submissionCollection.updateOne(query,newUp)
      // res.send(result)

    })
    // delete tasks
    // ● onClicking Delete, delete the task from task Collection. And Increase the
    // (task_quantity* payable_amount) coin in his available coin

    app.delete('/task/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await taskCollection.deleteOne(query)
      console.log(id);
      res.send(result);
    })
    //  update tasks 
    app.put('/task/update/:id', async (req, res) => {
      const update = req.body;
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const newUp = {
        $set: {
          ...update,
        }
      }
      const result = await taskCollection.updateOne(query, newUp)
      res.send(result)
    })
    // get all purchase data
    app.get('/purchaseCoin', async (req, res) => {
      const result = await purchaseCoinCollection.find().toArray()
      res.send(result)
    })

    // payment intent 
    app.post('/create-payment-intent', async (req, res) => {
      const { coin } = req.body;
      console.log(coin);
      // Check if coin is a valid number
      if (isNaN(coin) || coin <= 0) {
        return res.status(400).send({ error: 'Invalid coin amount' });
      }
      const amount = parseInt(coin * 100);
      console.log(amount, 'inside the intent ');

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ['card']
      });

      res.send({
        clientSecret: paymentIntent.client_secret
      });
    });
    // post payment data
    app.post('/payment', async (req, res) => {
      const payment = req.body;
      console.log(payment);
      const result = await paymentCoinCollection.insertOne(payment)
      res.send(result)
    })
    // get all payment data 
    app.get('/payment', async (req, res) => {
      const result = await paymentCoinCollection.find().toArray();
      res.send(result);
    })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
















app.get('/', (req, res) => {
  res.send('Hello World!')
})
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})