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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

function requireLogin(req, res) {
    var sess = req.session;
    var isLogin = !!sess.username;
    if (!isLogin) {
        res.redirect(302, '/login');
        return true;
    }
    return false;
}

function checkLogin(req, res) {
    var sess = req.session;
    var isLogin = !!sess.username;
    return isLogin;
}

function logOut(req, res) {
    var sess = req.session;
    sess.username = null;
}

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

app.get('/login', function (req, res) {
    var sess = req.session;
    var isLogin = !!sess.username;

    if (isLogin) {
        res.redirect(302, '/');
        return;
    }

    res.render('login', {
        isLogin: false,
        isIndexPage: false,
        isChallengePage: false,
        isFlagPage: false,
        isRankPage: false,
        Message: null
    });
});

app.post('/login', function (req, res) {
    var sess = req.session;
    var isLogin = !!sess.username;
    if (isLogin) {
        res.redirect(302, '/');
        return;
    }

    if(!verifyCaptcha(req,res,'login')){
        return;
    }

    pool.getConnection(function (err, connection) {
        connection.query(db.queryUserWithPassword, [req.body.username, req.body.password], function (err, result) {
            connection.release();
            if (result.length > 0) {
                req.session.username = req.body.username;
                req.session.save();
                res.redirect(302, '/');
                return;
            } else {
                res.render('login', {
                    isLogin: false,
                    isIndexPage: false,
                    isChallengePage: false,
                    isFlagPage: false,
                    isRankPage: false,
                    Message: '用户名或密码错误'
                });
            }
        });
    });
});

app.get('/logout', function (req, res) {
    logOut(req, res);
    res.redirect(302, '/');
});

app.get('/register', function (req, res) {
    var sess = req.session;
    var isLogin = !!sess.username;
    if (isLogin) {
        res.redirect(302, '/');
        return;
    }

    

    res.render('register', {
        isLogin: false,
        isIndexPage: false,
        isChallengePage: false,
        isFlagPage: false,
        isRankPage: false,
        Message: null
    });
});

app.post('/register', function (req, res) {

    var sess = req.session;
    var isLogin = !!sess.username;
    if (isLogin) {
        res.redirect(302, '/');
        return;
    }

    if(!verifyCaptcha(req,res,'register')){
        return;
    }

    var username = req.body.username;
    var password1 = req.body.password1;
    var password2 = req.body.password2;
    if (password1 != password2) {
        res.render('register', {
            isLogin: false,
            isIndexPage: false,
            isChallengePage: false,
            isFlagPage: false,
            isRankPage: false,
            Message: "两次输入的密码不一致"
        });
        return;
    }
    var password = password1;
    pool.getConnection(function (err, connection) {
        connection.query(db.queryUsername, [username], function (err, result) {
            
            if (result.length > 0) {
                res.render('register', {
                    isLogin: false,
                    isIndexPage: false,
                    isChallengePage: false,
                    isFlagPage: false,
                    isRankPage: false,
                    Message: "用户名已存在"
                });
            } else {
                connection.query(db.insertUser, [username, password, req.connection.remoteAddress,req.body.stuId], function (err, result) {
                    res.render('register', {
                        isLogin: false,
                        isIndexPage: false,
                        isChallengePage: false,
                        isFlagPage: false,
                        isRankPage: false,
                        Message: "注册成功"
                    });
                });
            }
            
        });
        connection.release();
    });
});

app.get('/challenge', function (req, res) {
    if (requireLogin(req, res)) {
        return;
    }
    var loginUsername = req.session.username;

    pool.getConnection(function (err, connection) {
        connection.query(db.queryAllChallenge, function (err, result) {
            connection.release();

            res.render('challenge', {
                isLogin: true,
                isIndexPage: false,
                isChallengePage: true,
                isFlagPage: false,
                isRankPage: false,
                loginUsername: loginUsername,
                posts: result
            });
        });
    });
});

app.get('/flag', function (req, res) {
    if (requireLogin(req, res)) {
        return;
    };
    var loginUsername = req.session.username;
    res.render('flag', {
        isLogin: true,
        loginUsername: loginUsername,
        isIndexPage: false,
        isChallengePage: false,
        isFlagPage: true,
        isRankPage: false,
        Message: null
    });
});

function retFlagQuery(req, res, msg) {
    res.render('flag', {
        isLogin: true,
        loginUsername: req.session.username,
        isIndexPage: false,
        isChallengePage: false,
        isFlagPage: true,
        isRankPage: false,
        Message: msg
    });
}

