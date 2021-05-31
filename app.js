const express = require('express');
const dotenv = require('dotenv');

const app = express();

dotenv.config({path:".env"});

app.use(express.json());
app.use(require("./router"));


require('./db/dbConn');
app.listen(process.env.PORT, ()=>{
    console.log(`Listening on port : ${process.env.PORT}`); 
});

