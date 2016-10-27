module.exports.getTime = function(){
    var date = new Date();
    console.log(date.getHours())
    var time ={
        ts:date.getTime(),
        date:date,
        year:date.getFullYear(),
        month:date.getFullYear()+"-"+(date.getMonth()+1),
        day:date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate(),
        minute:date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+bushu(date.getHours(),2)+":"+bushu(date.getMinutes(),2)
    }

    //数字前面补0的函数
    function bushu(num,n){  //数字  需要几位
        var str=""+num//将数字转成字符串
        while(str.length<n){
            str="0"+str;
        }
        return str;
    }

    return time;
}