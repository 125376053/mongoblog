
var mongoose=require('mongoose');
mongoose.connect("mongodb://localhost:27017/blog"); //mongod://ip+duankou+/shujuku
module.exports=mongoose;