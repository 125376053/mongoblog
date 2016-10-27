var express = require('express');
var router = express.Router();

var Article=require('../model/Article.js');
var utils=require('../util/DateUtil.js');
var markdown = require('markdown').markdown;

//保护链接 未登录不允许访问的指定链接 在需要保护的路由请求中加入checkLogin()
function checkLogin(req,res,next){
    if(req.session.zcj){
        next();
    }else{
        req.flash('error','用户未登录!');
        return res.redirect('/users/login');
    }
}

router.get('/add',checkLogin,function(req, res, next) {
    res.render('article/add',{
        title:'发表文章',
        cmd:'add', //一个页面2种不同路由的配置 add表示这里是添加文章页面
        article:{} //给个空值是避免报错
    })
});

router.post('/add',checkLogin,function(req, res, next) {

    var zcj=req.session.zcj;
    //console.log(zcj)
    var title=req.body.title;
    var content=req.body.content;
    var ts=utils.getTime();
    var tags=[req.body.tag1,req.body.tag2,req.body.tag3]

    //数据存储
    var article=new Article({
        title:title,
        content:content,
        zcjId:zcj._id,
        createTime:ts,
        updateTime:ts,
        tags:tags
    })

    article.save(function(err,article){
        if(err){
            req.flash('error',err);
            return res.redirect('back');
        }else{
            console.log(article)
            req.flash('success','发布文章成功');
            return res.redirect('/');
        }
    })
});


router.get('/list/:pageNum/:pageSize', function(req, res, next) {

    //第几页
    var pageNum=req.params.pageNum && req.params.pageNum > 0 ? req.params.pageNum:1;  //1
    //每页条数
    var pageSize=req.params.pageSize && req.params.pageSize > 0 ? req.params.pageSize:2; //2

    //搜索
    var query={};
    //处理搜索按钮
    var searchBtn=req.query.searchBtn;
    if(searchBtn){
        req.session.keyword=req.query.keyword;
    }
    if(req.session.keyword){
        var pattern=new RegExp(req.session.keyword,'i');
        query['title']=pattern; //全文匹配搜索  搜索的是查找到文章的title字段
    }

    Article.count(query,function(err,count){
        //console.log(count);
        //exec是指开启一个子线程去执行查询
        Article.find(query).sort({createTime:-1}).skip((pageNum-1)*pageSize)
            .limit(pageSize).populate('zcjId').exec(function(err,articles){
                if(err)
                    console.log(err);
                else{
                    //console.log(articles);
                    var totalPage=Math.ceil( count/pageSize ); //有多少页
                    res.render('index',{
                        title:'主页',
                        pageNum:pageNum,
                        pageSize:pageSize,
                        totalPage:totalPage,
                        articles:articles,  //这里的articles是所有的文章记录
                        flag:true
                    })
                }
        });
    })
});


//查看当前用户信息
router.get('/view/:articleId',checkLogin, function(req, res, next) {
    //根据路径参数的id值 区别是哪个文章点进来的
    Article.findOne({_id:req.params.articleId}).populate('zcjId').populate('comments.zcjId').exec(function(err,article){

        //查看的时候以markdown格式显示内容
        article.content = markdown.toHTML(article.content);

        //查看更新pv统计值
        Article.update({_id:req.params.articleId},{$inc:{"pv":1}},function(err){})

        res.render('article/view',{
            article:article //与路径参数对应的那篇文章的信息
        })
    })
});


//删除
router.get('/delete/:articleId',function(req,res){
    Article.findOne({_id:req.params.articleId}).exec(function(err,article){
        Article.remove({_id:req.params.articleId},function(){
            res.redirect('/');
        });
    })
})

//编辑文章
router.get('/edit/:articleId',function(req,res){
    Article.findOne({_id:req.params.articleId}).populate('zcjId').exec(function(err,article){
        //console.log(article)
        res.render('article/add',{
            title:'发表文章',
            cmd:'edit', //一个页面2种不同路由的配置 add表示这里是添加文章页面
            article:article //给个空值是避免报错
        })
    })
})

