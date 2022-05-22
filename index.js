const express = require('express')
const app = express()
const port = process.env.PORT || 5000
const cors = require('cors');
require('dotenv').config()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('manufacturer server running')
})

app.listen(port, () => {
  console.log("listening to the port" , port)
})