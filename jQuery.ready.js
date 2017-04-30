/**
 * Created by XiYin on 2017/4/30.
 */
/**
 * 下面代码都是与ready事件有关的，从开始绑定ready事件监听函数到DOM加载完执行ready绑定的函数
 * DOM 触发的方式
 * （1）$(document).ready(function(){})
 * (2) $(function(){})
 * (3) $(document).on("ready",function(){})
 * ready（DOM加载完）事件的触发是早于load事件（页面所有资源加载完）
 * ready事件早于load事件的原因 .ready(function(){})在document对象上绑定了
 * iE9+和其他浏览器 DOMContentLoaded事件
 */
/**
 * 函数调用过程
 * （1）$(document).ready(function(){})/$(function(){}) 调用 rootjQuery.ready( selector )；
 * （2）rootjQuery.ready( selector ) 调用 jQuery().ready()
 * (3) jQuery().ready() 调用 jQuery.ready.promise().done( fn );
 *（4） jQuery.promise.done(fn)  调用 jQuery.ready()
 * (5) jQuery().ready 调用 readyList.resolveWith( document, [ jQuery ] );，若是on绑定的ready事件调用
 * jQuery( document ).trigger("ready").off("ready");
 */
(function(window,undefined){
    var  rootjQuery,  //只含有document对象的jQuery对象
        readyList,   // 存放ready事件的监听函数
        // ready事件的主监听函数自己移除方法
        completed = function() {
            // 确保监听的DOMContentLoaded或load只执行一次
            document.removeEventListener( "DOMContentLoaded", completed, false );
            window.removeEventListener( "load", completed, false );
            jQuery.ready();
        };
    jQuery.fn = jQuery.prototype = {
        init: function( selector, context, rootjQuery ) {
            if(typeof selector === "string"){}
            // ready函数的入口
            else if ( jQuery.isFunction( selector ) ) {
                return rootjQuery.ready( selector );
            }
        },
        // 绑定ready事件函数
        ready: function( fn ) {
            // Add the callback,创建一个延迟对象
            jQuery.ready.promise().done( fn );
            return this;
        },
    };
    jQuery.extend({
        isReady: false,
        readyWait: 1,
        // 用于延迟或恢复ready事件的触发，参数true为延迟，false为恢复
        // 用途，在动态加载脚本时使用（加载动态脚本为异步）所以等外部脚本加载完，在执行ready事件
        holdReady: function( hold ) {
            if ( hold ) {
                // 延迟，计数器++
                jQuery.readyWait++;
            } else {
                jQuery.ready( true );
            }
        },
        // 用于执行ready事件监听函数列表readyList，以及通过S(document).on('ready',function(){})绑定的事件
        ready: function( wait ) {
            // wait=true 恢复时，计数器--，直到0，ready()没有参数时，则判断isReady是否为true
            if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {
                return;
            }
            // 让DOM准备完毕
            jQuery.isReady = true;
            // 在ready事件正常触发
            if ( wait !== true && --jQuery.readyWait > 0 ) {
                return;
            }
            // ready事件已就绪，没有被延迟或延迟已经全部被恢复，则执行ready
            // 等价于 readyList.resolve() 有with是可以传参
            // document是指向ready事件监听函数的上下文，第一个参数[jQuery] 是jQuery函数
            readyList.resolveWith( document, [ jQuery ] );
            // 主动触发 $(document).on('ready',function(){})
            // 判断是否有主动触发
            if ( jQuery.fn.trigger ) {
                // 有，进行触发ready,触发完，然后取消这个ready事件
                jQuery( document ).trigger("ready").off("ready");
            }
        },
    });
    jQuery.ready.promise = function( obj ) {
        if ( !readyList ) {
            // 创建一个延迟对象
            readyList = jQuery.Deferred();
            // 判断DOM加载是否完成
            if ( document.readyState === "complete" ) {
                 // 加延迟是针对IE可能会提前触发
                setTimeout( jQuery.ready );
            } // DOM还没加载完，进行监测DOMDOMContentLoaded
            else {

                document.addEventListener( "DOMContentLoaded", completed, false );
               // 防止load会有缓存，一般是load慢于DONContentLoad
                window.addEventListener( "load", completed, false );
            }
        }

        // 确保延迟对象的状态不被修改
        return readyList.promise( obj );
    };
    rootjQuery = jQuery(document);
})(window);



