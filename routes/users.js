var express = require('express');
var router = express.Router();

var User=require('../model/User.js');
var crypto=require('crypto');

router.get('/reg', function(req, res, next) {
    res.render('users/reg',{
        title:'welcome' //全局配置模板变量后 这里可以不设置
    })
});

router.post('/reg', function(req, res, next) {
    //数据接收
    var username=req.body.username;
    var password=req.body.password;
    var password2=req.body.password2;
    var email=req.body.email;

    //数据校验
    if(!username){
        req.flash('error','用户名不能为空')
        return res.redirect('back'); //加return表示不再往下执行 不加return 会执行到下一个跳转就报错了
    }

    if(!password || password!=password2){
        req.flash('error','密码不能为空')
        return res.redirect('back');
    }

    //数据加密
    var md5=crypto.createHash('md5');
    password=md5.update(password).digest('hex');

    //数据存储
    var user=new User({
        username:username,
        password:password,
        email:email
    })

    //保存之前先查找当前用户名是否存在  username字段 username用户输入的值
    User.findOne({username:username},function(err,zcj){
        if(err){
            req.flash('error','保存到数据库出错')
            return res.redirect('back');
        }else{
            console.log(zcj) //null 因为查询之前还没保存用户名呢
            if(zcj){
                //用户名存在
                req.flash('error','用户名已经存在');
                return res.redirect('back');
            }else{
                //用户名不存在进行保存
                user.save(function(err,zcj){
                    if(err){
                        req.flash('error','注册失败');
                        return res.redirect('back');
                    }else{
                        //保存数据的时候将其放到session里面 用以判断用户是否登录
                        //登录后 session有值 退出后清空session
                        //渲染模板的时候将其对应到res.locals上面 就可以判断是否有值

                        //注册成功后能否自动登录 全看session里面有没有zcj这个值
                        //如果注册的时候 不把其保存到session里面 就不会自动登录
                        //之所以自动登录是在模板中判断了是否有zcj值存在
                        req.session.zcj=zcj;
                        req.flash('success','注册成功');
                        return res.redirect('/');
                    }
                })

            }
        }
    })

});


router.get('/login', function(req, res, next) {
    res.render('users/login',{
        title:'welcome' //全局配置模板变量后 这里可以不设置
    })
});

router.post('/login', function(req, res, next) {
    //数据接收
    var username=req.body.username;
    var password=req.body.password;

    //数据加密
    var md5=crypto.createHash('md5');
    password=md5.update(password).digest('hex');

    //登录校验用户名
    User.findOne({username:username},function(err,zcj){
        if(err){
            req.flash('error','查询出错')
            return res.redirect('back');
        }else{
            console.log('222'+zcj)
            if(zcj){
                //用户名存在
                //密码不对
                if(zcj.password!=password){
                    req.flash('error','密码出错')
                    return res.redirect('back');
                }else{
                    req.session.zcj=zcj;//用户信息保存到session里面
                    req.flash('success','登录成功');
                    return res.redirect('/');
                }
            }else{
                //用户名不存在
                req.flash('error','用户名不存在，请重新输入')
                return res.redirect('back');
            }
        }
    })

});

router.get('/logout', function(req, res, next) {
    req.session.zcj=null;//用户信息保存到session里面
    req.flash('success','退出成功');
    return res.redirect('/');
});

module.exports = router;
