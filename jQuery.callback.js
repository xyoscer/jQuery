/**
 * Created by XiYin on 2017/5/1.
 */
// String to Object options format cache
var optionsCache = {};
var  core_rnotwhite = /\S+/g;
//  处理回调函数的字符串参数
function createOptions( options ) {
    // 设置缓存为空，将变量object与optionCache[options]指向同一个空对象
    // 方便后面为object添加属性时，同时也就给optionsCache[options]添加了属性，就不必最后把object对象再赋给optionsCache
    var object = optionsCache[ options ] = {};
    // 取出非空格的字符["once","memeory"] object={once:true,memeory:true}
    // 此时optionsCache = {"once memory":{once:true,memeory:true}}
    jQuery.each( options.match( core_rnotwhite ) || [], function( _, flag ) {
        object[ flag ] = true;
    });
    return object;
}

/* Callbacks()的参数，可以是下面的单个参数，也可以是几个组合,以空格隔开的字符产，比如"once memory"
 * Possible options:
 *
 *	once:确保回调函数列表只能被触发一次，作用于fire()
 *	memory:（记忆）作用在add()函数中，记录上一次触发回调函数列表时的参数，之后添加的任何回调函数都将用记录的参数值立即调用
 *	unique:（去重）确保一个回调函数只能被添加一次，回调函数列表中没有重复值。也是作用于add()中 *
 *	stopOnFalse:当某个回调函数返回false时，中断执行，作用于for循环中
 *
 */
jQuery.Callbacks = function( options ) {

    // 判断参数是否合法，是字符串的进行处理，不是字符串的，比如没有参数，options为空时
    // typeof options为undefined,返回这个空字符串。 jQuery.extend( {}, options )
    // 参数正常，先在缓存中查找，没有的话，再给缓存添加这个属性
    options = typeof options === "string" ?
        ( optionsCache[ options ] || createOptions( options ) ) :
        jQuery.extend( {}, options );

    var // Last fire value (for non-forgettable lists)
        memory,
        // Flag to know if list was already fired
        fired,
        // Flag to know if list is currently firing
        firing,
        // First callback to fire (used internally by add and fireWith)
        firingStart,
        // End of the loop when firing
        firingLength,
        // Index of currently firing callback (modified by remove if needed)
        firingIndex,
        // Actual callback list
        list = [],
        // Stack of fire calls for repeatable lists
        stack = !options.once && [],
        // Fire callbacks
        fire = function( data ) {
            memory = options.memory && data;
            fired = true;
            firingIndex = firingStart || 0;
            firingStart = 0;
            firingLength = list.length;
            firing = true;
            for ( ; list && firingIndex < firingLength; firingIndex++ ) {
                if ( list[ firingIndex ].apply( data[ 0 ], data[ 1 ] ) === false && options.stopOnFalse ) {
                    memory = false; // To prevent further calls using add
                    break;
                }
            }
            firing = false;
            if ( list ) {
                if ( stack ) {
                    if ( stack.length ) {
                        fire( stack.shift() );
                    }
                } else if ( memory ) {
                    list = [];
                } else {
                    self.disable();
                }
            }
        },
        // Actual Callbacks object
        self = {
            // 给list[]数组中添加回调函数
            add: function() {
                if ( list ) {
                    // First, we save the current length
                    var start = list.length;
                    (function add( args ) {
                        jQuery.each( args, function( _, arg ) {
                            var type = jQuery.type( arg );
                            if ( type === "function" ) {
                                if ( !options.unique || !self.has( arg ) ) {
                                    list.push( arg );
                                }
                            } else if ( arg && arg.length && type !== "string" ) {
                                // 参数不是函数，可能是数组时，递归调用，将递归add
                                add( arg );
                            }
                        });
                    })( arguments );
                    // Do we need to add the callbacks to the
                    // current firing batch?
                    if ( firing ) {
                        firingLength = list.length;
                        // With memory, if we're not firing then
                        // we should call right away
                    } else if ( memory ) {
                        firingStart = start;
                        fire( memory );
                    }
                }
                return this;
            },
            // 使用list.splice(index,1)来删除回调函数
            remove: function() {
                if ( list ) {
                    jQuery.each( arguments, function( _, arg ) {
                        var index;
                        while( ( index = jQuery.inArray( arg, list, index ) ) > -1 ) {
                            list.splice( index, 1 );
                            // Handle firing indexes
                            if ( firing ) {
                                if ( index <= firingLength ) {
                                    firingLength--;
                                }
                                if ( index <= firingIndex ) {
                                    firingIndex--;
                                }
                            }
                        }
                    });
                }
                return this;
            },
            // Check if a given callback is in the list.
            // If no argument is given, return whether or not list has callbacks attached.
            has: function( fn ) {
                return fn ? jQuery.inArray( fn, list ) > -1 : !!( list && list.length );
            },
            // Remove all callbacks from the list
            empty: function() {
                list = [];
                firingLength = 0;
                return this;
            },
            // Have the list do nothing anymore
            disable: function() {
                list = stack = memory = undefined;
                return this;
            },
            // Is it disabled?
            disabled: function() {
                return !list;
            },
            // Lock the list in its current state
            lock: function() {
                stack = undefined;
                if ( !memory ) {
                    self.disable();
                }
                return this;
            },
            // Is it locked?
            locked: function() {
                return !stack;
            },
            // Call all callbacks with the given context and arguments
            fireWith: function( context, args ) {
                if ( list && ( !fired || stack ) ) {
                    args = args || [];
                    args = [ context, args.slice ? args.slice() : args ];
                    if ( firing ) {
                        stack.push( args );
                    } else {
                        fire( args );
                    }
                }
                return this;
            },
            // Call all the callbacks with the given arguments
            fire: function() {
                self.fireWith( this, arguments );
                return this;
            },
            // To know if the callbacks have already been called at least once
            fired: function() {
                return !!fired;
            }
        };

    return self;
};