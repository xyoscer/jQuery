/**
 * Created by xiyin on 12/07/2017.
 */
/**
 * jQuery的静态属性和方法分析，他们是其他模块实现基础
 */
var _jQuery = window.jQuery;
var _$ = window.$;
var class2type = {};
jQuery.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
    class2type[ "[object " + name + "]" ] = name.toLowerCase();
});
jQuery.extend({
    // Unique for each copy of jQuery on the page
    expando: "jQuery" + ( core_version + Math.random() ).replace( /\D/g, "" ),
    // 用于释放jQuery对全局变量$的控制权
    noConflict: function( deep ) {
        // 释放$控制权
        if ( window.$ === jQuery ) {
            window.$ = _$;
        }
        // deep为true释放Jquery的控制权，给其它版本的jQuery
        if ( deep && window.jQuery === jQuery ) {
            window.jQuery = _jQuery;
        }
        return jQuery;
    },

    // Is the DOM ready to be used? Set to true once it occurs.
    isReady: false,

    // A counter to track how many items to wait for before
    // the ready event fires. See #6781
    readyWait: 1,

    // Hold (or release) the ready event
    holdReady: function( hold ) {
        if ( hold ) {
            jQuery.readyWait++;
        } else {
            jQuery.ready( true );
        }
    },

    // Handle when the DOM is ready
    ready: function( wait ) {

        // Abort if there are pending holds or we're already ready
        if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {
            return;
        }

        // Remember that the DOM is ready
        jQuery.isReady = true;

        // If a normal DOM Ready event fired, decrement, and wait if need be
        if ( wait !== true && --jQuery.readyWait > 0 ) {
            return;
        }

        // If there are functions bound, to execute
        readyList.resolveWith( document, [ jQuery ] );

        // Trigger any bound ready events
        if ( jQuery.fn.trigger ) {
            jQuery( document ).trigger("ready").off("ready");
        }
    },
    // 使用类型来判断是否是函数
    isFunction: function( obj ) {
        return jQuery.type(obj) === "function";
    },
  // 使用原生数组方法判断是否为数组
    isArray: Array.isArray,
   // 检测窗口的特征属性，该属性是对窗口自身的引用
    isWindow: function( obj ) {
        return obj != null && obj === obj.window;
    },
    // 用来检测参数是否是数字或者看起来像数字的
    isNumeric: function( obj ) {
        return !isNaN( parseFloat(obj) ) && isFinite( obj );
    },
    // 判断js类型
    type: function( obj ) {
        // 如果参数是undefined或null直接返回对应的字符串形式
        if ( obj == null ) {
            return String( obj );
        }
        return typeof obj === "object" || typeof obj === "function" ?
        class2type[ core_toString.call(obj) ] || "object" :
            typeof obj;
    },
    // 判断是否是纯粹的对象，即是否是对象字面量创建的对象，或者是new Object()创建的对象
    isPlainObject: function( obj ) {
        if ( jQuery.type( obj ) !== "object" || obj.nodeType || jQuery.isWindow( obj ) ) {
            return false;
        }
        // 检查对象是否由构造函数Object()创建,还是自定义构造函数创建，
        // 对象obj的原型对象中是否有isPrototypeOf属性，isPrototypeOf是Object原型对象的特有属性
        // 如果obj的原型对象上没有则说明不是Object()构造函数创建的对象而是自定义构造函数创建的对象
        try {
            if ( obj.constructor &&
                !core_hasOwn.call( obj.constructor.prototype, "isPrototypeOf" ) ) {
                return false;
            }
        } catch ( e ) {
            return false;
        }
        return true;
    },

    isEmptyObject: function( obj ) {
        var name;
        for ( name in obj ) {
            return false;
        }
        return true;
    },

    error: function( msg ) {
        throw new Error( msg );
    },

    // data: string of html
    // context (optional): If specified, the fragment will be created in this context, defaults to document
    // keepScripts (optional): If true, will include scripts passed in the html string
    parseHTML: function( data, context, keepScripts ) {
        if ( !data || typeof data !== "string" ) {
            return null;
        }
        if ( typeof context === "boolean" ) {
            keepScripts = context;
            context = false;
        }
        context = context || document;

        var parsed = rsingleTag.exec( data ),
            scripts = !keepScripts && [];

        // Single tag
        if ( parsed ) {
            return [ context.createElement( parsed[1] ) ];
        }

        parsed = jQuery.buildFragment( [ data ], context, scripts );

        if ( scripts ) {
            jQuery( scripts ).remove();
        }

        return jQuery.merge( [], parsed.childNodes );
    },

    parseJSON: JSON.parse,

    // Cross-browser xml parsing
    parseXML: function( data ) {
        var xml, tmp;
        if ( !data || typeof data !== "string" ) {
            return null;
        }

        // Support: IE9
        try {
            tmp = new DOMParser();
            xml = tmp.parseFromString( data , "text/xml" );
        } catch ( e ) {
            xml = undefined;
        }

        if ( !xml || xml.getElementsByTagName( "parsererror" ).length ) {
            jQuery.error( "Invalid XML: " + data );
        }
        return xml;
    },

    noop: function() {},

    // Evaluates a script in a global context
    globalEval: function( code ) {
        var script,
            indirect = eval;

        code = jQuery.trim( code );

        if ( code ) {
            // If the code includes a valid, prologue position
            // strict mode pragma, execute code by injecting a
            // script tag into the document.
            if ( code.indexOf("use strict") === 1 ) {
                script = document.createElement("script");
                script.text = code;
                document.head.appendChild( script ).parentNode.removeChild( script );
            } else {
                // Otherwise, avoid the DOM node creation, insertion
                // and removal by using an indirect global eval
                indirect( code );
            }
        }
    },

    // Convert dashed to camelCase; used by the css and data modules
    // Microsoft forgot to hump their vendor prefix (#9572)
    camelCase: function( string ) {
        return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
    },
    // 用来检测DOM节点的名称与指定值是否相等，检查时忽略大小写
    nodeName: function( elem, name ) {
        return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
    },

    // 用来遍历对象或者数组，类数组，args是 jQuery内部传参用的
    // 是数组的话（或者有length属性）通过下标遍历，是对象的话通过for-in遍历
    each: function( obj, callback, args ) {
        var value,
            i = 0,
            length = obj.length,
            isArray = isArraylike( obj );

        if ( args ) {
            //  内部使用使用apply调用回调函数，因为参数数量不确定
            if ( isArray ) {
                for ( ; i < length; i++ ) {
                    value = callback.apply( obj[ i ], args );
                    if ( value === false ) {
                        break;
                    }
                }
            } else {
                for ( i in obj ) {
                    value = callback.apply( obj[ i ], args );
                    if ( value === false ) {
                        break;
                    }
                }
            }


        } else {// 在外部使用，回调函数参数是固定的两个，就直接使用call
            if ( isArray ) {
                for ( ; i < length; i++ ) {
                    // 在回调函数如果 return false，就对后面的就不遍历，直接返回
                    value = callback.call( obj[ i ], i, obj[ i ] );
                    if ( value === false ) {
                        break;
                    }
                }
            } else {
                for ( i in obj ) {
                    value = callback.call( obj[ i ], i, obj[ i ] );
                    if ( value === false ) {
                        break;
                    }
                }
            }
        }

        return obj;
    },
    // 利用原生的trim()方法
    trim: function( text ) {
        return text == null ? "" : core_trim.call( text );
    },

    // 将一个类数组，或者是string 转换为真正的数组，results参数供内部使用
    // $.makeArray(123)
    makeArray: function( arr, results ) {
        var ret = results || [];
        if ( arr != null ) {
            // 首先判断arr是类数组，有length属性的  Object(string) 会把字符串转换为类数组
            // Object("123");String {0: "1", 1: "2", 2: "3", length: 3, [[PrimitiveValue]]: "123"}
            if ( isArraylike( Object(arr) ) ) {
                jQuery.merge( ret,
                    typeof arr === "string" ?
                        [ arr ] : arr
                );
            }
            // 是数组的话
            else {
                core_push.call( ret, arr );
            }
        }

        return ret;
    },

    inArray: function( elem, arr, i ) {
        return arr == null ? -1 : core_indexOf.call( arr, elem, i );
    },
    // 合并两个数组到第一个数组中
    // first 是数组或类数组对象(有length属性)，second，是数组。类数组对象或任何含有连续整型属性的对象
    merge: function( first, second ) {
        var l = second.length,
            i = first.length,
            j = 0;
        // 如果第二个参数lenght是数值型，则当数组处理
        if ( typeof l === "number" ) {
            for ( ; j < l; j++ ) {
                first[ i++ ] = second[ j ];
            }
        }  // 如果参数second没有length属性，或者length属性不是数字，则把它当做具有连续型整型属性的对象
        else {
            while ( second[j] !== undefined ) {
                first[ i++ ] = second[ j++ ];
            }
        }

        first.length = i;

        return first;
    },

    grep: function( elems, callback, inv ) {
        var retVal,
            ret = [],
            i = 0,
            length = elems.length;
        inv = !!inv;

        // Go through the array, only saving the items
        // that pass the validator function
        for ( ; i < length; i++ ) {
            retVal = !!callback( elems[ i ], i );
            if ( inv !== retVal ) {
                ret.push( elems[ i ] );
            }
        }

        return ret;
    },

    // 对数组或对象的，在每一个元素上执行回调函数，并将回调函数值放到一个新的数组中
    // 该方法用于获取或设置DOM元素集合的值
    map: function( elems, callback, arg ) {
        var value,
            i = 0,
            length = elems.length,
            isArray = isArraylike( elems ),
            ret = [];

        // Go through the array, translating each of the items to their
        if ( isArray ) {
            for ( ; i < length; i++ ) {
                value = callback( elems[ i ], i, arg );
                if ( value != null ) {
                    ret[ ret.length ] = value;
                }
            }

            // Go through every key on the object,
        } else {
            for ( i in elems ) {
                value = callback( elems[ i ], i, arg );
                if ( value != null ) {
                    ret[ ret.length ] = value;
                }
            }
        }
        // 不直接返回ret的原因，防止出现复合数组 如果对在map的回调函数中返回数组 ret就会变成[[1],[2],[3]]
        return core_concat.apply( [], ret );
    },

    // A global GUID counter for objects
    guid: 1,

    // Bind a function to a context, optionally partially applying any
    // arguments.
    proxy: function( fn, context ) {
        var tmp, args, proxy;

        if ( typeof context === "string" ) {
            tmp = fn[ context ];
            context = fn;
            fn = tmp;
        }

        // Quick check to determine if target is callable, in the spec
        // this throws a TypeError, but we will just return undefined.
        if ( !jQuery.isFunction( fn ) ) {
            return undefined;
        }

        // Simulated bind
        args = core_slice.call( arguments, 2 );
        proxy = function() {
            return fn.apply( context || this, args.concat( core_slice.call( arguments ) ) );
        };

        // Set the guid of unique handler to the same of original handler, so it can be removed
        proxy.guid = fn.guid = fn.guid || jQuery.guid++;

        return proxy;
    },

    // Multifunctional method to get and set values of a collection
    // The value/s can optionally be executed if it's a function
    access: function( elems, fn, key, value, chainable, emptyGet, raw ) {
        var i = 0,
            length = elems.length,
            bulk = key == null;

        // Sets many values
        if ( jQuery.type( key ) === "object" ) {
            chainable = true;
            for ( i in key ) {
                jQuery.access( elems, fn, i, key[i], true, emptyGet, raw );
            }

            // Sets one value
        } else if ( value !== undefined ) {
            chainable = true;

            if ( !jQuery.isFunction( value ) ) {
                raw = true;
            }

            if ( bulk ) {
                // Bulk operations run against the entire set
                if ( raw ) {
                    fn.call( elems, value );
                    fn = null;

                    // ...except when executing function values
                } else {
                    bulk = fn;
                    fn = function( elem, key, value ) {
                        return bulk.call( jQuery( elem ), value );
                    };
                }
            }

            if ( fn ) {
                for ( ; i < length; i++ ) {
                    fn( elems[i], key, raw ? value : value.call( elems[i], i, fn( elems[i], key ) ) );
                }
            }
        }

        return chainable ?
            elems :

            // Gets
            bulk ?
                fn.call( elems ) :
                length ? fn( elems[0], key ) : emptyGet;
    },

    now: Date.now,

    // A method for quickly swapping in/out CSS properties to get correct calculations.
    // Note: this method belongs to the css module but it's needed here for the support module.
    // If support gets modularized, this method should be moved back to the css module.
    swap: function( elem, options, callback, args ) {
        var ret, name,
            old = {};

        // Remember the old values, and insert the new ones
        for ( name in options ) {
            old[ name ] = elem.style[ name ];
            elem.style[ name ] = options[ name ];
        }

        ret = callback.apply( elem, args || [] );

        // Revert the old values
        for ( name in options ) {
            elem.style[ name ] = old[ name ];
        }

        return ret;
    }
});

function isArraylike( obj ) {
    var length = obj.length,
        type = jQuery.type( obj );

    if ( jQuery.isWindow( obj ) ) {
        return false;
    }

    if ( obj.nodeType === 1 && length ) {
        return true;
    }

    return type === "array" || type !== "function" &&
        ( length === 0 ||
        typeof length === "number" && length > 0 && ( length - 1 ) in obj );
}
