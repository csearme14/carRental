//load modules
const express = require('express');
const exphbs = require('express-handlebars');
const mongoose = require('mongoose');
//init app
const app = express();
//load Files
const keys = require('./config/keys');
const User = require('./moderls/user');
//connect to mongoDB
mongoose.connect(keys.MongoDB,{
    userNewUrlParser: true
},() => {
    console.log('MongoDB is connected ..')
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
app.get('/signup',(req,res) =>{
    res.render('signupForm',{
        tital:'Register'
    });
});
app.listen(port,() => {
    console.log(`Server is up on port ${port}`);
});