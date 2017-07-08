/**
 * Created by xiyin on 08/07/2017.
 */
rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,
    rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
    jQuery.fn = jQuery.prototype = {
        init: function (selector, context, rootjQuery) {
            var match, elem;
            // 处理: $(""), $(null), $(undefined), $(false)这些错误的
            if (!selector) {
                return this;
            }
            // 处理字符串
            if (typeof selector === "string") {
                if (selector.charAt(0) === "<" && selector.charAt(selector.length - 1) === ">" && selector.length >= 3) {
                    // 匹配标签$('<div>') $('<div></div>') $('<li>a</li><li>b</li>') $('<div></p>')
                    match = [null, selector, null];
                }
                else {
                    // 用正则检测参数selector是否是复杂的HTML片段（‘<div>aaa’）或#id
                    // 匹配结果存在match数组中
                    // $('#id') match = ['#id',null,'id']
                    match = rquickExpr.exec(selector);
                }
                // 匹配参数是单独标签$('div') 和符合正则表达式的复杂HTML片段 和id选择器 $('#id')
                if (match && (match[1] || !context)) {
                    // 进一步判断 match[1]存在，说明是标签$('<div>')创建标签
                    if (match[1]) {
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
                        jQuery.merge(this, jQuery.parseHTML(
                            match[1],
                            context && context.nodeType ? context.ownerDocument || context : document,
                            true
                        ));
                        /**
                         * 处理标签，并带有属性$(html, props) $('<div>',{title:"div",html:"div1"，id:"id"})
                         *  rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>|)$/ 匹配单标签$('<div>')$('<div></div>')
                         *  满足是单标签并且第二个参数是对象字面量
                         */
                        if (rsingleTag.test(match[1]) && jQuery.isPlainObject(context)) {
                            for (match in context) {
                                // 如果对象字面量中有对应的函数，则执行。比如：$().html();
                                if (jQuery.isFunction(this[match])) {
                                    this[match](context[match]);
                                    // 否则就给标签设置该属性，比如title，
                                } else {
                                    this.attr(match, context[match]);
                                }
                            }
                        }
                        return this;

                    }
                    // 参数是id,且未指定context 创建id $('#id')
                    // $('#id') match = ['#id',null,'id']
                    else {
                        // 找具有Id的属性
                        elem = document.getElementById(match[2]);
                        if (elem && elem.parentNode) {
                            // 检查parentNode属性，因为黑莓会返回已经不再文档中的DOM节点
                            // 在页面存在，必然存在它的父元素
                            this.length = 1;
                            this[0] = elem;
                        }
                        this.context = document;
                        this.selector = selector;
                        return this;
                    }

                }
                // 处理选择器表达式$('.div') $('ul li')使用复杂处理find()
                // $('ul',document).find('li')
                // $('ul',$(document))
                // rootjQuery:$(document)
                else if (!context || context.jquery) {
                    // 没有指定上下文 执行 rootjQuery.find(selector)
                    // 或指定了上下文，并判断上下文context.jquery是jquery对象 执行：context.find(selector)
                    return ( context || rootjQuery ).find(selector);
                    // 否则指定上下文，但上下文不是jQuery对象,则执行jQuery.find()
                } else {
                    return this.constructor(context).find(selector);
                }
            }
            /** 处理DOM节点: $(DOMElement)，h
             * 参数属性是DOM元素，有nodeType属性，Element为1，Text为3，Document为9
             */
            else if (selector.nodeType) {
                this.context = this[0] = selector;
                this.length = 1;
                return this;
            }
            //  $(function)，参数是函数，用于文档加载则认为是绑定ready事件
            // $(funtion(){})
            else if (jQuery.isFunction(selector)) {
                return rootjQuery.ready(selector);
            }
            // $($('div')) ->$('div')
            // 参数是jQuery对象，如果参数selector含有selector属性selector,则认为是jQuery对象
            if (selector.selector !== undefined) {
                this.selector = selector.selector;
                this.context = selector.context;
            }
            // 参数为任意其他类型值,类数组$({}),$([])
            return jQuery.makeArray(selector, this);
        }
    }
