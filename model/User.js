
var mongoose=require('../db');
var Schema=mongoose.Schema;//声明Schema
var ObjectId=Schema.ObjectId; //id实体

//定义Schema
var userSchema=new Schema({
    username:'string',
    password:'string',
    email:'string'
},{collection:'zcjUser'});

//定义模型
var userModel=mongoose.model('zcjUser',userSchema);

module.exports=userModel;