//编辑后保存------更新   发布时间 和内容
router.post('/edit',function(req,res){
    var ts=utils.getTime();
    var article=new Article({
        title:req.body.title,
        content:req.body.content,
        updateTime:ts
    })

    //console.log(req.body._id);    //获取隐藏域input的value 也是根据name获取
    //console.log(req.body.content);//获取textarea的内容 根据name可以获取

    Article.update(
        {_id:req.body._id},
        {$set:{
            title:req.body.title,
            content:req.body.content,
            updateTime:ts
        }},
        function(err,article){
            if(err){
                req.flash('error',err);
                return res.redirect('back');
            }else{
                req.flash('success','更新文章成功');
                res.redirect('/article/view/'+req.body._id);
            }
        });
})

//查询该作者其他文章
router.get('/u/:zcjId',function(req,res){
    Article.count({zcjId:req.params.zcjId},function(err,count){
        Article.find({zcjId:req.params.zcjId}).sort({createTime:-1})
                .populate('zcjId').exec(function(err,articles){
            if(err)
                console.log(err);
            else{
                res.render('index',{
                    title:'主页',
                    articles:articles,  //这里的articles是所有的文章记录
                    flag:false,
                    count:count
                })
            }
        })
    })
})

var formidable=require('formidable'); //专门处理图片上传的
var uuid=require('uuid'); //生成绝对不重复的字符串
var path=require('path');
var fs=require('fs');

//上传图片
router.get('/upload', function(req, res, next) {
    res.render('article/upload');
});

router.post('/upload',function(req,res){
    new formidable.IncomingForm().parse(req,function(err,fields,files){//错误对象,正常input字段,文件类对象
        //files 默认会把文件存放在别的地方而且不能改 所以要通过程序修改

        //console.log(files.uploadFile.name); //上传后图片的名字   uploadFile是name的名字
        //console.log(files.uploadFile.path); //上传后图片的默认地址

        var filename=uuid.v4()+path.extname(files.uploadFile.name);//不重复字符串+图片后缀名

        //以流的方式读取文件内容 然后灌输到 public/upload下面 文件名现在是filename
        fs.createReadStream(files.uploadFile.path).pipe(fs.createWriteStream('../public/upload/'+filename))

        //把文件名发送给客户端 ajax data数据 ret
        res.end(filename);
    })
})


//增加评论--------comments字段不需要查询就有值 原因是查询文章的时候 已经对这个字段进行查询了
router.post('/addComment',function(req,res){

    Article.update({_id:req.body._id},{$push:{comments:{
            zcjId:req.body.zcjId,
            content:req.body.content,
            createTime:utils.getTime().minute
    }}}).exec(function(err,ret){
        if(err){
            req.flash('error',err);
            return res.redirect('back');
        }else{
            req.flash('success','增加评论成功');
            res.redirect('/article/view/'+req.body._id);
        }
    })
})

//删除评论
router.get('/deleteComment/:articleId/:commentId',function(req,res){

    var articleId=req.params.articleId;
    var commentId=req.params.commentId;

    Article.update({_id:articleId},{$pop:{comments:{_id:commentId}}},function(err,ret){
        if(err){
            req.flash('error',err);
            return res.redirect('back');
        }else{
            req.flash('success','删除评论成功');
            res.redirect('/article/view/'+articleId);
        }
    })
})


//标签
router.get('/tags',function(req,res,next){
    Article.distinct('tags',function(err,tags){ //distinct查看一个数组里面唯一的值 查看数组里不重复的值
        if(err){
            next(err);
        }else{
            res.render('article/tags',{
                tags:tags,
                title:'标签页'
            })
        }
    })
})

//查看标签检索的页面
router.get('/tags/:tag',function(req,res,next){

    Article.count({tags:req.params.tag},function(err,count){
        Article.find({tags:req.params.tag}).sort({'createTime.minute':-1}).populate('zcjId').exec(function(err,articles){
            //console.log(articles)
            if(err)
                next(err);
            else{
                res.render('index',{
                    title:"主页",
                    count:count,
                    articles:articles
                });
            }
        })
    })

})


//友情链接
router.get('/links',function(req,res,next){
    res.render('article/links',{
        title:'友情链接'
    })
})

module.exports = router;
