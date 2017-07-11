/**
 * Created by like on 2017/7/3.
 */
var deepCopy = function (obj) {
    var str,newObj = obj.constructor === 'Array' ? []:{};
    if(typeof obj !== 'object'){
        return ;
    }else if(window.JSON) {
        var str = JSON.stringify(obj);
        newObj = JSON.parse(str);
        //缺点
        // 1.无法复制函数
        // 2.原型链没了，对象就是object，所属的类没了
    }else{
        for(var prop in obj){
            newObj[prop] = typeof obj[prop] === 'object' ? deepCopy(obj[prop]):obj[prop];
        }
    }
    return newObj;
}