app.post('/flag', function (req, res) {
    if (requireLogin(req, res)) {
        return;
    };
    var loginUsername = req.session.username;
    if(!verifyCaptcha(req,res,'flag')){
        return;
    }
    if (!req.body.flag) {
        retFlagQuery(req, res, "没有提交flag");
        return
    }

    pool.getConnection(function (err, connection) {
        connection.query(db.queryFlag, [req.body.flag], function (err, result) {
            /*
            {
                id: 1,
                title: 'test',
                author: 'naivekun',
                describe: '测试',
                url: 'http://baidu.com',
                flag: 'flag{test}',
                score: 100
            }
            */
            if (!result || result.length == 0) {
                connection.query(db.insertFlagSubmitHistory, [loginUsername, req.body.flag, 0,(moment().format('YYYY-MM-DD HH:mm:ss'))], function (err, result_nothing) {});
                retFlagQuery(req, res, "错误的flag");
                return;
            }
            connection.query(db.insertFlagSubmitHistory, [loginUsername, req.body.flag, 1, (moment().format('YYYY-MM-DD HH:mm:ss'))], function (err, result_nothing2) { });

            if (result.length > 0) {   // is a correct flag
                connection.query(db.queryIdByUser, [loginUsername], function (err, result2) { //get user id
                    var userId = result2[0];
                    connection.query(db.queryOKFlagSubmitHistory, [loginUsername, result[0].id], function (err, result3) {  // check if correct flag is dup
                        if (result3.length > 0) {
                            retFlagQuery(req, res, "flag正确，但是你已经提交过了");
                            return;
                        }
                        connection.query(db.insertOKFlagSubmitHistory, [loginUsername, result[0].id,(moment().format('YYYY-MM-DD HH:mm:ss'))], function (err, result4) { });  // insert correct flag submit record
                        connection.query(db.addScore,[result[0].score,loginUsername],function(err,result){});
                        retFlagQuery(req, res, "flag正确");
                    });
                });
            }
        });
        connection.release();
    });
});

app.get('/rank',function(req,res){
    if (requireLogin(req, res)) {
        return;
    };
    var loginUsername = req.session.username;
    pool.getConnection(function(err,connection){
        connection.query(db.queryIdByUser,[loginUsername],function(err,result){
            var userId = result[0];
            var records = [];
            connection.query(db.getRank,function(err,result2){
                var rankCnt = 1;
                result2.forEach(function(rec){
                    records = records.concat([{
                        rank: rankCnt,
                        username: rec.username,
                        score: rec.score,
                        isSelf: loginUsername==rec.username?1:0
                    }]);
                    rankCnt++;
                });
                res.render('rank',{
                    records: records,
                    isLogin: true,
                    loginUsername: req.session.username,
                    isIndexPage: false,
                    isChallengePage: false,
                    isFlagPage: false,
                    isRankPage: true
                });
            }); 
            
        });

        connection.release();
    });

});

app.get('/profile',function(req,res){
    if (requireLogin(req,res)) {
        return;
    }
    var loginUsername = req.session.username;
    res.render('profile',{
        isLogin: true,
        loginUsername: loginUsername,
        isIndexPage: false,
        isChallengePage: false,
        isFlagPage: false,
        isRankPage: false,
        Message: null
    });
});

app.post('/profile',function(req,res){
    if (requireLogin(req,res)) {
        return;
    }
    var loginUsername = req.session.username;
    var oldPassword = req.body.oldPassword;
    var password1 = req.body.password1;
    var password2 = req.body.password2;
    if (password1 != password2) {
        res.render('profile', {
            isLogin: true,
            loginUsername: loginUsername,
            isIndexPage: false,
            isChallengePage: false,
            isFlagPage: false,
            isRankPage: false,
            Message: "两次输入的密码不一致"
        });
        return;
    }

    pool.getConnection(function(err,connection){
        var oldPasswordIsOk = false;
        connection.query(db.queryUserWithPassword,[loginUsername,oldPassword],function(err,result){
            console.log([loginUsername,oldPassword]);
            console.log(result);
            console.log(err);
            if(result.length>0){
                oldPasswordIsOk = true;
            }
            if(!oldPasswordIsOk) {
                res.render('profile', {
                    isLogin: true,
                    loginUsername: loginUsername,
                    isIndexPage: false,
                    isChallengePage: false,
                    isFlagPage: false,
                    isRankPage: false,
                    Message: "旧密码错误"
                });
                return;
            }
            connection.query(db.updatePassword,[password1,loginUsername],function(err,result){
                res.render('profile', {
                    isLogin: true,
                    loginUsername: loginUsername,
                    isIndexPage: false,
                    isChallengePage: false,
                    isFlagPage: false,
                    isRankPage: false,
                    Message: "密码修改成功"
                });
                return;
            });
        });

        
        connection.release();
    });
});

app.listen(80);
console.log(moment().format('YYYY-MM-DD HH:mm:ss'))
console.log("server is running");