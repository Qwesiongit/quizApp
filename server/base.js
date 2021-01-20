require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
const port = process.env.PORT;
const  secret = process.env.SECRET;
const cors = require('cors');
const AdminController=require('./controllers/AdminController');
const UserController=require('./controllers/UserController');
const fileupload = require('express-fileupload');
const path = require('path');



//cross domain
const cors_items={
    origin:"http://localhost:3000",
    methods:["GET","HEAD","POST","DELETE","PUT","PATCH","OPTIONS"],
    allowHeaders:["Content-Type","Accept","Authorization"],
    credentials:true //Allow setting of cookies
};

let allowCrossDomain = {
    origin:process.env.CORS_ALLOW_ORIGIN || "*",
    methods:["GET","HEAD","POST","DELETE","PUT","PATCH"],
    allowHeaders:["Content-Type","Accept","Authorization"],
    credentials:true
};


const mongoURI=process.env.DATABASE;
const options = {useNewUrlParser:true,useUnifiedTopology: true};
mongoose.set('useFindAndModify', false);

//initialize app
const app = express();

//app will work with the ff
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended:true}));
app.use("/",express.static(path.join(__dirname,'public')));


//connect db
mongoose.connect(mongoURI,options).then(()=>{
    console.log("Database connection success!!!");
}).catch(err=>{
console.log(err);
});


//app use cookies and session
app.use(session({
    secret:secret,
    saveUninitialized:true,
    resave:true,
    cookie:{maxAge:60000*30}
}));


// app use cross domain
app.use(cors(cors_items));

// app use file upload
app.use(fileupload());

// connect controllers
AdminController(app);
UserController(app);


// app connect sever
app.listen(port,()=>{
    console.log(`server is running on port ${port}`)
});

