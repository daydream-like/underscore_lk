/**
 * Created by like on 2017/7/1.
 */
(function () {
//整个函数在一个闭包中，避免全局变量，this === window,来改变函数的作用域，同时也方便压缩
    //创建一个root对象，在浏览器中为window（self）对象，在node中为global对象，用self代替window是为了支持web worker
    var root = typeof self == 'object' && self.self === self && self ||
            typeof  global === 'object' &&global.global === global && global ||
            this ;
    //保存_
    var previousUnderscore = root._;
    //原型赋值，便于压缩
    var ArrayProto = Array.prototype,
        ObjectProto = Object.prototype;
    //将内置对象原型的常用的方法赋值给引用变量，以便更加方便的引用
    var push = ArrayProto.push ,
        slice = ArrayProto.slice,
        toString = ObjectProto.toString,
        hasOwnProperty = ObjectProto.hasOwnProperty;
    //定义了一些ecma5的方法
    var nativeIsArray = Array.isArray,
        nativeKeys = Object.keys,
        nativeCreate = Object.create;
    //裸函数
    var cTor = function () {

    }
    //创建下划线对象
    var _ = function (obj) {
        // 如果在"_"的原型链上
        // (即_的prototype所指向的对象是否跟obj是同一个对象，
        // 要满足"==="的关系)
        if(obj instanceof _){
            return obj;
        }
        //如果不是，则构造一个
        if(!(this instanceof  _)){
            return new _(obj);
        }
        //将underscore对象存放在_.wrapped属性中
        this._wrapped = obj ;
    }
    //针对不同的宿主环境，将underscorede的命名变量存放在不同的对象中
    if(typeof exports !== 'undefined' && exports.nodeType){//nodejs
         if(typeof module != 'undefined' && !module.nodeType && module.exports){
             exports = module.exports = _;
         }
         exports._ = _;
    }else{
        //在浏览器环境下
        root._ = _;
    }
    //版本号
    _.VERSION = '1.8.3';
    //链式调用函数
    _.chain = function (obj) {
        var instance = _(obj);
        //是否使用链式调用
        instance.chain = true ;
        return instance;
    }
    // 返回_.chain里是否调用的结果,
    // 如果为true, 则返回一个被包装的Underscore对象,
    // 否则返回对象本身
    var chainResult = function (instance,obj) {
        return instance._chain ? _(obj).chain():obj;
    }
    //用于扩展underscore自身的接口函数
    _.mixin = function (obj) {
        //通过循环便利对象来浅拷贝对象属性
        _.each(_.functions(obj),function (name) {
            var func = _[name] = obj[name];
            _.prototype[name] = function () {
                var args = [this._wrapped];
                push.apply(args,arguments);
                return chainResult(this,func.apply(_,args));
            }
        })
    }
    _.mixin(_);
    //将Array。prototype中的相关方法添加到underscore对象中,这样underscore对象也可以直接
    //调用Array。prototype中的方法
    _.each(['pop','push','reverse','shift','sort','splice','unshift'],function (name) {
        //方法引用
        var method  = ArrayProto[name];
        _.prototype[name] = function () {
            //赋值obj引用变量方便调用
            var obj = this._wrapped;
            //调用Array对应的方法
            method.apply(obj,arguments);
            if((name === 'shift' || name === 'splice') && obj.length === 0){
                delete obj[0];
                return chainResult(this,obj);//支持链式调用
            }
        }
    })
    //同上，并且支持链式调用
    _.each(['concat','join','slice'],function (name) {
        var method = ArrayProto[name];
        _.prototype[name] = function () {
            //返回Array对象或者封装后的Array对象
            return chainResult(this,method.apply(this._wrapped,arguments))
        }
    })
    //返回存放在_wrapped属性中的underscore对象
    _.prototype.value = function () {
        return this._wrapped;
    }
    //提供一些方法方便其他情况使用
    _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;
    _.prototype.toString = function () {
        return ''+this._wrapped;
    }
    //对AMD支持的一些处理
    if(typeof  define === 'function' && define.amd){
        define('underscore',[],function () {
            return _;
        });
     //判断是不是函数
        if(typeof /./ != 'function' && typeof Int8Array != 'object'){
            _.isFunction = function (obj) {
                return typeof obj == 'function' || false ;
            }
        }
        //检查其参数是否是无穷大。
        _.isFinite = function (obj) {
            return isFinite(obj) && !isNaN(parseFloat(obj));
        }
        //检查是不是boolean
        _.isBoolean = function (obj) {
            return obj === true || obj === false || toString.call(obj) === '[object Boolean]';

        }
        //判读对象是否为空
        _.isNull = function () {
            return obj === null;
        }
        //判读是否为undefined
        _.isUndefined = function (obj) {
            return obj === void 0;
        }
        //检查对象中是否有给定的属性
        _.has = function (obj,key) {
            return obj !== null && hasOwnProperty.call(obj,key);
        }
        //解决冲突函数
        _.noConflict = function () {
            root._ = previousUnderscore;
            return this ;
        }
        //返回与传入参数相等的值f(x) = x
        _.identity = function (value) {
            return value;
        }
        //创建一个函数，这个函数返回的值用来做_.constant的参数
        _.constant = function (value) {
            return function () {
                return value ;
            }
        }
        //返回undefined,不论传递给他是什么参数，用他做默认可选的回调参数
        _.noop = function () {

        }
        //返回一个函数，这个函数可以返回任何传入对象的key属性
        _.property = function (value) {
            return function (obj) {
                return obj === null ? void 0: obj[value];
            }
        }
        //和_.property相反。需要一个对象，并返回一个函数,这个函数将返回一个提供的属性的值。
        _.prototypeOf = function (obj) {
           return obj === null?function(){}:function (key) {
               return obj[key];
           }
        }
        //类似于 extend, 但只复制自己的属性覆盖到目标对象。（愚人码头注：不包括继承过来的属性）
        var createAssigner = function (keysFunc,undefinedOnly) {
            return function (obj) {
                var length = arguments.length;
                if(length<2 || obj == null ){
                    return obj ;
                }
                for(var index = 1 ;index <length ;index++){
                    var source = arguments[index],
                        keys = keysFunc(source),
                        l = keys.length;
                    for(var i = 0 ;i< l;i++){
                        var key = keys[i];
                        if(!undefinedOnly||obj[key] === void 0){
                            obj[key] = source[key];
                        }
                    }
                }
                return obj;
            }
        }
        //枚举bug ie<9
        var hasEnumBug = !{toString:null}.propertyIsEnumerable('toString');
        var noEnumerableProps = ['valueOf','isPrototype','toString','prototypeIsEnumerable','hasOwnProperty','toLocaleString'];
        function collectNonEnumProps(obj,keys) {
            var noEnumIdx = noEnumerableProps.length;
            var constructor = obj.constructor;
            var proto = (_.isFunction(constructor)&& constructor.prototype)||ObjectProto;
            //
            var prop = 'constructor';
            if(_.has(obj,proto)&&!_.contains(keys,prop)){
             keys.push(prop);
            }
            while(noEnumIdx--){
                prop = noEnumerableProps[noEnumIdx];
                if(prop in obj && obj[prop] !== proto[prop] && !_.contains(keys,prop)){
                    keys.push(prop);
                }
            }
        }
        //检索object拥有的和继承的所有属性的名称。
        _.allKeys = function (obj) {
            if(!_.isObject(obj)){
                return [];
            }
            var keys = [];
            for(var key in obj ){
                keys.push(key);
            }
            //IE<9
            if(hasEnumBug){

            }
        }
        _.extendOwn = function () {
            
        }
    }
}).call(this);