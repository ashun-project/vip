const path = require('path');
const bodyParser = require('body-parser');
const cookie = require('cookie-parser');
const express = require('express');
const app = express();
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const identityKey = 'skey';
const mysql = require('mysql');
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'ashun666',
    database: 'user'
});

app.use(cookie());
app.use(session({
    // resave: false, // 是指每次请求都重新设置session cookie，假设你的cookie是6000毫秒过期，每次请求都会再设置6000毫秒
    // saveUninitialized: false, // 是指无论有没有session cookie，每次请求都设置个session cookie
    // // store: new FileStore(), // 本地存储session（文本文件，也可以选择其他store，比如redis的）
    // secret: '123456', //  加密
    // name: identityKey, //这里的name值得是cookie的name，默认cookie的name是：connect.sid
    // cookie: {
    //     maxAge: 16000
    // }, //设置maxAge是80000ms，即80s后session和相应的cookie失效过期
    resave: true, // 是指每次请求都重新设置session cookie，假设你的cookie是6000毫秒过期，每次请求都会再设置6000毫秒
    saveUninitialized: false, // 是指无论有没有session cookie，每次请求都设置个session cookie 
    secret: '123456', //  加密
    name: 'testapp', //这里的name值得是cookie的name，默认cookie的name是：connect.sid
    cookie: {
        maxAge: 16000
    }, //设置maxAge是80000ms，即80s后session和相应的cookie失效过期
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(express.static(path.resolve(__dirname, './static')));
function vaidParams(userName, password) {
    var error = '';
    if (!userName || !password) {
        error = '用户或密码不能为空';
    }
    if (userName.length > 12 || password.length > 12) {
        error = '用户或密码不可超过12位';
    }
    if (userName.length < 3 || password.length < 3) {
        error = '用户或密码不可小于3位';
    }
    return error;
}

// 接口
app.post('/vdidLogin', function (req, res, next) {
    if (req.session.loginUser) {
        res.json(req.session.loginUser);
    } else {
        res.json({error: 'no'});
    }
});

app.post('/register', function (req, res) {
    var userName = req.body.userName? req.body.userName.replace(/(^\s*)|(\s*$)/g, "") : '';
    var err = vaidParams(userName, req.body.password);
    var sql = 'SELECT * FROM list where userName = "'+ userName + '"';
    var sql2 = "INSERT INTO list(userName, password) VALUES (?, ?)";
    if (err) {
        res.json({error: err});
        return;
    }
    pool.getConnection(function (err, conn) {
        if (err) console.log("POOL register==> " + err);
        conn.query(sql, function (err, result) {
            if (err) {
                console.log('register - ', err.message);
                res.json({error: '系统出错请重新操作'});
                conn.release();
            } else {
                if (!result[0]) {
                    conn.query(sql2, [userName, req.body.password], function (err1, result1) {
                        if (err1) {
                            console.log('register1- ', err1.message);
                            res.json({error: '系统出错请重新操作'});
                        }  else {
                            // req.session.regenerate(function (err) {
                            //     if (err) {
                            //         return res.json({error: '登录失败' });
                            //     }
                            //     req.session.loginUser = {userName: userName};
                            //     res.json({userName: userName});
                            // });
                            req.session.loginUser = {userName: userName};
                            res.json({userName: userName});
                        }
                        conn.release();
                    });
                } else {
                    res.json({error: '用户已存在'});
                    conn.release();
                }
            }
        });
    });
});

app.post('/login', function (req, res, next) {
    // 获取所有列表
    var userName = req.body.userName? req.body.userName.replace(/(^\s*)|(\s*$)/g, "") : '';
    var err = vaidParams(userName, req.body.password);
    var sql = 'SELECT * FROM list where userName = "'+ userName + '"';
    if (err) {
        res.json({error: err});
        return;
    }
    pool.getConnection(function (err, conn) {
        if (err) console.log("POOL login==> " + err);
        conn.query(sql, function (err, result) {
            if (err) {
                console.log('login--', err.message);
                res.json({error: '系统出错请重新操作'});
            } else {
                if (result.length) {
                    if (req.body.password === result[0].password) {
                        // req.session.regenerate(function (err) {
                        //     if (err) {
                        //         res.json({error: '登录失败' });
                        //     } else {
                        //         delete result[0].password;
                        //         req.session.loginUser = result[0];
                        //         res.json(result[0]);
                        //     }
                        // });
                        delete result[0].password;
                        req.session.loginUser = result[0];
                        res.json(result[0]);
                    } else {
                        res.json({error: '用户或密码不正确'});
                    }
                } else {
                    res.json({error: '用户不存在'});
                }
            }
            conn.release();
        });
    });
    // if (req.body.name === myUser.userName && req.body.password === myUser.password) {
    //     user = true;
    // }
    // if (user) {
    //     req.session.regenerate(function (err) {
    //         if (err) {
    //             return res.json({ ret_code: 2, ret_msg: '登录失败' });
    //         }
    //         req.session.loginUser = '123456';
    //         res.json({ ret_code: 0, ret_msg: '登录成功' });
    //     });
    // } else {
    //     res.json({ ret_code: 1, ret_msg: '账号或密码错误' });
    // }
});

// 退出登录
app.post('/logout', function (req, res, next) {
    // 备注：这里用的 session-file-store 在destroy 方法里，并没有销毁cookie
    // 所以客户端的 cookie 还是存在，导致的问题 --> 退出登陆后，服务端检测到cookie
    // 然后去查找对应的 session 文件，报错
    // session-file-store 本身的bug  

    req.session.destroy(function (err) {
        if (err) {
            res.json({ error: '退出登录失败' });
            return;
        }
        req.session.loginUser = null;
        res.clearCookie(identityKey);
        res.json({success:'退出成功'});
    });
});

app.listen(8899);
