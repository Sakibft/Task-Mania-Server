const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT ||  5000 ;
require('dotenv').config()

// middleware
app.use(cors());
app.use(express.json())



console.log('hahah');


const { MongoClient, ServerApiVersion } = require('mongodb');
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
async function run() {
  try {
   
    // post user
app.post('/user',async(req,res)=>{
  const user = req.body;
  const query = {email:user.email}
  const isExist = await userCollection.findOne(query)
  if(isExist){
    return res.send({message:'user all ready exist ', insertedId:null})
  }
  console.log(user);
  const result = await userCollection.insertOne(user)
  res.send(result)
})
// get specific user
app.get('/user/:email', async(req,res)=>{
  const email = req.params.email;
  console.log(email);
  const query = {email:email}
  const result = await userCollection.findOne(query)
  res.send(result)
  // console.log(user);
})
// post task 
app.post('/task', async(req,res)=>{
  const task = req.body;
const result = await taskCollection.insertOne(task)
console.log(task); 
res.send(result)
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