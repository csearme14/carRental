//load modules
const express = require('express');
const exphbs = require('express-handlebars');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const passport = require('passport');
//init app
const app = express();
// setup body parser middleware
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
// configuration for authentication
app.use(cookieParser());
app.use(session({
    secret:'mysecret',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
//load Files
const keys = require('./config/keys');
//load collections
const User = require('./models/user');
const Contact = require('./models/contact');
const { count } = require('./models/user');
const passport = require(passport); //ERROR
//connect to mongoDB                    
mongoose.connect(keys.MongoDB,() => {
    console.log('MongoDB is connected ..');
},{ useNewUrlParser: true
}).catch((err) => {
    console.log(err);
});
//setup view engine
app.engine('handlebars',exphbs({
    defaultLayout:'main'
}));
app.set('view engine', 'handlebars');
//connect client side to serve css and js files
app.use(express.static('public'));
//create port
const port = process.env.PORT || 3000;
//hand home route
app.get('/',(req,res) => {
    res.render('home');
});
app.get('/about',(req,res) => {
    res.render('about',{
        title: 'About'
    });
});
app.get('/contact',(req,res) => {
    res.render('contact',{
        title:'Contact us'
    });
});
//save contact from data
app.post('/contact',(req,res) => {
    console.log(req.body);
    const newContact = {
        //email:req.body.email,
        //name: req.body.name,
        name: req.user._id,
        message:req.body.message
    }
    new Contact(newContact).save((err,user) => { //เปลี่ยน User >> Contact
        if (err){
            throw err;
        }else{
            console.log('We received message from user', user);
        }
    });
});
app.get('/signup',(req,res) =>{
    res.render('signupForm',{
        tital:'Register'
    });
});
app.post('/signup' , (req , res)=>{
    const body = req
    console.log(body);
    return res.json({message : "OK"})
})
app.listen(port,() => {
    console.log(`Server is running on part ${port}`);
});

//โครงสร้าง ของ ฐานข้อมูล มันไม่เหมือนกับที่ต้องการเก็บ แก้ models
//ต้องเส้น post ของ สมัคร ทุกเส้น
//lib has password bcryptjs