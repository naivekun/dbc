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

var allQuestions = [];

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
    if (req.session.baseInfoOk) {
        res.redirect(302, '/start');
        return;
    }

    res.render('index', {
        isLogin: false,
        msg: req.session.msg
    });
    delete req.session.msg;
});

app.post('/', function (req, res) {
    if (req.session.baseInfoOk) {
        res.redirect(302, '/start');
        return;
    }
    if (!req.body.name || !req.body.stuNo || !req.body.captcha) {
        req.session.msg = "请填写所有表单";
        res.redirect(302, '/');
        return;
    }
    if (!req.session.captcha) {
        req.session.msg = "Session中找不到验证码，请重试"
        res.redirect(302, '/');
        return;
    }
    if (!verifyCaptcha(req, res)) {
        req.session.msg = "验证码错误";
        res.redirect(302, '/');
        return;
    }

    pool.getConnection(function (connErr, connection) {
        connection.query(db.queryIfUserExist, [req.body.name, req.body.stuNo], function (err1, result1) {
            if (result1.length > 0 && result1[0]['ansJson']) {
                req.session.msg = "你已经填过了";
                res.redirect(302, '/');
                return;
            }

            connection.query(db.insertUserBaseInfo, [req.body.name, req.body.stuNo], function (err2, result2) {
                if(!err2)
                {
                    req.session.baseInfoOk=1;
                    req.session.name = req.body.name;
                    req.session.stuNo = req.body.stuNo;
                    res.redirect(302,'/start');
                }
            });

        });

        connection.release();
    });

});

app.get('/admin', function (req, res) {
    //todo: add a backend with OTP
    if(!req.query.password || req.query.password !== "lyjnbnbznb@123")
    {
        res.end("wrong password");
        return;
    }

    req.session.isAdmin = "no_proto";
    pool.getConnection(function(err,conn1){
        conn1.query(db.queryAllResult,function(err1,result1){
            res.render('admin',{
                isLogin: true,
                loginUsername: "admin",
                records: result1
            });
        });

    });
    return;
});

app.get('/admin/result',function(req,res){
    if(req.session.isAdmin !== "no_proto")
    {
        res.redirect(302,'/');
        return;
    }
    if(!req.query.id)
    {
        res.end();
        return;
    }

    pool.getConnection(function(err1,conn1){
        conn1.query(db.queryUserResultById,[req.query.id.toString()],function(err2,result1){
            userResults=Array();
            userAns = JSON.parse(result1[0]['ansJson']);

            conn1.query(db.queryAllQuestion,function(err,result2){
                result2.forEach(function(question){
                    userResult = {}; 
                    userResult.ansType = question.ansType;
                    if(question["ansType"] === 1)
                    {
                        userResult["ans"]=userAns['radio_'+question.id];
                    }
                    else if(question["ansType"] === 2)
                    {
                        userResult["ans"]=userAns['checkbox_'+question.id];
                    }
                    else if(question["ansType"] === 3)
                    {
                        userResult["ans"]=userAns['textans_'+question.id];
                    }
                    userResult["title"] = question.title;
                    userResult["content"] = question.content;
                    userResult["choice"] = question.ans;
                    userResults.push([userResult]);
 
                });
                res.render('result',{
                    isLogin: true,
                    loginUsername: "admin",
                    results: userResults
                });

            });

            
        });
    });
});

app.get('/captcha', function (req, res) {
    var cap = captcha.createMathExpr({ mathMin: 2, mathMax: 80, background: '#ffffff' });
    req.session.captcha = cap.text;
    res.type('svg');
    res.send(cap.data);
});

app.get('/start', function (req, res) {
    if(!req.session.baseInfoOk)
    {
        res.redirect(302,'/');
        return;
    }
    
    res.render('start', {
        posts: allQuestions,
        isLogin: true,
        loginUsername: req.body.name
    });
;
});

app.post('/start', function (req,res){
    if(!req.session.baseInfoOk)
    {
        res.redirect(302,'/');
        return;
    }

    var userAns = {};
    for(let [key,value] of Object.entries(req.body))
    {
        userAns[key]=value;
    }

    pool.getConnection(function(connErr,conn){
        conn.query(db.insertUserQuestionResult,[JSON.stringify(userAns),req.session.name,req.session.stuNo],function(queryErr,result1){
            return;
        });
    });

    req.session.allOk = 1;
    delete req.session.baseInfoOk; //prevent multiple submit
    res.redirect(302,'/complete');
});

app.get('/complete',function(req,res){
    if(!req.session.name)
    {
        res.redirect(302,'/');
        return;
    }
    if(req.session.allOk)
    {
        res.render('complete',{
            isLogin: true,
            loginUsername: req.session.name
        });
    }
    req.session.destroy(function(err){});
});

function verifyCaptcha(req, res) {
    // return true; //debug
    if (req.body.captcha) {
        if (req.body.captcha == req.session.captcha) {
            delete req.session.captcha;
            return true;
        }
    }
    return false;
}

pool.getConnection(function (connErr, connection) {
    connection.query(db.queryAllQuestion, function (err2, result3) {
        allQuestions = result3;
    });
    connection.release();
});


app.listen(80);
console.log(moment().format('YYYY-MM-DD HH:mm:ss'))
console.log("server is running");