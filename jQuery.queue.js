/**
 * Created by xiyin on 16/06/2017.
 * 队列，多异步的执行顺序的管理，提供实例队列操作方法和工具队列操作方法
 */
jQuery.extend({
    // 返回或修改匹配元素关联的函数队列 ，队列中存储的都是函数
    /**
     * @param elem DOM元素或js对象，在其上查找或修改队列
     * @param type 字符串 ，表示队列名称，默认为标准动画fx
     * @param data 可选的函数或函数数组，data没有时，返回队列；data为函数时，入队；data为函数数组时，替换队列；
     * @returns {*|{}|Array}
     */
    queue: function( elem, type, data ) {
        var queue;
        if ( elem ) {
            type = ( type || "fx" ) + "queue";
            queue = data_priv.get( elem, type ); // 取出参数type对应的队列
            // 如果传入data
            if ( data ) {
                // 队列不存在或data是数组
                if ( !queue || jQuery.isArray( data ) ) {
                    // 创建一个data 缓存，将data转换为数组，并替换队列
                    queue = data_priv.access( elem, type, jQuery.makeArray(data) );
                } else {  // 数据缓存中有这个队列 否则参数data入队
                    queue.push( data );
                }
            }
            // 返回队列，如果队列不存在，返回空数组
            return queue || [];
        }
    },
    // 出队并执行匹配元素关联的函数队列中的下一个函数
    dequeue: function( elem, type ) {
        type = type || "fx";
        var queue = jQuery.queue( elem, type ), // 取出参数对应的队列
            startLength = queue.length,
            fn = queue.shift(),
            hooks = jQuery._queueHooks( elem, type ),
            next = function() {
                jQuery.dequeue( elem, type );
            };
        // 修改动画函数的占位符
        if ( fn === "inprogress" ) {
            fn = queue.shift();
            startLength--;
        }
        if ( fn ) {
            if ( type === "fx" ) {
                // 设置动画占位符，表示动画函数正在进行
                queue.unshift( "inprogress" );
            }
            // clear up the last queue stop function
            delete hooks.stop;
            // 调用call执行出队函数
            fn.call( elem, next, hooks );
        }
        if ( !startLength && hooks ) {
            hooks.empty.fire();
        }
    },

    // 所有出队操作结束，触发empty()清理data缓存
    _queueHooks: function( elem, type ) {
        var key = type + "queueHooks";
        return data_priv.get( elem, key ) || data_priv.access( elem, key, {
                empty: jQuery.Callbacks("once memory").add(function() {
                    data_priv.remove( elem, [ type + "queue", key ] );
                })
            });
    }
});

jQuery.fn.extend({
    // 返回一个匹配元素关联的函数队列，或修改所有匹配元素关联的函数队列
    /**
     *
     * @param type 字符串，表示队列的名称，默认是fx
     * @param data 函数或函数数组
     * @returns {*}
     */
    queue: function( type, data ) {
        var setter = 2;
        // 参数没有type的队列名称时，修正参数
        if ( typeof type !== "string" ) {
            data = type;
            type = "fx";
            setter--;
        }
        // 查看
        if ( arguments.length < setter ) {
            return jQuery.queue( this[0], type );
        }
        // 没有传入data，则认为是取队列，如果传入了参数data,则在每个匹配的元素上调用函数
        return data === undefined ? this :
            this.each(function() {
                var queue = jQuery.queue( this, type, data );
                // ensure a hooks for this queue
                jQuery._queueHooks( this, type );
                // 第一次入完队，立即出队
                if ( type === "fx" && queue[0] !== "inprogress" ) {
                    jQuery.dequeue( this, type );
                }
            });
    },
    // 出队并执行匹配元素关联的下一个函数
    dequeue: function( type ) {
        return this.each(function() {
            // 使参数type对应的函数队列中的下一个函数出队并执行
            jQuery.dequeue( this, type );
        });
    },
    // 设置一个定时器，使得匹配元素关联的函数队列中后续的函数延迟出队和执行
    delay: function( time, type ) {
        /**
         *  jQuery.extend(jQuery.fx,{slow:600,fast:200,_default:400})
         */
        time = jQuery.fx ? jQuery.fx.speeds[ time ] || time : time;
        type = type || "fx";
        return this.queue( type, function( next, hooks ) {
            var timeout = setTimeout( next, time );
            hooks.stop = function() {
                clearTimeout( timeout );
            };
        });
    },
    // 移除所有匹配元素关联的函数队列中所有未被执行的函数
    clearQueue: function( type ) {
        // 使用一个空数组来替换当前函数队列
        return this.queue( type || "fx", [] );
    },
    // 返回一个异步队列的只读脚本，观察每个匹配元素关联的某个类型的函数队列和计数器是否完成
    promise: function( type, obj ) {
        var tmp, // 临时变量，指向DOM元素关联的回调函数列表
            count = 1, // 计数器，观察DOM元素的变化个数
            defer = jQuery.Deferred(), // 异步队列，用于存放成功回调函数
            elements = this, // 当前jQuery对象，匹配的元素集合
            i = this.length, // 当前匹配元素中DOM元素的个数
            // 定义使cout减1的回调函数，计数器为0，触发异步队列的成功回调函数
            resolve = function() {
                if ( !( --count ) ) {
                    defer.resolveWith( elements, [ elements ] );
                }
            };

        if ( typeof type !== "string" ) {
            obj = type;
            type = undefined;
        }
        type = type || "fx";
        // 查找需要观察的元素
        while( i-- ) {
            tmp = data_priv.get( elements[ i ], type + "queueHooks" );
            if ( tmp && tmp.empty ) {
                count++;
                // 把特殊回调函数添加到回调函数列表中
                tmp.empty.add( resolve );
            }
        }
        // 调用回调函数
        resolve();
        // 返回异步队列的只读副本
        return defer.promise( obj );
    }
});