const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

const app = express();

dotenv.config({path:".env"});

app.use(express.json());
app.use(cookieParser());
app.use(require("./router"));


require('./db/dbConn');
app.listen(process.env.PORT, ()=>{
    console.log(`Listening on port : ${process.env.PORT}`); 
});

