/**
 * Created by XiYin on 2017/4/29.
 */

// 在构造函数的内部用new运算符创建并返回另一个构造函数的实例
jQuery = function( selector, context ) {
    // The jQuery object is actually just the init constructor 'enhanced'
    return new jQuery.fn.init( selector, context, rootjQuery );
}

/**jQuery对象模块的原型属性和方法***/
jQuery.fn = jQuery.prototype = {
    // The current version of jQuery being used
    jquery: core_version,
    constructor: jQuery,
    init: function( selector, context, rootjQuery ) {
        var match, elem;
        // 处理: $(""), $(null), $(undefined), $(false)这些错误的
        if ( !selector ) {
            return this;
        }
        // 处理字符串
        if ( typeof selector === "string" ) {
            if ( selector.charAt(0) === "<" && selector.charAt( selector.length - 1 ) === ">" && selector.length >= 3 ) {
                 // 匹配标签$('<div>') $('<li>a</li><li>b</li>') $('<div></p>')
                // Assume that strings that start and end with <> are HTML and skip the regex check
                match = [ null, selector, null ];

            } else {
                // 用正则检测参数selector是否是复杂的HTML片段（‘<div>aaa’）或#id
                // 匹配结果存在match数组中
                // rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/
                // exec()方法返回一个数组并更新正则表达式对象的属性。
                // 返回的数组具有匹配的文本作为第一项，然后匹配的每个捕获括号的一个项包含捕获的文本。
                // $('#id') match = ['#id',null,'id'],$('abc<div>') match = ['abc<div>','<div>',null]
                match = rquickExpr.exec( selector );
            }

            // 匹配参数是单独标签$('div')跟id $('#id')
            if ( match && (match[1] || !context) ) {
                // 进一步判断 match[1]存在，说明是标签$('<div>')创建标签
                if ( match[1] ) {
                    // 判断上下文，该第二个参数只是document,$(document),在当前页创建
                    context = context instanceof jQuery ? context[0] : context;
                    /**
                     * jQuery.parseHTML()，返回一个HTML标签数组
                     * 第一个参数是:字符串,第二个参数：指定根节点，第三个参数：true/false,来确保script是否要添进来，
                     * true是可以添加。
                     * $('<li>1</li><li>2</li>') 解析为{'li','li'}
                     */
                    /**
                     * jQuery.merge()合并两个数组，也可以合并类数组具有length属性
                     * this = {
                     *   0: 'li',
                     *   1: 'li',
                     *   lemgth: 2
                     * };
                     */
                    jQuery.merge( this, jQuery.parseHTML(
                        match[1],
                        context && context.nodeType ? context.ownerDocument || context : document,
                        true
                    ) );
                    /**
                     * 处理标签，并带有属性$(html, props) $('<div>',{title:"div",html:"div1"，id:"id"})
                     *  rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>|)$/ 匹配单标签$('<div>')$('<div></div>')
                     *  满足是单标签并且第二个参数是对象字面量
                     */
                    if ( rsingleTag.test( match[1] ) && jQuery.isPlainObject( context ) ) {
                        for ( match in context ) {
                            // 如果对象字面量中有对应的函数，则执行。比如：$().html();
                            if ( jQuery.isFunction( this[ match ] ) ) {
                                this[ match ]( context[ match ] );
                                // 否则就给标签设置该属性，比如title，
                            } else {
                                this.attr( match, context[ match ] );
                            }
                        }
                    }
                    return this;
                    // 参数是id,且未指定context 创建id $('#id')
                    // $('#id') match = ['#id',null,'id']
                } else {
                    // 找具有Id的属性
                    elem = document.getElementById( match[2] );
                    // 黑莓中有bug Check parentNode to catch when Blackberry 4.6 returns
                    // nodes that are no longer in the document #6963
                    if ( elem && elem.parentNode ) {
                        // 检查parentNode属性，因为黑莓会返回已经不再文档中的DOM节点
                        // 在页面存在，必然存在它的父元素
                        this.length = 1;
                        this[0] = elem;
                    }
                    this.context = document;
                    this.selector = selector;
                    return this;
                }
                // 处理选择器表达式$('.div') $('ul li')使用复杂处理find()
                // $('ul',document).find('li')
                // $('ul',$(document))
                // rootjQuery:$(document)
            } else if ( !context || context.jquery ) {
                // 没有指定上下文 执行 rootjQuery.find(selector)
                // 或指定了上下文，并判断上下文context.jquery是jquery对象 执行：context.find(selector)
                return ( context || rootjQuery ).find( selector );
             // 否则指定上下文，但上下文不是jQuery对象,则执行jQuery.find()
            } else {
                return this.constructor( context ).find( selector );
            }

        /** 处理DOM节点: $(DOMElement)，
         * 参数属性是DOM元素，有nodeType属性，Element为1，Text为3，Document为9
         */
        } else if ( selector.nodeType ) {
            this.context = this[0] = selector;
            this.length = 1;
            return this;
        //  $(function)，参数是函数，用于文档加载则认为是绑定ready事件
            // $(funtion(){})与$(document).ready(function(){})相同
        } else if ( jQuery.isFunction( selector ) ) {
            return rootjQuery.ready( selector );
        }
        // $($('div')) ->$('div')
        // 参数是jQuery对象，如果参数selector含有selector属性selector,则认为是jQuery对象
        if ( selector.selector !== undefined ) {
            this.selector = selector.selector;
            this.context = selector.context;
        }
        // 参数为任意其他类型值,类数组$({}),$([])
        return jQuery.makeArray( selector, this );
    },

    // Start with an empty selector
    selector: "",
    // The default length of a jQuery object is 0
    length: 0,
    // 使用slice方法将类数组转换为数组
    toArray: function() {
        return core_slice.call( this );
    },
    /**
     * 如果没有参数，则返回包含所有元素的数组
     * 若有参数num,则返回一个单独的元素
     *支持负数，负数表示从元素集合末尾开始计算，使用lenghth+num重新计算下标，
     * 在使用【】获取指定位置的元素
     */
    get: function( num ) {
        return num == null ? this.toArray() :
            ( num < 0 ? this[ this.length + num ] : this[ num ] );
    },

    /** Take an array of elements and push it onto the stack
     * 构建一个新的jQuery对象并入栈，新对象位于栈顶
     * @param elems
     * @returns {returning the new matched element set}
     */
    pushStack: function( elems ) {

        // 把参数elems合并到jQuery对象中
        var ret = jQuery.merge( this.constructor(), elems );
        // 在对象ret上设置属性prevObject，指向当前的jQuery对象，从而形成一个链式栈
        ret.prevObject = this;
        // 在对象ret上设置属性context,指向当前jQuery对象的上下文
        ret.context = this.context;
        // Return the newly-formed element set
        return ret;
    },

    /**
     *  遍历当前jQuery对象，并在每一个元素上执行回调函数，
     *  回调函数是在当前元素为上下文的语境中触发的，this指向当前元素
     * @param callback
     * @param args 这个参数是内部使用
     * @returns {对象}
     */
    each: function( callback, args ) {
        // 调用静态方法.each()实现, 用于遍历对象和数组，对数组以及类数组使用下标遍历，对于对象使用属性名遍历
        return jQuery.each( this, callback, args );
    },

    /**
     * 绑定ready事件
     * jQuery().ready()->jQuery.ready.promise().done(fn)->jQuery.ready()->readyList.resolveWith( document, [ jQuery ] );
     * @param fn
     * @returns {jQuery}
     */

    ready: function( fn ) {
        // Add the callback
        jQuery.ready.promise().done( fn );
        return this;
    },
    /**
     * 使用数组方法slice()从当前对象获取指定范围的子集
     * 在调用pushStack()把子集转换为jQuety对象，并入栈保留对当前子集的引用
     * @returns {*}
     */
    slice: function() {
        return this.pushStack( core_slice.apply( this, arguments ) );
    },
    /**
     * 返回匹配元素集合的第一个元素
     * 通过调用.eq()实现
     * @returns {*}
     */
    first: function() {
        return this.eq( 0 );
    },
    /**
     * 返回匹配元素集合的最后一个元素
     * 通过调用.eq()实现
     * @returns {*}
     */
    last: function() {
        return this.eq( -1 );
    },
    /**
     * 返回匹配元素集合的某一个指定位置的元素
     * @returns {*}
     */
    eq: function( i ) {
        var len = this.length,
            // 使用三目运算符确定j的位置
            j = +i + ( i < 0 ? len : 0 );
         // 调用pushStack()，把该下选中的对象元素入栈
        return this.pushStack( j >= 0 && j < len ? [ this[j] ] : [] );
    },
    /**
     * 遍历的当前jQuery对象，对每个元素上执行回调函数，
     * 并将回调函数的返回值放入一个jQuery()对象
     * 调用工具方法jQuery.map(),this指向当前元素
     * @param callback
     * @returns {*}
     */
    map: function( callback ) {
        return this.pushStack( jQuery.map(this, function( elem, i ) {
            // 回调函数返回一个独立的数据项或者数据项数组，将返回值（不是null,undefined）插入结果集中
            return callback.call( elem, i, elem );
        }));
    },
    /**
     * 作为回溯可以找到栈的下一层，相当于出栈
     * 如果下一层对象不存在，则构建一个空的jQuery对象返回。
     * @returns {jQuery|*}
     */
    end: function() {
        return this.prevObject || this.constructor(null);
    },

    // For internal use only.
    // Behaves like an Array's method, not like a jQuery method.
    push: core_push,
    sort: [].sort,
    splice: [].splice
};
/// 用构造函数的原型覆盖构造函数返回值的实例的原型对象,
// 从而使返回的jquery实例对象可以访问jQuery原型上的属性和方法
jQuery.fn.init.prototype = jQuery.fn;