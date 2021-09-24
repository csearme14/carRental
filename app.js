//load modules
const express       = require('express');
const exphbs        = require('express-handlebars');
const mongoose      = require('mongoose');
const bodyParser    = require('body-parser');
const Handlebars    = require('handlebars');
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
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

//load passports
    require('./passport/local');
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
    defaultLayout:'main',
    handlebars: allowInsecurePrototypeAccess(Handlebars)
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
        name: req.user._id,                                                                 //_id
        message:req.body.message
    }
    new Contact(newContact).save((err,user) => {
        if (err){
            throw err;
        }else{
            console.log('Succeed we have received a message from you', user);
        }
    });
});
app.get('/signup',(req,res) => {
    res.render('signupForm',{
        title:'Register'
    });
});
//save signup from data
app.post('/signup',(req , res) => {     
    console.log(req.body);
    let errors = [];
    if (req.body.password !== req.body.password2){  //เปรียบเทียบรหัสผ่าน
        errors.push({text:'Password does not match'}); 
    }
    if (req.body.password.length < 5){ //กำหนดให้รหัสผ่านต้องมีอย่างน้อย 5 ตัวอักษร
        errors.push({text:'Password must be at least 5 characters.'});
    }
    if (errors.length > 0){
        res.render('signupForm',{
            errors:errors,
            firstname:  req.body.firstname,
            lastname:   req.body.lastname,
            password:   req.body.password,
            password2:  req.body.password2,
            email:      req.body.email,
            phone:      req.body.phone,
            gender:     req.body.gender,
            age:        req.body.age,
            id_card:    req.body.id_card
        })
    }else{
        User.findOne({email:req.body.email})
        .then((user) => {
            if (user){
                let errors = [];
                errors.push({text:'This email already exists'}); //มีอีเมลนี้อยู่แล้ว
                res.render('signupForm',{
                    errors:errors,
                    firstname:  req.body.firstname,
                    lastname:   req.body.lastname,
                    password:   req.body.password,
                    password2:  req.body.password2,
                    email:      req.body.email,
                    phone:      req.body.phone,
                    gender:     req.body.gender,
                    age:        req.body.age,
                    id_card:    req.body.id_card
                });
            }else{
                //encypt password => hashfuntion salt = 10
                let salt = bcrypt.genSaltSync(10);
                let hash = bcrypt.hashSync(req.body.password,salt); //ทำการเข้ารหัสเพิ่มความปลอดภัย

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
                        let success = [];
                        success.push({text:'Successfully created a new account. You can log in now.'}); //แจ้งเตือนสร้างผู้ใช้ใหม่สำเร็จ
                        success.push({text:'You can log in now.'});
                        res.render('loginForm',{
                            success:success
                        })
                    }
                })
            }
        })
    }
});
app.get('/displayLoginForm',(req,res) => {
    res.render('loginForm');
});
app.post('/login',passport.authenticate('local',{   //เข้าสู้ระบบได้ด้วยบัญชีที่มีในฐานข้อมูลเท่านั้น
    successRedirect:'/profile',
    failureRedirect: '/loginErrors'    

}));
//display profile ใช้ส่งค่าไปเทียบกับฐานข้อมูลว่ามี user นั้นไหม
app.get('/profile',(req,res) => {
    User.findById({_id:req.user._id})                                                                           //error
    .then((user) => {
        res.render('profile',{
            user:user
        });
    });
});
app.listen(port,() => {
    console.log(`Server is running on part ${port}`);
});