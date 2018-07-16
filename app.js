// 导入模块--------------------------------------
let express=require('express');
//导入svg-captcha 验证码
let svgCaptcha=require('svg-captcha');
//导入path模块 内置模块
let path=require('path');
// 导入session 模块
let session=require("express-session");
// 导入body-parser 格式化表单的数据
let bodyParser=require('body-parser');
// 导入mongoDb数据库
const MongoClient =require('mongodb').MongoClient;
//  mongodb需要使用的配置 数据库连接地址 和操作的库名
const url = 'mongodb://localhost:27017';
// 库名
const dbName='SZHM19';
// 创建服务
let app=express();
//设置 托管静态资源 static是方法,括号里的是文件夹
app.use(express.static('static'));
// 使用session中间件
// 每个路由的req对象中 增加session这个属性
// 每个路由中多了 一个可以访问到的session属性  可以在它身上保存需要共享的属性
// 使用中间 件时,把必须的参数带上,可选的参数可以不用带
// js中的对象有个特点,支持动态添加属性
app.use(session({
    secret: 'keyboard cat'
}))
// 使用body-parser中间件 处理用post上传body中的数据
app.use(bodyParser.urlencoded({
    extended:false
}))
// 路由1 --------------------------------- 
// 使用get 方法,访问登陆页面时,直接读取登录页面并返回
app.get('/login',(req,res)=>{
    res.sendFile(path.join(__dirname,'static/views/login.html'));
    // 打印一下session 
    console.log(req.session);
    //req.session.userInfo="你来登录页啦";

})
//路由2 
//使用post 提交数据过来 验证用户登陆
app.post('/login',(req,res)=>{
    // 获取form表单提交的数据
    // 接收数据
    // 比较数据
    let userName=req.body.userName;
    let userPass=req.body.userPass;
    //接收用户输入的验证码
    let code=req.body.code;
    console.log(code);
    // 和session中的验证码进行比较
    if(code==req.session.captcha){
        //console.log('验证码正确');
        // 如果验证码正确 则设置session保存用户登录所提交的信息
        req.session.userInfo={
            userName,
            userPass
        }
        // 如果验证用户登陆通过以后则跳到首页
        res.redirect('/index');
    }else{
        //console.log('失败');
        // 如果失败的话则需要打回登陆页,考虑到用户体验,可以
        // 先给用户一个提示信息
        res.setHeader('content-type','text/html');
        res.send('<script>alert("验证码失败");window.location.href="/login"</script>')
    }

})
// 路由3
// 生成图片的功能
//把这个地址设置给登录页的图片的src属性
app.get('/login/captchaImg',(req,res)=>{
    //生成了一张图片 并返回
    var captcha=svgCaptcha.create();
    // 打印验证码
    console.log(captcha.text);
    //console.log(req.session.userInfo);
    // 保存验证码的值到session 方便后续的使用
    // 为了比较时简单 直接转为小写
    req.session.captcha=captcha.text.toLocaleLowerCase();
    res.type('svg');
    res.status(200).send(captcha.data);
})
//路由4 访问首页 index
app.get('/index',(req,res)=>{
    //  有 session 则首页返回
    // 如果session里面 有东西则说明用户登录了,则读取文件给用户看
    if(req.session.userInfo){
        // 登录了
        res.sendFile(path.join(__dirname,'static/views/index.html'));
    }else{
        // 没有session,则去登录页登录
        res.setHeader('content-type','text/html');
        res.send("<script>alert('请登录');window.location.href='/login'</script>")
    }
})
// 路由5 登出操作 删除session的值即可
app.get('/logout',(req,res)=>{
    // 删除session中 的userinfo;
    delete req.session.userInfo;
    // 再去登录页即可
    res.redirect('/login');
})
//路由6 展示注册页面
app.get('/register',(req,res)=>{
    // 直接读取并返回注册页
    res.sendFile(path.join(__dirname,'static/views/register.html'));
})
//路由7 
app.post('/register',(req,res)=>{
    // 获取用户的数据
    let userName=req.body.username;
    let userPass=req.body.userpass;
    console.log(userName);
    console.log(userPass);
    //连接上数据库
    MongoClient.connect(url,{useNewUrlParser: true},(err,client)=>{
        //连接上MONGO之后,选中使用的库
        const db=client.db(dbName);
        // 选择使用的集合
        let collection=db.collection('userList');
        // 查询数据
        collection.find({
            userName
        }).toArray((err,doc)=>{
            console.log(doc);
            if(doc.length==0){
                // 没有人 则新增数据
                collection.insertOne({
                    userName,userPass
                },(err,result)=>{
                    console.log(err);
                    // 注册成功了则去登录页
                    res.setHeader('content-type','text/html');
                    res.send("<script>alert('欢迎入坑');window.location.href='/login'</script>");
                    // 关闭数据库连接即可 关闭数据库要在最后一个回调函数中,不能提前关闭数据库
                    client.close();
                })
            }
        })
    })

})
// 开启监听
app.listen(8888,'127.0.0.1',()=>{
    console.log("监听成功");
})
