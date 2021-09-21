//load modules
const express       = require('express');
const exphbs        = require('express-handlebars');
const mongoose      = require('mongoose');
const bodyParser    = require('body-parser');
const session       = require('express-session');
const cookieParser  = require('cookie-parser');
const passport      = require('passport');
const bcrypt        = require('bcryptjs');
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
            console.log('เราได้รับข้อความจากผู้ใช้', user);
        }
    });
});
app.get('/signup',(req,res) => {
    res.render('signupForm',{
        title:'Register'
    });
});
app.post('/signup',(req , res) => {
    console.log(req.body);
    let errors = [];
    if (req.body.password !== req.body.password2){
        errors.push({text:'Password does not match'}); //รหัสผ่านไม่เหมือนกัน
    }
    if (req.body.password.length < 5){
        errors.push({text:'Password must be at least 5 characters.'}); //รหัสผ่านต้องมีอย่างน้อย 5 ตัวอักษร
    }
    if (errors.length > 0){
        res.render('signupForm',{
            errors:errors,
            firstname:  req.body.firstname,
            lastname:   req.body.lastname,
            password:   req.body.password,
            password2:  req.body.password2,
            email:      req.body.email
        })
    }else{
        User.findOne({email:req.body.email})
        .then((user) => {
            if (user){
                let errors = [];
                errors.push({text:'This email already exists'}); //มีอีเมลนี้อยู่แล้ว
                res.render('signupForm',{ //error
                    errors:errors
                });
            }else{
                //encypt password => hashfuntion salt = 10
                let salt = bcrypt.genSaltSync(10);
                let hash = bcrypt.hashSync(req.body.password,salt);

                const newUser = {
                    firstname:  req.body.firstname,
                    lastname:   req.body.lastname,
                    email:      req.body.email,
                    password:   hash
                }
                new User(newUser).save((err,user) => {
                    if (err){
                        throw err;
                    }
                    if(user){
                        console.log('New user is created'); //สร้างผู้ใช้ใหม่แล้ว
                    }
                })
            }
        })
    }
});
app.listen(port,() => {
    console.log(`Server is running on part ${port}`);
});

//โครงสร้าง ของ ฐานข้อมูล มันไม่เหมือนกับที่ต้องการเก็บ แก้ models
//ต้องเส้น post ของ สมัคร ทุกเส้น
//lib has password bcryptjs