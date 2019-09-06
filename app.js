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
    var isLogin = checkLogin(req, res);
    if (isLogin) {
        var loginUsername = req.session.username;
    }

    res.render('index', {
        isLogin: isLogin,
        loginUsername: loginUsername,
        isIndexPage: true,
        isChallengePage: false,
        isRankPage: false,
        isFlagPage: false
    });
});

app.get('/admin',function(req,res){
    res.send("别看了，没后台<br><del>我懒得写</del>");
    return;
});

app.get('/captcha',function(req,res){
    var cap = captcha.createMathExpr({mathMin:2,mathMax:80});
    req.session.captcha = cap.text;
    res.type('svg');
    res.send(cap.data);
});

function verifyCaptcha(req,res,page){
    if(!req.session.captcha){
        res.render(page,{
            isLogin: false,
            isIndexPage: false,
            isChallengePage: false,
            isFlagPage: false,
            isRankPage: false,
            Message: "session中找不到验证码，请刷新页面"
        });
        return false;
    }
    if(req.body.captcha) {
        if(req.body.captcha == req.session.captcha){
            delete req.session.captcha;
            return true;
        }
    }
    res.render(page,{
        isLogin: false,
        isIndexPage: false,
        isChallengePage: false,
        isFlagPage: false,
        isRankPage: false,
        Message: "验证码错误"
    });
    return false;
}



app.listen(80);
console.log(moment().format('YYYY-MM-DD HH:mm:ss'))
console.log("server is running");