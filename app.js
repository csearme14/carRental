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
const axios         = require('axios')
const crypto        = require('crypto')
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
const Car = require('./models/car');
const car = require('./models/car');
const Chat = require('./models/chat');
const chat = require('./models/chat');
const rentCar = require('./models/rentCar');
//connect to mongoDB                    
mongoose.connect(keys.MongoDB,() => {
    console.log('MongoDB is connected ..');
},{ useNewUrlParser: true
}).catch((err) => {
    console.log(err);
});
//setup view engine
app.engine('handlebars',exphbs({
    helpers: {
        inc: function (value, options) {
            return parseInt(value) + 1;
        }
    },
    defaultLayout:'main',
    handlebars: allowInsecurePrototypeAccess(Handlebars)
}));
app.set('view engine', 'handlebars');
//connect client side to serve css and js files
app.use(express.static('public'));
//create port
const port = process.env.PORT || 3200;
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

app.get('/signup',ensureGuest,(req,res) => {
    res.render('signupForm',{
        title:'Register'
    });
});
//save signup from data
app.post('/signup',ensureGuest,(req , res) => {     
    console.log(req.body);
    let errors = [];
    if (req.body.image !== '') {
        req.body.picture = `https://psu-carrental-app.s3.ap-southeast-1.amazonaws.com/${req.body.image}`
    }
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
            id_card:    req.body.id_card,
            imageSsn:   req.body.picture
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
                    id_card:    req.body.id_card,
                    imageSsn:   req.body.picture
                });
            }else{
                //encypt password => hashfuntion salt = 10
                let salt = bcrypt.genSaltSync(10);
                let hash = bcrypt.hashSync(req.body.password,salt); //ทำการเข้ารหัสเพิ่มความปลอดภัย

                const newUser = {
                    firstname:  req.body.firstname,
                    lastname:   req.body.lastname,
                    email:      req.body.email,
                    password:   hash,
                    imageSsn:   req.body.picture
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
//
app.get("/rentCar/:id", async (req, res) => {
    const user = await User.findById({_id:req.session.passport.user}) 
    Car.findOne({_id: req.params.id})
        .then((result) => {
            res.render('rentCar', {
                car: result,
                user: user
            })
        }).catch((error) => {
            throw error;
        })
    
})


app.post('/rentCar', async (req,res) => {
    const data = req.body
    data.status = 'pending'

    console.log(data)
    try {
        await rentCar.create(data)
        await Car.updateOne({_id: data.car}, {canRent: false, adminApprove: false})
        res.render('rentSuccess')
    } catch (e) {
        console.log(e)
    }
})

app.post('/recheckRentCar', async (req, res) => {
    const user = await User.findById({_id:req.body.user}) 
    const car = await Car.findById({_id:req.body.car}) 

    const rate = car.rate.find(item => item.day == req.body.amountDay)

    req.body.price = rate.price

    const rentDate = new Date(req.body.dateTime)

    req.body.returnDate = rentDate.setDate(rentDate.getDate() + parseInt(req.body.amountDay))

    const dateThai = new Date(req.body.dateTime).toLocaleString('th', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute:'2-digit'
      })

    req.body.dateThai = dateThai

    res.render('recheckRentCar', {
        detail: req.body,
        user: user,
        car: car
    })
})
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
app.get('/loginErrors', (req,res) =>{ //email ที่ยังไม่ได้สมัครจะไม่สามารถ login ได้
    let errors = [];
    errors.push({text:'User or password is incorrect'});
    res.render('loginForm',{
        errors:errors,
        title:'Error'
    });
});
//
app.get('/deleteCar/:id', async (req, res) => {
    await Car.findOneAndDelete({_id: req.params.id})
        .then(async () => {
            const cars = await Car.find({})
                            .populate('owner')
                            .sort({date:'desc'})

            res.render("showCars", {
                cars: cars
            })

        }).catch((error) => {
            console.log(error)
        })
})
//list a car route
// app.get('/listCar',requireLogin, async (req,res) => {
    
//     res.render('listCar',{
//         title:'Listing',
//     });
// });
// app.post('/listCar',requireLogin,(req,res) => {
//     const newCar = {
//         owner: req.user._id,
//         make: req.body.make,
//         model:req.body.model,
//         year: req.body.year,
//         type: req.body.type
//     }
//     new Car(newCar).save((err,car)=>{
//         if (err){
//             throw err;
//         }
//         if(car){
//             res.render('listCar2',{
//                 title:'Finish',
//                 car:car
//             });
//         }
//     })
// });
app.post('/payment', async (req,res) => {
    if (req.body.payment_status === "000") {
        await User.updateOne({_id:req.query.id}, {isPayment: true}) 
    } 
})

app.post('/afterPayment', async (req,res) => {
    const user = await User.findOne({_id: req.query.id})

    if (user.isPayment) {
        res.render('successPayment')
    } else {
        res.render('failPayment')
    }
})
app.get('/paymentOneTime', async (req, res) => {
    let orderID = 'Rent'+Math.floor(Math.random() * 100) + 1;
    const secret = 'QnmrnH6QE23N'
    const urlOne = "https://rent-car.th.app.ruk-com.cloud/afterPayment?id="+req.session.passport.user
    const urlTwo = "https://rent-car.th.app.ruk-com.cloud/payment?id="+req.session.passport.user
    const params = "8.5"+"JT04"+"One Time"+orderID+"764"+"000000009900"+urlOne+urlTwo
    
    //เข้ารหัสโดยใช้ secret key ของ 2c2p
    const hash = crypto
        .createHmac('sha256', secret)
        .update(params)
        .digest('hex')

    res.render('beforeAddCar', {
        orderID: orderID,
        hash: hash,
        urlOne: urlOne,
        urlTwo: urlTwo
    })

})
app.post('/addCar', async (req, res) => {
    console.log(req.body)
    try {
        const carUser = await Car.findOne({_id: req.body.carId}) 
        carUser.rate = req.body.rate
        carUser.save()

        res.status(200).json({message: 'success'})
    } catch (e) {
        console.log(e)
    }
})
app.post('/updateProfile', async (req, res) => {
    const updateData = {
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        image: `https://psu-carrental-app.s3.ap-southeast-1.amazonaws.com/${req.body.image}`
    }

    try {
        await User.updateOne({_id: req.query.id}, updateData)
        res.redirect('/profile')
    } catch (e) {
        console.log(e)
    }

})

app.post('/updateCar/:id', async (req, res) => {
    
    let getLatLongURL = `https://maps.googleapis.com/maps/api/geocode/json?address=${req.body.location}&key=AIzaSyBMBKCUVBeA74u7ZgxAgimeJpF2oPeTdFw`
  
    getLatLongURL = decodeURI(getLatLongURL)
    getLatLongURL = encodeURI(getLatLongURL)
    
    const resultGoogle = await axios.get(getLatLongURL)

    const coords = {
        lat: resultGoogle.data.results[0].geometry.location.lat,
        lng: resultGoogle.data.results[0].geometry.location.lng
    }

    if (req.body.statusUpdate === 'step1') {
        if (req.body.image !== '') {
            req.body.picture = `https://psu-carrental-app.s3.ap-southeast-1.amazonaws.com/${req.body.image}`
        }
        req.body.coords = coords
        req.body.image = [
            {
                imageUrl:`https://psu-carrental-app.s3.ap-southeast-1.amazonaws.com/${req.body.image}`
            }
        ]
    }

    try {
        await Car.updateOne({_id: req.params.id}, req.body)

        if (req.body.statusUpdate === 'step1') {
            const car = await Car.findOne({_id: req.params.id})
            res.render('editRentRate', {
                rate: car.rate,
                car: car,
            })
        } else {
            res.status(200).json({message: 'success'})
        }
    } catch (e) {
        console.log(e)
    }
})

app.get('/editCar/:id', async (req,res) => {
    try {
        const car = await Car.findOne({_id: req.params.id})
        res.render('editCar', {
            car: car
        })
    } catch (e) {
        console.log(e)
    }


})

app.get('/addCar', async (req,res) => {
    const nowDate = new Date()

    const user = await User.findOne({_id: req.session.passport.user})
    const carUser = await Car.findOne({owner:req.session.passport.user}) 
    let rentDetail = null

    if (carUser) {
        rentDetail = await rentCar.findOne({car: carUser._id, returnDate: {$gte: nowDate}, status: 'approve'}).populate('user')
    }

    if (rentDetail) {
        const dateThai = new Date(rentDetail.dateTime).toLocaleString('th', {
            timeZone: 'Asia/Bangkok',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute:'2-digit'
          })
        
        rentDetail.dateTime = dateThai
    }

    let status = true
    
    if (carUser) {
        status = false
    }

    if (user.isPayment) {
        res.render('listCar2', {
            car: carUser,
            status: status,
            rentDetail: rentDetail
        })
    } else {
        res.redirect('/paymentOneTime')
    }
    
})

app.post('/changeStatus', async (req, res) => {
    const data = req.body
    
    try {
        if (data.status === 'approve') {
            await Car.updateOne({_id: data.carId}, {canRent: false, adminApprove: true})
            await rentCar.updateOne({_id: data.rendId}, {status: 'approve'})
        } else if (data.status === 'cancel'){
            await Car.updateOne({_id: data.carId}, {canRent: true})
            await rentCar.updateOne({_id: data.rendId}, {status: 'cancel'})
        } else {
            await Car.updateOne({_id: data.carId}, {canRent: true, adminApprove: false})
            await rentCar.updateOne({_id: data.rendId}, {status: 'timeout'})
        }
        res.redirect('/approveCar')
    } catch (e) {
        console.log(e)
    }
})
app.get('/chatAdmin', async (req, res) => {
    const admin = await User.findOne({admin: true})

    const sender = req.session.passport.user
    const receiver = admin._id

    let chat = await Chat.findOne({sender:sender, receiver:receiver})

    if (!chat) {
        chat = await Chat.findOne({sender:receiver, receiver:sender})
    }

    if (chat) {
        res.redirect(`/chat/${chat._id}`);
    } else {
        const newChat = {
            sender: sender,
            receiver: receiver,
            date: new Date()
        }

        new Chat(newChat).save().then((chat)=>{
            res.redirect(`/chat/${chat._id}`);
       }).catch((err)=>{console.log(err)});
    }

})
app.get('/approveCar', async (req,res) => {
    const tempRentCarList = await rentCar.find({$or: [{status: 'approve'}, {status: 'pending'}]}).populate('car').populate('user')
    let rentCarList = JSON.parse(JSON.stringify(tempRentCarList))
    rentCarList.forEach(element => {
        if (element.status === 'pending') {
            element.showButton = true
        }
        element.dateThai = new Date(element.dateTime).toLocaleString('th', {
            timeZone: 'Asia/Bangkok',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute:'2-digit'
          })
    })

    res.render('approveCars', {
        rentCarList: rentCarList
    })
})

app.post('/listCar2', async (req,res)=>{

    let getLatLongURL = `https://maps.googleapis.com/maps/api/geocode/json?address=${req.body.location}&key=AIzaSyBMBKCUVBeA74u7ZgxAgimeJpF2oPeTdFw`
  
    getLatLongURL = decodeURI(getLatLongURL)
    getLatLongURL = encodeURI(getLatLongURL)
    

    const resultGoogle = await axios.get(getLatLongURL)

    const newCar = {
        owner: req.user._id,
        make: req.body.make,
        model:req.body.model,
        year: req.body.year,
        type: req.body.type,
        carNo: req.body.carNo,
        pricePerHour: req.body.pricePerHour,
        pricePerWeek: req.body.pricePerWeek,
        location: req.body.location,
        picture: `https://psu-carrental-app.s3.ap-southeast-1.amazonaws.com/${req.body.image}`,
        image: [
            {
                imageUrl:`https://psu-carrental-app.s3.ap-southeast-1.amazonaws.com/${req.body.image}`
            }
        ],
        coords: {
            lat: resultGoogle.data.results[0].geometry.location.lat,
            lng: resultGoogle.data.results[0].geometry.location.lng
        }
    }
    new Car(newCar).save((err,car)=>{
        if (err){
            throw err;
        }
        if(car){
            const rentRate = [
                {
                    day: 2,
                    price: 3200
                },
                {
                    day: 3,
                    price: 5000
                },
                {
                    day: 7,
                    price: 10000
                },
                {
                    day: 10,
                    price: 12000
                },
                {
                    day: 22,
                    price: 22000
                },
            ]

            res.render('addRentRate', {
                car: car,
                rentRate: rentRate
            });
        }
    })

});
//showCars
app.get('/showCars',requireLogin, async (req,res)=>{
    const nowDate = new Date().toISOString();

    const allRent = await rentCar.find({returnDate: { $lte: nowDate }, status: 'approve'})

    const rentId = []
    const listIdCar = []

    allRent.map(item => {
        listIdCar.push(item.car)
    })

    allRent.map(item => {
        rentId.push(item._id)
    })

    console.log(allRent)

    console.log(listIdCar)

    if (listIdCar.length > 0) {
        await Car.updateMany({_id: {$in: listIdCar}}, {canRent: true, adminApprove: false})
        await rentCar.updateMany({_id: {$in: rentId}}, {status: 'timeout'})
    }

    await Car.find({})
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

app.get('/allChat', async (req, res) => {
    const receiver = req.session.passport.user
    const allChat = await Chat.find({$or: [{receiver: receiver}, {sender: receiver}]}).populate('sender')
    res.render('allChat', {
        allChat: allChat
    })
})

app.get('/openGoogleMap',(req,res)=>{
    res.render('googlemap');
});
// display one car info
app.get('/displayCar/:id',(req,res)=>{
    Car.findOne({_id:req.params.id}).then((car)=>{
        res.render('displayCar',{
            car:car
        });
    }).catch((err)=>{console.log(err)});
})
// open owner profile page
app.get('/contactOwner/:id',(req,res)=>{
    User.findOne({_id:req.params.id})
    .then((owner)=>{
        res.render('ownerProfile',{
            owner:owner
        })
    }).catch((err)=>{console.log(err)});
})
// socket connection
const server = http.createServer(app);
const io = socketIO(server);
// connect to client

io.on('connection',(socket)=>{
    console.log('Connected to Client');

    // handle chat room route
    app.get('/chatOwner/:id', (req,res)=>{
        const sender = req.session.passport.user
        const receiver = req.params.id

        Chat.findOne({sender:sender, receiver:receiver})
        .then((chat)=>{
            if(chat){
                chat.date = new Date(),
                chat.senderRead = false;
                chat.receiverRead = true;
                chat.save()
                .then((chat) =>{
                    res.redirect(`/chat/${chat._id}`);
                }).catch((err)=>{console.log(err)});
            }else{
                Chat.findOne({sender:receiver, receiver:sender})
                .then((chat)=>{
                    if (chat) {
                        chat.senderRead = true;
                        chat.receiverRead = false;
                        chat.date = new Date()
                        chat.save()
                        .then((chat) => {
                            res.redirect(`/chat/${chat._id}`);
                        }).catch((err)=>{console.log(err)});
                    }else {
                        const newChat = {
                            sender: sender,
                            receiver: receiver,
                            date: new Date()
                        }
                        new Chat(newChat).save().then((chat)=>{
                            res.redirect(`/chat/${chat._id}`);
                       }).catch((err)=>{console.log(err)});
                    } 
                }).catch((err) => {console.log(err)});
            }
        }).catch((err)=>{console.log(err)});
    });

    //Handle /chat/chat ID route

    app.get('/chat/:id',(req,res)=>{
        Chat.findOne({_id:req.params.id})
        .populate('sender')
        .populate('receiver')
        .populate('dialogue.sender')
        .populate('dialogue.receiver')
        .then((chat)=>{
            console.log(chat)
            res.render('chatRoom',{
                chat:chat
            })
        }).catch((err)=>{console.log(err)});
    })

    //Post request to /chat/ID
    app.post('/chat/:id',(req,res)=>{
        const sender = req.session.passport.user

        let image = ''

        if (req.body.image !== '') {
            image = `https://psu-carrental-app.s3.ap-southeast-1.amazonaws.com/${req.body.image}`
        }

        console.log(req.params.id)
        Chat.findOne({_id:req.params.id})
        .populate('sender')
        .populate('receiver')
        .then((chat)=>{
            const newDialogue = {
                sender: sender,
                image: image,
                date: new Date(),
                senderMessage: req.body.message
            }

            chat.dialogue.push(newDialogue)
            chat.save((err,chat)=>{
                if(err){
                    console.log(err);
                }
                if(chat){
                    Chat.findOne({_id:chat._id})
                    .populate('sender')
                    .populate('receiver')
                    .populate('dialogue.sender')
                    .populate('dialogue.receiver')
                    .then((chat)=>{
                        res.render('chatRoom', {chat:chat});
                    }).catch((err)=>{console.log(err)});
                }
            })
        }).catch((err)=> {console.log(err)});
    })

    //Listen to object ID event
    socket.on('ObjectID',(oneCar)=>{
        console.log('One Car ID is',oneCar);
        Car.findOne({
            owner:oneCar.userID,
            _id: oneCar.carID
    })
        .then((car)=>{
            socket.emit('car',car);
        });
    });
    // Find cars and send them to browser for map
    Car.find({}).populate('owner').then((cars)=>{
        socket.emit('allcars',{cars:cars});
    }).catch((err)=>{
        console.log(err);
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