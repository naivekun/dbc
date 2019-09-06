var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var ejs = require('ejs');
var path = require('path');
var session = require('express-session');
var mysql = require('mysql');
var db = require('./lib/db.js');
var cookieParser = require('cookie-parser');
var captcha = require('svg-captcha');
var moment = require('moment');

app.use(cookieParser());
app.use(session({
    secret: 'lzdnbnbznbnbnbznbnbnbznb',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 30, secure: false
    }
}));
app.engine('html', ejs.__express);
app.use('/static', express.static('static'));
app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'html');
var pool = mysql.createPool(db.mysql);

// disabled for security issue: prototype pollution
// app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function (req, res) {
    

    res.render('index', {
        isLogin: false,
        msg: req.session.msg
    });
});

app.get('/admin',function(req,res){
    res.send("别看了，没后台<br><del>我懒得写</del>");
    return;
});

app.get('/captcha',function(req,res){
    var cap = captcha.createMathExpr({mathMin:2,mathMax:80,background:'#ffffff'});
    req.session.captcha = cap.text;
    res.type('svg');
    res.send(cap.data);
});

app.get('/start',function(req,res){
    res.redirect(302,'/')
});

app.post('/start',function(req,res){
    
    if(!req.body.name || !req.body.stuNo || !req.body.captcha)
    {
        req.session.msg="请填写所有表单";
        res.redirect(302,'/');
        return;
    }
    if(!req.session.captcha)
    {
        req.session.msg="Session中找不到验证码，请重试"
    }
    if(!verifyCaptcha(req,res))
    {
        req.session.msg="验证码错误";
        res.redirect(302,'/');
        return;
    }

    pool.getConnection(function(connErr,connection){
        connection.query(db.queryAllQuestion,function(queryErr,result){

        });
        connection.release();
    });

    res.render('start',{
        posts: [{title:"a",describe:"b"},{title:"aaaa",describe:'aaaa'}],
        isLogin: true,
        loginUsername: 'test'
    });
});

function verifyCaptcha(req,res){
    if(req.body.captcha) {
        if(req.body.captcha == req.session.captcha){
            delete req.session.captcha;
            return true;
        }
    }
    return false;
}



app.listen(80);
console.log(moment().format('YYYY-MM-DD HH:mm:ss'))
console.log("server is running");