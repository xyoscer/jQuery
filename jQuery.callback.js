/**
 * Created by XiYin on 2017/5/1.
 */
// 对Callbacks()的参数进行处理
var optionsCache = {}; // 定义一个缓存变量，用于存放参数信息
var  core_rnotwhite = /\S+/g; // 对参数进行分割处理的正则式
//  处理jQuery.Callbacks(options)的字符串参数
function createOptions( options ) {
    // 设置缓存为空，将变量object与optionCache[options]指向同一个空对象
    // 方便后面为object添加属性时，同时也就给optionsCache[options]添加了属性，就不必最后把object对象再赋给optionsCache
    var object = optionsCache[ options ] = {};
    // 取出非空格的字符["once","memeory"] object={once:true,memeory:true}
    // 此时optionsCache = {"once memory":{once:true,memeory:true}}
    // 对匹配出来的数组的每一个元素进行设置该属性为true
    jQuery.each( options.match( core_rnotwhite ) || [], function( _, flag ) {
        object[ flag ] = true;
    });
    // 将参数对象返回
    return object;
}

/* Callbacks()的参数，可以是下面的单个参数，也可以是几个组合,以空格隔开的字符产，比如"once memory" *
 *
 *	once:确保回调函数列表只能被触发一次，作用于fire()
 *	memory:（记忆）作用在add()函数中，记录上一次触发回调函数列表时的参数，之后添加的任何回调函数都将用记录的参数值立即调用
 *	unique:（去重）确保一个回调函数只能被添加一次，回调函数列表中没有重复值。也是作用于add()中 *
 *	stopOnFalse:当某个回调函数返回false时，中断执行，作用于for循环中
 *
 */
