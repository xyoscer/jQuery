/**
 * Created by XiYin on 2017/4/30.
 */
/**
 * 该方法用于编写插件和处理函数参数，用于合并两个或多个对象的属性到第一个对象主要有三个功能
 * （1）jQuery.extned()参数只有一个，且是对象自面量，则属于扩展插件
 * （2）jQuery.extend(),参数有多个，表示后面的对象都是扩展到第一个对象上
 * （3）jQuery.extend(),第一个参数是boolean值，true为深拷贝，false为浅拷贝，默认为浅拷贝,拷贝继承
 * @type {jQuery.extend}
 */
jQuery.extend = jQuery.fn.extend = function() {

    /** 定义一堆变量
     *  options 指向某个源对象。name 表示某个源对象的某个属性名，src 表示目标对象的某个属性的原始值
     *  copy 表示某个源对象的某个属性的值 copyIsArray 表示变量copy是否是数组
     *  clone 表示深度复值时，原始值的修正值 ，target 表示目标对象
     *  i 源对象的起始下标 length 表示参数的个数，用于修正变量target
     *  deep 表示是否执行深度复制，默认为false
    */
    var options, name, src, copy, copyIsArray, clone,
        target = arguments[0] || {},
        i = 1,
        length = arguments.length,
        deep = false;

    // 处理深度复制
    // 第一个参数是布尔值，则修正第一个参数为deep，第二个参数为目标对象
    if ( typeof target === "boolean" ) {
        deep = target;
        target = arguments[1] || {};
        // 设置源对象从第三个参数开始
        i = 2;
    }

    // 如果目标对象不是对象，不是函数，则用空对象代替
    // 因为在基本类型值上设置属性是无效的
    if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
        target = {};
    }

    // i表示源对象开始的下标，length表示参数的个数，若是两个相等，则表示没有源对象
    // 这时将jQuery或jQuety.fn作为目标对象 i--,使得传入的参数当做源对象
    if ( length === i ) {
        target = this;
        --i;
    }

    // 遍历源对象，有多个源对象
    for ( ; i < length; i++ ) {
        // 只有源对象不是undefined ，null 才继续往下执行
        if ( (options = arguments[ i ]) != null ) {
            // 对单个源对象开始遍历属性
            for ( name in options ) {
                src = target[ name ]; // 获取目标对象对应属性的原始值
                copy = options[ name ];// 获得源对象对应属性的复制值

                // var obj = {} obj.name = "11";
                // $.extend(true,obj,{name:obj})  这种情况会出现循环引用，为了避免深度复制进入死循环，因此，不会覆盖目标对象的同名属性
                if ( target === copy ) {
                    continue; // 跳出本次循环
                }

                // 进行深度复制，复制值是对象或者数组，则递归合并
                // jQuery.isPlainObject(obj)判断对象是否是对象直接量{},或new Object()创建的对象
                if ( deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)) ) ) {
                    if ( copyIsArray ) {
                        copyIsArray = false;
                        // copy此时为数组，则进一步判断此时的原始值src.是否为数组，若不是数组，则修正为【】
                        clone = src && jQuery.isArray(src) ? src : [];

                    } else {
                        // copy此时是对象，则进一步判断此时的原始值src,是否是对象，若不是对象，则修正为{}
                        // 若目标对象此时对应的属性值就是个对象，则把该对象复制给clone,这样继承属性就不会不该原来的对象
                        // 比如：var obj1 = {person: {name:"xy"}};
                        // var obj2 = {person:{age:"20",job:"FE"}}; $.extend(true,obj1,obj2);
                        //  此时的obj1 = {person:{name:"xy",age:"20",job:"FE"}}
                        clone = src && jQuery.isPlainObject(src) ? src : {};
                    }

                    // 把复制值copy合并到原始值副本的clone中，然后覆盖目标对象的同名属性
                    target[ name ] = jQuery.extend( deep, clone, copy );

                    // 如果不是深度复制，并且copy 不等于undefined，则直接覆盖目标对象的同名属性，进行浅拷贝
                } else if ( copy !== undefined ) {
                    target[ name ] = copy;
                }
            }
        }
    }

    // 返回修改后的目标对象
    return target;
};