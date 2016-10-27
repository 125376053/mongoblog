
var mongoose=require('../db');
var Schema=mongoose.Schema;//声明Schema
var ObjectId=Schema.ObjectId; //id实体

//评论结构定义
var CommentSchema = new Schema({
    zcjId:{
        type:ObjectId,
        ref:'zcjUser'
    }, //关联另一个集合
    content:String,
    createTime:Object
});


//定义Schema
var articleSchema=new Schema({
    title:'string',
    content:'string',
    pv:Number,
    zcjId:{ //积淀查询 zcjUser中的id
        type:ObjectId,
        ref:'zcjUser'
    },
    createTime:Object, //对象类型
    updateTime:Object,
    tags:[], //标签数组类型
    comments:[CommentSchema] //评论
},{collection:'zcjArticle'});

//定义模型
var articleModel=mongoose.model('zcjArticle',articleSchema);

//导出模型
module.exports=articleModel;