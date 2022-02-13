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
const formidable    = require('formidable');
const socketIO      = require('socket.io');
const http          = require('http');
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
//load helpers
const {requireLogin,ensureGuest} = require('./helpers/authHelper');
const {upload} = require('./helpers/aws');
//load passports
    require('./passport/local');
    require('./passport/facebook');
// make user as a global object
app.use((req,res,next) =>{
    res.locals.user = req.user || null;
    next();
});
//load Files
const keys = require('./config/keys');
//load collections
const User = require('./models/user');
const Contact = require('./models/contact');
const Car = require('./models/car');
const car = require('./models/car');
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
app.get('/',ensureGuest,(req,res) => {
    res.render('home');
});
app.get('/about',ensureGuest,(req,res) => {
    res.render('about',{
        title: 'About'
    });
});
app.get('/contact',requireLogin,(req,res) => {                 
    res.render('contact',{
        title:'Contact us'
    });
});
//save contact from data
app.post('/contact',requireLogin,(req,res) => {
    console.log(req.body);
    const newContact = {
        name: req.user._id,
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
app.get('/signup',ensureGuest,(req,res) => {
    res.render('signupForm',{
        title:'Register'
    });
});
//save signup from data
app.post('/signup',ensureGuest,(req , res) => {     
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
                        success.push({text:'Successfully created a new account'}); //แจ้งเตือนสร้างผู้ใช้ใหม่สำเร็จ
                        res.render('loginForm',{
                            success:success
                        })
                    }
                })
            }
        })
    }
});
app.get('/displayLoginForm',ensureGuest,(req,res) => {
    res.render('loginForm',{
        title:'Login'
    });
});
//passport authentication
app.post('/login',passport.authenticate('local',{   //เข้าสู้ระบบได้ด้วยบัญชีที่มีในฐานข้อมูลเท่านั้น
    successRedirect:'/profile',
    failureRedirect: '/loginErrors'    
}));
app.get('/auth/facebook',passport.authenticate('facebook',{
    scope: ['email']
}));
app.get('/auth/facebook/callback',passport.authenticate('facebook',{
    successRedirect: '/profile',
    failureRedirect: '/'
}));

//display profile ใช้ส่งค่าไปเทียบกับฐานข้อมูลว่ามี user นั้นไหม
app.get('/profile',requireLogin,(req,res) => { 
    User.findById({_id:req.user._id})                                                                          
    .then((user) => {
        //เช็คว่าใครเข้าใช้งานระบบอยู่บ้าง
        user.online = true;
        user.save((err,user)=>{
            if(err){
                throw err;
            }
            if(user){
                res.render('profile',{
                    user:user,
                    title:'Profile'
                });
            }
        })
    });
});
app.get('/loginErrors',(req,res) =>{ //email ที่ยังไม่ได้สมัครจะไม่สามารถ login ได้
    let errors = [];
    errors.push({text:'User or password is incorrect'});
    res.render('loginForm',{
        errors:errors,
        title:'Error'
    });
});
//list a car route
app.get('/listCar',requireLogin,(req,res) => {
    res.render('listCar',{
        title:'Listing'
    });
});
app.post('/listCar',requireLogin,(req,res) => {
    const newCar = {
        owner: req.user._id,
        make: req.body.make,
        model:req.body.model,
        year: req.body.year,
        type: req.body.type
    }
    new Car(newCar).save((err,car)=>{
        if (err){
            throw err;
        }
        if(car){
            res.render('listCar2',{
                title:'Finish',
                car:car
            });
        }
    })
});
app.post('/listCar2',requireLogin,(req,res)=>{
    Car.findOne({_id:req.body.carID,owner:req.user._id})
    .then((car)=>{
        let imageUrl = {
            imageUrl:`https://psu-carrental-app.s3.ap-southeast-1.amazonaws.com/${req.body.image}`
        };
        car.pricePerHour = req.body.pricePerHour;
        car.pricePerWeek = req.body.pricePerWeek;
        car.location     = req.body.location;
        car.image.push(imageUrl);
        car.save((err,car)=>{
            if(err){
                throw err;
            }
            if(car){
                res.redirect('/showCars');
            }
        })
    })
});
//showCars
app.get('/showCars',requireLogin,(req,res)=>{
    Car.find({})
    .populate('owner')
    .sort({date:'desc'})
    .then((cars)=>{
        res.render('showCars',{
            cars:cars
        })
    })
})
//receive image
app.post('/uploadImage',requireLogin,upload.any(),(req,res)=>{
    const form = new formidable.IncomingForm();
    form.on('file',(field,file)=>{
        console.log(file);
    });
    form.on('error',(err)=>{
        console.log(err);
    });
    form.on('end', () =>{
        console.log('Image received successfully..');
    });
    form.parse(req);
});
//logout for user
app.get('/logout',(req,res) => {
    User.findById({_id:req.user._id})
    .then((user) => {
        user.online = false;
        user.save((err,user) =>{
            if(err){
                throw err;
            }
            if(user){
                req.logout();
                res.redirect('/');
            }
        });
    });
});
app.get('/openGoogleMap',(req,res)=>{
    res.render('googlemap');
});
// socket connection
const server = http.createServer(app);
const io = socketIO(server);
io.on('connection',(socket)=>{
    console.log('Connected to Client');
    //listen to object ID event
    socket.on('ObjectID',(ObjectID)=>{
        console.log('User ID is',ObjectID);
        Car.findOne({owner:ObjectID})
        .then((car)=>{
            socket.emit('car',car);
        });
    });
    //listen to event to receive lat and lng   ค่า V0 ไม่ขึ้น!!
    socket.on('LatLng',(data)=>{
        console.log(data);
        //find a car object and update lat and lng
        Car.findOne({owner:data.car.owner})
        .then((car) =>{
            car.coords.lat = data.data.results[0].geometry.location.lat;
            car.coords.lng = data.data.results[0].geometry.location.lng;
            car.save((err,car)=>{
                if(err){
                    throw err;
                }
                if(car){
                    console.log('Car Lat and Lng is updated!')
                }
            })
        }).catch((err)=>{
            console.log(err);
        });
    });
    //listen to disconnection         
    socket.on('disconnect',(socket)=>{
        console.log('Disconnection from Client');
    });
});

server.listen(port,() => {
    console.log(`Server is running on part ${port}`);
});