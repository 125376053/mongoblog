var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var session=require('express-session');
var flash=require('connect-flash');//保存到session里面  这个东西依赖于session 必须和session同时使用
var mongoStore=require('connect-mongo')(session);

var routes = require('./routes/index');
var users = require('./routes/users');
var article = require('./routes/article');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//将session存储到数据库中 重启服务器session不会丢失
app.use(session({
    secret:'zcj',
    resave:false,
    saveUninitialized:false,
    cookie:{
        maxAge:1000*60*60
    },
    //session存储到数据库 服务器关闭也不到导致客户端改变转态
    store:new mongoStore({
        db:'blog',
        host:'127.0.0.1',
        port:27017
    })
}))

app.use(flash());

//配置全局ejs变量  如果模板或者模块中重写了变量 则用模块或者模板中定义的 如果没有声明 则用此处默认的
//注意异步的问题  这里不能放在路由中间件使用函数之后 一定要放在之前
//如果模块中未声明变量 但是模板中使用了变量 则会去查找res.locals
app.use(function(req,res,next){
    res.locals.error=req.flash('error').toString()||'';
    res.locals.title='welcome';
    res.locals.success=req.flash('success').toString()||'';
    res.locals.articles='';
    //将数据存储到session里面 session里面又保存在locals里面 为了模板渲染的需要
    //如果没有这个模板中用到的时候就会报错
    res.locals.zcj=req.session.zcj;
    //req.session.zcj=zcj 将数据库的东西保存到session中 然后模板中的zcj=session中的zcj
    //结果数据库中的zcj session中的zcj 模板中的zcj就是一回事了

    res.locals.flag="";
    res.locals.count =0;
    res.locals.pageNum= 0;
    res.locals.pageSize= 0;
    res.locals.totalPage= 0;
    res.locals.keyword='';
    next();
})

//路由配置一般放在错误处理函数之前 也就是入口文件的倒数第二个位置
app.use('/', routes);
app.use('/users', users);
app.use('/article',article);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
