const mongoose = require('mongoose');

mongoose.connect(process.env.DATABASE, {
    useCreateIndex : true,
    useNewUrlParser : true,
    useUnifiedTopology : true,
    useFindAndModify : false
}).then(() =>{
    console.log('Connection successfull with database');
}).catch(err => {
    console.log('Connection failed with database \n', err);
});