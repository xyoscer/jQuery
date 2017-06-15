/**
 * Created by xiyin on 15/06/2017.
 * 延迟对象 对异步的统一管理
 */

jQuery.extend({
    Deferred: function( func ) {
        var tuples = [
                // action, add listener, listener list, final state
                [ "resolve", "done", jQuery.Callbacks("once memory"), "resolved" ],
                [ "reject", "fail", jQuery.Callbacks("once memory"), "rejected" ],
                [ "notify", "progress", jQuery.Callbacks("memory") ]
            ],
            state = "pending",
            // 创建异步状态的只读副本，promise对象
            promise = {
                // 返回异步队列的状态
                state: function() {
                    return state;
                },
                // 总是触发回调函数，不管成功与否 将回调函数同时添加到成功回调函数列表，失败回调函数列表
                always: function() {
                    deferred.done( arguments ).fail( arguments );
                    return this;
                },
                // 同时添加成功回调函数，失败回调函数，和消息回调函数到对应的回调函数列表中
                then: function( /* fnDone, fnFail, fnProgress */ ) {
                    var fns = arguments; // 获得函数的参数列表
                    // return 是针对pipe的方法
                    return jQuery.Deferred(function( newDefer ) {
                        jQuery.each( tuples, function( i, tuple ) {
                            var action = tuple[ 0 ], // 获得当前的状态
                                fn = jQuery.isFunction( fns[ i ] ) && fns[ i ]; // 判断当前参数是否是函数
                            // deferred[ done | fail | progress ] for forwarding actions to newDefer
                            // 添加回调
                            deferred[ tuple[1] ](function() {
                                var returned = fn && fn.apply( this, arguments );
                                // 针对pipe
                                if ( returned && jQuery.isFunction( returned.promise ) ) {
                                    returned.promise()
                                        .done( newDefer.resolve )
                                        .fail( newDefer.reject )
                                        .progress( newDefer.notify );
                                } else {
                                    newDefer[ action + "With" ]( this === promise ? newDefer.promise() : this, fn ? [ returned ] : arguments );
                                }
                            });
                        });
                        fns = null;
                    }).promise();
                },

                // 返回当前异步队列的只读副本，或为一个普通js对象增加只读副本中的方法返回
                promise: function( obj ) {
                    return obj != null ? jQuery.extend( obj, promise ) : promise;
                }
            },
            // deferred对象
            deferred = {};
        // Keep pipe for back-compat
        promise.pipe = promise.then;
        // Add list-specific methods
        jQuery.each( tuples, function( i, tuple ) {
            var list = tuple[ 2 ],
                stateString = tuple[ 3 ];
            // promise[ done | fail | progress ] = list.add
            // promise.done();promise.fail();promise.progress()
            promise[ tuple[1] ] = list.add;
            // 确保触发了reject而resolve不会被触发
            if ( stateString ) {
                list.add(function() {
                    state = stateString; // state = [ resolved | rejected ]
                    // 一个调用禁止另一个回调函数的所有，对数组的notice进行lock
                    // [ reject_list | resolve_list ].disable; progress_list.lock
                }, tuples[ i ^ 1 ][ 2 ].disable, tuples[ 2 ][ 2 ].lock );
            }
            // deferred[ resolve | reject | notify ],deferred下的方法
            deferred[ tuple[0] ] = function() {
                deferred[ tuple[0] + "With" ]( this === deferred ? promise : this, arguments );
                return this;
            };
            deferred[ tuple[0] + "With" ] = list.fireWith;
        });

        // 把deferred对象传给promise.promise(),
        // 把promise下的state,always,then,promise,pipe,done,fail,promise等方法继承给deferred
        // 此时deferred对象与promise对象的不同之处就是：deferred对象有三个状态的方法，resolve,reject,notify
        // 使用promise可以保证延迟对象的状态不会被修改。
        promise.promise( deferred );
        // 如果传入参数则调用
        if ( func ) {
            func.call( deferred, deferred );
        }
        // 返回异步对列
        return deferred;
    },

    // 基于一个或多个对象的状态来执行回调函数的功能，所有子异步队列都变为成功状态，when的成功回调函数才被执行
    // 其中有一个异步队列为失败状态，when的失败回调函数将被调用
    when: function( subordinate /* , ..., subordinateN */ ) {
        var i = 0,
            resolveValues = core_slice.call( arguments ), // 参数集合
            length = resolveValues.length,
            // 计数器
            remaining = length !== 1 || ( subordinate && jQuery.isFunction( subordinate.promise ) ) ? length : 0,
            // deferred表示主异步队列，如果只传入了一个子异步队列，则把传入的子异步队列赋值给deferred
            // 如果是其他情况（没有异步队列，或者多个，或者一个或多个js对象）则新创建一个异步队列作为主异步队列
            deferred = remaining === 1 ? subordinate : jQuery.Deferred(),
            // Update function for both resolve and progress values
            // updateFunc被调用就说明done执行了，计数器就减1
            updateFunc = function( i, contexts, values ) {
                return function( value ) {
                    contexts[ i ] = this; // 上下文为主异步队列
                    // values
                    values[ i ] = arguments.length > 1 ? core_slice.call( arguments ) : value;
                    if( values === progressValues ) {
                        // 执行子异步队列消息参数
                        deferred.notifyWith( contexts, values );
                    } else if ( !( --remaining ) ) {
                        // 计数器减到0，说明所有的子异步队列都进入成功状态，则调用主异步队列的resolveWith方法
                        deferred.resolveWith( contexts, values );
                    }
                };
            },
            progressValues, progressContexts, resolveContexts;
        // 传入多参，既有延迟对象也有普通对象
        if ( length > 1 ) {
            progressValues = new Array( length );
            progressContexts = new Array( length );
            resolveContexts = new Array( length );
            for ( ; i < length; i++ ) {
                // 参数是延迟对象则执行if
                if ( resolveValues[ i ] && jQuery.isFunction( resolveValues[ i ].promise ) ) {
                    resolveValues[ i ].promise()
                        .done( updateFunc( i, resolveContexts, resolveValues ) )
                        .fail( deferred.reject )
                        .progress( updateFunc( i, progressContexts, progressValues ) );
                } else {
                    // 参数不是延迟对象
                    --remaining;
                }
            }
        }
        // 没有参数或者参数不是延迟对象
        if ( !remaining ) {
            deferred.resolveWith( resolveContexts, resolveValues );
        }
        // 返回延迟对象，该对象没有reject,resolve,notify方法
        return deferred.promise();
    }
});