jQuery.Callbacks = function( options ) {

    // 判断参数是否合法，是字符串的进行处理，不是字符串的，比如没有参数，options为空时
    // typeof options为undefined,返回空对象。 jQuery.extend( {}, options )
    // 参数正常，先在缓存中查找，没有的话，再给缓存添加这个属性
    options = typeof options === "string" ?
        ( optionsCache[ options ] || createOptions( options ) ) :
        jQuery.extend( {}, options );

    var
        memory,
        fired,  // 回调函数列表已经执行
        firing, // 回调函数列表正在执行
        firingStart, // 待执行的第一个回调函数的下标
        firingLength, // 待执行的最后一个回调函数的下标
        firingIndex,  // 当前正在执行回调函数的下标
        list = [], // 存放回调函数的数组列表
        stack = !options.once && [], // 有once参数时，stack为false,否则为[]
        // 实际触发回调函数的工具方法 data[0]:context 执行回调函数的上下文，data[1]： args执行回调函数的实参
        fire = function( data ) {
            memory = options.memory && data; // 有memory参数时，memory为data,没有memory参数，memory为false
            fired = true; // 调用fire()则设置fired为true,表示回调函数列表已经执行
            firingIndex = firingStart || 0;
            firingStart = 0; // 确保下次执行时从头开始
            firingLength = list.length;
            firing = true; // 执行回调函数前，设置为true,表示正在执行

            // 循环遍历执行list中的回调函数
            for ( ; list && firingIndex < firingLength; firingIndex++ ) {
                  // 如果回调列表函数中有函数返回false，并且有stopOnFalse的参数，则直接跳出循环，否则将列表中的回调函数执行完
                if ( list[ firingIndex ].apply( data[ 0 ], data[ 1 ] ) === false && options.stopOnFalse ) {
                    memory = false; // To prevent further calls using add
                    break;
                }
            }
            // 执行回调函数完，设置为false,表示未执行
            firing = false;

            if ( list ) {
                if ( stack ) { // stack = !options.once，如果不是once模式，便可以多次触发回调函数
                    if ( stack.length ) {
                        // 解决在回调函数中继续触发fire()函数的情况，当这一轮的回调函数执行完
                        // 判断stack中有值，就接下来执行stack中的函数
                        // 从stack中弹出存放的上下文和参数，再次执行整个函数回调列表，直到stack为空
                        fire( stack.shift() );
                    }
                } else if ( memory ) { // "once memory" 只执行一次，就第一次执行完list数组，就将list清空
                    list = []; // 清空数组list,后续添加的回调函数还会立即执行
                } else { // 如果stack是false 则是once模式，并且不是memory模式,则禁用回调函数列表 "once "/"once stopONFalse"
                    // " list = stack = memory = undefined;"
                    self.disable();
                }
            }
        },
        // 实际回调函数对象，方法jQuery.Callbacks(flag)的返回值
        self = {
            // 给list[]数组中添加回调函数，在add方法中执行自调用的add()函数
            add: function() {
                if ( list ) {
                    // 把当前list数组的长度，复制给start,作为下次要插入回调函数的位置坐标。
                    var start = list.length;
                    // 自调用的执行add()函数
                    (function add( args ) {
                        // 对cb.add()的参数进行处理，jQuery.each()可以对数组，和类数组进行遍历
                        // _ 这个参数没有特殊意义，跟数组的下标索引的意思一样
                        jQuery.each( args, function( _, arg ) {
                            var type = jQuery.type( arg );
                            if ( type === "function" ) {
                                // 判断add()的参数是函数的话，并且Callback()没有unique参数，则直接将该回调函数放入list数组中
                                // 若有unique参数，但是list的列表数组中还没有这个回调函数，也将回调函数放入list数组中

                                if ( !options.unique || !self.has( arg ) ) {
                                    list.push( arg );
                                }
                            }  // add()的参数是数组的话，递归的调用add()将回调函数放入list数组中。
                            else if ( arg && arg.length && type !== "string" ) {
                                // 参数不是函数，可能是数组时，递归调用，将递归add
                                add( arg );
                            }
                        });
                    })( arguments );

                    // 如果回调函数列表正在执行，则修正firingLength下标,使得新添加的回调函数也得执行。

                    if ( firing ) {
                        firingLength = list.length;
                    } // 在memory模式下，如果回调函数列表未在执行
                    else if ( memory ) {
                        // 修正起始下标为回调函数的插入位置，然后调用工具函数，立即执行新添加的回调函数
                        firingStart = start;
                        fire( memory );
                    }
                }
                return this; // 返回当前回调函数列表，为了后期链式语法
            },

            // 用于从回调函数中移除一个或一组回调函数，使用list.splice(index,1)来删除回调函数
            remove: function() {
                if ( list ) {
                    jQuery.each( arguments, function( _, arg ) {
                        var index;

                        while( ( index = jQuery.inArray( arg, list, index ) ) > -1 ) {
                            // arg回调函数在list数组中存在，则直接splie()删除list数组中的这个回调函数
                            list.splice( index, 1 );
                            //如果回调函数列表正在执行
                            if ( firing ) {
                                  // 待删除的回调函数的下标小于待执行的最后一个回调函数的下标
                                if ( index <= firingLength ) {
                                    firingLength--; // 待执行的最后一个回调函数结束下标减1
                                }
                                // 如果待删除的函数下标小于正在执行的回调函数下标firingIndex,

                                if ( index <= firingIndex ) {
                                    firingIndex--; // 修正正在执行的回调函数下标减1，确保不会漏执行函数
                                }
                            }
                        }
                    });
                }
                return this; // 返回当前回调函数列表
            },
            // 回调函数是否在列表中
            // 如果参数回调函数存在.则返回true,否则返回false(这块当没有参数，则根据list数组放回，list有值就为true,否则就为false)
            has: function( fn ) {
                return fn ? jQuery.inArray( fn, list ) > -1 : !!( list && list.length );
            },
            // 清空回调函数列表
            empty: function() {
                list = []; // 清空list数组
                firingLength = 0;
                return this;
            },
            // 禁用回调函数列表，使它不在做任何事情
            disable: function() {
                // 在add(),remove()中，fireWith() stack如果变量list可以转换为false,则忽略本次调用，无法添加，无法移除
                // 禁用回调函数后，将无法再次添加，移除，触发回调函数，并会立即停止正在执行的回调函数。
                list = stack = memory = undefined;
                return this;
            },
            // 判断是否已经禁用回调函数列表
            disabled: function() {
                return !list;
            },
            // 锁定列表,锁定memory模式下回调函数的上下文和参数 ，只是针对fire()操作
            lock: function() {
                stack = undefined; // 无法再次触发回调函数
                if ( !memory ) { // 在非memory模式下，调用disable()
                    self.disable();
                }
                return this;
            },
            // 是否已经锁定列表，lock只会锁住后面fire()的操作，其他的操作还可以再执行
            locked: function() {
                return !stack;
            },
            // 使用指定的上下文和参数调用回调函数
            fireWith: function( context, args ) {
                // 第二次调用 fire,fired为true ,没有once stack为【】，则再次触发fire()
                if ( list && ( !fired || stack ) ) {
                    args = args || [];
                    args = [ context, args.slice ? args.slice() : args ];
                    /*  下面是为了解决一些特殊触发情况
                        var flag = false;
                    *   function fn1(){alert("1"); if(flag) {cb.fire();flag = true;}}
                    *   function fn2( {alert('2');})
                    *   cb.add(fn1);cb.add(fn2)；
                    *   cb.fire();
                    * */
                    if ( firing ) { // 在list数组回调函数没有执行完，firing都是true
                        // 在正在执行回调函数中，会把再次触发的fire()的参数压入stack中,则不是立即就触发
                        stack.push( args ); // 把上下文和参数存入stack中
                    } else { // 如果回调函数列表未在执行，则调用工具函数放fire()执行所有回调函数列表
                        fire( args );
                    }
                }
                return this;
            },
            // 使用个给定的参数调用回调函数，上下文是当前回调函数列表self
            fire: function() {
                self.fireWith( this, arguments );
                return this;
            },
            // 回调函数是否已经执行过一次
            fired: function() {
                return !!fired;
            }
        };

    return self;
};