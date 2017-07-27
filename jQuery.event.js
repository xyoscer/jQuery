/**
 * Created by xiyin on 13/07/2017.
 */
// 底层方法
jQuery.event = {

    global: {},
    // 绑定一个或多个类型的事件监听函数
    /**
     *
     * @param elem 待绑定事件的DOM元素
     * @param types 事件类型字符串
     * @param handler 待绑定的事件监听函数
     * @param data
     * @param selector 选择器表达式字符串，用于绑定代理事件，当代理事件触发时，会用该参数过滤
     */
    add: function( elem, types, handler, data, selector ) {

        var handleObjIn, eventHandle, tmp,
            events,  // 指向DOM元素关联的事件缓存对象
            t, handleObj, // 封装了事件函数的监听对象 ，In是传入时的监听对象
            special, // 特殊事件类型对应的修正对象
            handlers, // 事件类型对应的监听对象数组
            type, namespaces, origType,
            elemData = data_priv.get( elem ); // 指向DOM元素关联的缓存对象

        //  过滤点文本节点，注释节点，只是春对象类型才行
        if ( !elemData ) {
            return;
        }

        // Caller can pass in an object of custom data in lieu of the handler
        if ( handler.handler ) {
            handleObjIn = handler;
            handler = handleObjIn.handler;
            selector = handleObjIn.selector;
        }

        // 为监听函数分配一个唯一标识guid,在移除监听函数时，将通过这个唯一标识来匹配监听函数
        if ( !handler.guid ) {
            handler.guid = jQuery.guid++;
        }

        // 取出或初始化事件缓存对象，如果不存在，则初始化为一个空对象
        if ( !(events = elemData.events) ) {
            events = elemData.events = {};
        }
        // 取出或初始化主监听函数hanlder,如果不存在，则为当前元素初始化一个主监听函数
        if ( !(eventHandle = elemData.handle) ) {
            eventHandle = elemData.handle = function( e ) {
                return typeof jQuery !== core_strundefined && (!e || jQuery.event.triggered !== e.type) ?
                    jQuery.event.dispatch.apply( eventHandle.elem, arguments ) :
                    undefined;
            };
            // Add elem as a property of the handle fn to prevent a memory leak with IE non-native events
            eventHandle.elem = elem;
        }

        // 转换以空格隔开的types
        types = ( types || "" ).match( core_rnotwhite ) || [""];
        t = types.length;
        while ( t-- ) {
            tmp = rtypenamespace.exec( types[t] ) || [];
            type = origType = tmp[1];
            namespaces = ( tmp[2] || "" ).split( "." ).sort();

            // There *must* be a type, no attaching namespace-only handlers
            if ( !type ) {
                continue;
            }

            // 获取当前事件类型对应的修正对象
            special = jQuery.event.special[ type ] || {};

            // 修正type为实际使用的事件类型，如果传入参数selector,则绑定的事件代理，则需要把当前事件类型修正为可冒泡的事件类型
            // 如果未传入参数，则是普通绑定，但是有些事件不支持冒泡，就需要修正为更好的
            type = ( selector ? special.delegateType : special.bindType ) || type;

            // 更新事件类型后，再次修正事件类型对应的修正对象
            special = jQuery.event.special[ type ] || {};

            // 封装监听函数为监听对象
            handleObj = jQuery.extend({
                type: type,
                origType: origType,
                data: data,
                handler: handler,
                guid: handler.guid,
                selector: selector,
                needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
                namespace: namespaces.join(".")
            }, handleObjIn );

            // 初始化监听对象数组，绑定主监听函数
            if ( !(handlers = events[ type ]) ) {
                handlers = events[ type ] = [];
                handlers.delegateCount = 0;

                // Only use addEventListener if the special events handler returns false
                if ( !special.setup || special.setup.call( elem, data, namespaces, eventHandle ) === false ) {
                    if ( elem.addEventListener ) {
                        elem.addEventListener( type, eventHandle, false );
                    }
                }
            }

            if ( special.add ) {
                special.add.call( elem, handleObj );
                if ( !handleObj.handler.guid ) {
                    handleObj.handler.guid = handler.guid;
                }
            }
            // 将监听对象插入到监听对象数组中，如果是selector，则绑定的是代理事件，
            if ( selector ) {
                handlers.splice( handlers.delegateCount++, 0, handleObj );
            } else {
                handlers.push( handleObj );
            }

            // 记录绑定过的事件类型
            jQuery.event.global[ type ] = true;
        }
        // 解除参数elem对dom元素的引用，以避免内存泄漏（IE）
        elem = null;
    },
    // 移除一个或多个类型的事件监听函数
    remove: function( elem, types, handler, selector, mappedTypes ) {

        var j, origCount, tmp,
            events, t, handleObj,
            special, handlers, type, namespaces, origType,
            elemData = data_priv.hasData( elem ) && data_priv.get( elem );
        // 过滤没有缓存数据或事件缓存对象的情况
        if ( !elemData || !(events = elemData.events) ) {
            return;
        }

        // Once for each type.namespace in types; type may be omitted
        types = ( types || "" ).match( core_rnotwhite ) || [""];
        t = types.length;
        while ( t-- ) {
            tmp = rtypenamespace.exec( types[t] ) || [];
            type = origType = tmp[1];
            namespaces = ( tmp[2] || "" ).split( "." ).sort();

            // 没有指定事件类型
            if ( !type ) {
                for ( type in events ) {
                    jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
                }
                continue;
            }

            special = jQuery.event.special[ type ] || {};
            type = ( selector ? special.delegateType : special.bindType ) || type;
            handlers = events[ type ] || [];
            tmp = tmp[2] && new RegExp( "(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" );

            // 遍历监听对象数组，从中移除匹配的监听对象
            origCount = j = handlers.length;
            while ( j-- ) {
                handleObj = handlers[ j ];

                if ( ( mappedTypes || origType === handleObj.origType ) &&
                    ( !handler || handler.guid === handleObj.guid ) &&
                    ( !tmp || tmp.test( handleObj.namespace ) ) &&
                    ( !selector || selector === handleObj.selector || selector === "**" && handleObj.selector ) ) {
                    handlers.splice( j, 1 );

                    if ( handleObj.selector ) {
                        handlers.delegateCount--;
                    }
                    if ( special.remove ) {
                        special.remove.call( elem, handleObj );
                    }
                }
            }

            // Remove generic event handler if we removed something and no more handlers exist
            // (avoids potential for endless recursion during removal of special event handlers)
            if ( origCount && !handlers.length ) {
                if ( !special.teardown || special.teardown.call( elem, namespaces, elemData.handle ) === false ) {
                    jQuery.removeEvent( elem, type, elemData.handle );
                }

                delete events[ type ];
            }
        }

        // Remove the expando if it's no longer used
        if ( jQuery.isEmptyObject( events ) ) {
            delete elemData.handle;
            data_priv.remove( elem, "events" );
        }
    },
    // 手动触发事件，执行绑定的事件监听函数和默认行为，并且会模拟冒泡过程
    trigger: function( event, data, elem, onlyHandlers ) {

        var i, cur, tmp, bubbleType, ontype, handle, special,
            eventPath = [ elem || document ],
            type = core_hasOwn.call( event, "type" ) ? event.type : event,
            namespaces = core_hasOwn.call( event, "namespace" ) ? event.namespace.split(".") : [];

        cur = tmp = elem = elem || document;

        // 过滤文本节点和注释节点
        if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
            return;
        }

        // focus/blur morphs to focusin/out; ensure we're not firing them right now
        if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
            return;
        }
        // 解析事件类型和命名空间
        if ( type.indexOf(".") >= 0 ) {
            // Namespaced trigger; create a regexp to match event type in handle()
            namespaces = type.split(".");
            type = namespaces.shift();
            namespaces.sort();
        }
        ontype = type.indexOf(":") < 0 && "on" + type;

        // Caller can pass in a jQuery.Event object, Object, or just an event type string
        event = event[ jQuery.expando ] ?
            event :
            new jQuery.Event( type, typeof event === "object" && event );

        // Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)
        event.isTrigger = onlyHandlers ? 2 : 3;
        event.namespace = namespaces.join(".");
        event.namespace_re = event.namespace ?
            new RegExp( "(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" ) :
            null;

        // Clean up the event in case it is being reused
        event.result = undefined;
        if ( !event.target ) {
            event.target = elem;
        }

        // Clone any incoming data and prepend the event, creating the handler arg list
        data = data == null ?
            [ event ] :
            jQuery.makeArray( data, [ event ] );

        // Allow special events to draw outside the lines
        special = jQuery.event.special[ type ] || {};
        if ( !onlyHandlers && special.trigger && special.trigger.apply( elem, data ) === false ) {
            return;
        }

        // Determine event propagation path in advance, per W3C events spec (#9951)
        // Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
        if ( !onlyHandlers && !special.noBubble && !jQuery.isWindow( elem ) ) {

            bubbleType = special.delegateType || type;
            if ( !rfocusMorph.test( bubbleType + type ) ) {
                cur = cur.parentNode;
            }
            for ( ; cur; cur = cur.parentNode ) {
                eventPath.push( cur );
                tmp = cur;
            }

            // Only add window if we got to document (e.g., not plain obj or detached DOM)
            if ( tmp === (elem.ownerDocument || document) ) {
                eventPath.push( tmp.defaultView || tmp.parentWindow || window );
            }
        }

        // Fire handlers on the event path
        i = 0;
        while ( (cur = eventPath[i++]) && !event.isPropagationStopped() ) {

            event.type = i > 1 ?
                bubbleType :
            special.bindType || type;

            // jQuery handler
            handle = ( data_priv.get( cur, "events" ) || {} )[ event.type ] && data_priv.get( cur, "handle" );
            if ( handle ) {
                handle.apply( cur, data );
            }

            // Native handler
            handle = ontype && cur[ ontype ];
            if ( handle && jQuery.acceptData( cur ) && handle.apply && handle.apply( cur, data ) === false ) {
                event.preventDefault();
            }
        }
        event.type = type;

        // If nobody prevented the default action, do it now
        if ( !onlyHandlers && !event.isDefaultPrevented() ) {

            if ( (!special._default || special._default.apply( eventPath.pop(), data ) === false) &&
                jQuery.acceptData( elem ) ) {

                // Call a native DOM method on the target with the same name name as the event.
                // Don't do default actions on window, that's where global variables be (#6170)
                if ( ontype && jQuery.isFunction( elem[ type ] ) && !jQuery.isWindow( elem ) ) {

                    // Don't re-trigger an onFOO event when we call its FOO() method
                    tmp = elem[ ontype ];

                    if ( tmp ) {
                        elem[ ontype ] = null;
                    }

                    // Prevent re-triggering of the same event, since we already bubbled it above
                    jQuery.event.triggered = type;
                    elem[ type ]();
                    jQuery.event.triggered = undefined;

                    if ( tmp ) {
                        elem[ ontype ] = tmp;
                    }
                }
            }
        }

        return event.result;
    },
    // 分发事件，执行事件监听函数，是真正绑定到元素上的监听函数
    dispatch: function( event ) {

        // 创建jQuery事件对象，把原生事件对象封装为jQuery事件对象
        event = jQuery.event.fix( event );

        var i, j, ret, matched, handleObj,
            handlerQueue = [],
            args = core_slice.call( arguments ),
            handlers = ( data_priv.get( this, "events" ) || {} )[ event.type ] || [],
            special = jQuery.event.special[ event.type ] || {};

        // Use the fix-ed jQuery.Event rather than the (read-only) native event
        args[0] = event;
        event.delegateTarget = this;

        // Call the preDispatch hook for the mapped type, and let it bail if desired
        if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
            return;
        }

        // Determine handlers
        handlerQueue = jQuery.event.handlers.call( this, event, handlers );

        // Run delegates first; they may want to stop propagation beneath us
        i = 0;
        while ( (matched = handlerQueue[ i++ ]) && !event.isPropagationStopped() ) {
            event.currentTarget = matched.elem;

            j = 0;
            while ( (handleObj = matched.handlers[ j++ ]) && !event.isImmediatePropagationStopped() ) {

                // Triggered event must either 1) have no namespace, or
                // 2) have namespace(s) a subset or equal to those in the bound event (both can have no namespace).
                if ( !event.namespace_re || event.namespace_re.test( handleObj.namespace ) ) {

                    event.handleObj = handleObj;
                    event.data = handleObj.data;

                    ret = ( (jQuery.event.special[ handleObj.origType ] || {}).handle || handleObj.handler )
                        .apply( matched.elem, args );

                    if ( ret !== undefined ) {
                        if ( (event.result = ret) === false ) {
                            event.preventDefault();
                            event.stopPropagation();
                        }
                    }
                }
            }
        }

        // Call the postDispatch hook for the mapped type
        if ( special.postDispatch ) {
            special.postDispatch.call( this, event );
        }

        return event.result;
    },
    //
    handlers: function( event, handlers ) {
        var i, matches, sel, handleObj,
            handlerQueue = [],
            delegateCount = handlers.delegateCount,
            cur = event.target;

        // Find delegate handlers
        // Black-hole SVG <use> instance trees (#13180)
        // Avoid non-left-click bubbling in Firefox (#3861)
        if ( delegateCount && cur.nodeType && (!event.button || event.type !== "click") ) {

            for ( ; cur !== this; cur = cur.parentNode || this ) {

                // Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
                if ( cur.disabled !== true || event.type !== "click" ) {
                    matches = [];
                    for ( i = 0; i < delegateCount; i++ ) {
                        handleObj = handlers[ i ];

                        // Don't conflict with Object.prototype properties (#13203)
                        sel = handleObj.selector + " ";

                        if ( matches[ sel ] === undefined ) {
                            matches[ sel ] = handleObj.needsContext ?
                            jQuery( sel, this ).index( cur ) >= 0 :
                                jQuery.find( sel, this, null, [ cur ] ).length;
                        }
                        if ( matches[ sel ] ) {
                            matches.push( handleObj );
                        }
                    }
                    if ( matches.length ) {
                        handlerQueue.push({ elem: cur, handlers: matches });
                    }
                }
            }
        }

        // Add the remaining (directly-bound) handlers
        if ( delegateCount < handlers.length ) {
            handlerQueue.push({ elem: this, handlers: handlers.slice( delegateCount ) });
        }

        return handlerQueue;
    },

    // 原生事件对象event的通用属性  KeyEvent and MouseEvent
    props: "altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),
    // 事件属性修正对象集，到初始化事件便捷方法时，它才会被初始化
    fixHooks: {},
    // 键盘事件对象的属性和修正方法
    keyHooks: {
        props: "char charCode key keyCode".split(" "),
        // 修改键盘属性兼容性问题
        filter: function( event, original ) {
            // 事件属性which与KeyCode相同的含义和值
            if ( event.which == null ) {
                event.which = original.charCode != null ? original.charCode : original.keyCode;
            }
            return event;
        }
    },
    // 鼠标事件对象的属性和修正方法
    mouseHooks: {
        props: "button buttons clientX clientY offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
        // 修改鼠标事件的属性兼容性问题
        filter: function( event, original ) {
            var eventDoc, doc, body,
                button = original.button;

            // 如果浏览器不支持pageX，pageY则手动计算
            if ( event.pageX == null && original.clientX != null ) {
                eventDoc = event.target.ownerDocument || document;
                doc = eventDoc.documentElement;
                body = eventDoc.body;
                // 距文档左坐标pageX = 距窗口左坐标clienX+水平滚动偏移-文档左边框的厚度
                event.pageX = original.clientX + ( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) - ( doc && doc.clientLeft || body && body.clientLeft || 0 );
                event.pageY = original.clientY + ( doc && doc.scrollTop  || body && body.scrollTop  || 0 ) - ( doc && doc.clientTop  || body && body.clientTop  || 0 );
            }

            // Add which for click: 1 === left; 2 === middle; 3 === right
            // Note: button is not normalized, so don't use it
            if ( !event.which && button !== undefined ) {
                event.which = ( button & 1 ? 1 : ( button & 2 ? 3 : ( button & 4 ? 2 : 0 ) ) );
            }

            return event;
        }
    },
    // 把原生事件对象封装到jQuery对象，并修正不兼容属性，解决跨浏览器兼容性问题，统一接口
    fix: function( event ) {
        // 如果参数含有jQuery.expando属性，说明参数是一个jquery事件对象，
        // 不需要再执行后面的
        if ( event[ jQuery.expando ] ) {
            return event;
        }
        var i, prop, copy,
            type = event.type,
            originalEvent = event,
            fixHook = this.fixHooks[ type ];

        if ( !fixHook ) {
            this.fixHooks[ type ] = fixHook =
                rmouseEvent.test( type ) ? this.mouseHooks :
                    rkeyEvent.test( type ) ? this.keyHooks :
                    {};
        }
        copy = fixHook.props ? this.props.concat( fixHook.props ) : this.props;
        // 创建jQuery对象，复制事件属性
        event = new jQuery.Event( originalEvent );
        i = copy.length;
        while ( i-- ) {
            prop = copy[ i ];
            event[ prop ] = originalEvent[ prop ];
        }
        if ( !event.target ) {
            event.target = document;
        }

        // Support: Safari 6.0+, Chrome < 28
        // 事件对象不应该是文本节点
        if ( event.target.nodeType === 3 ) {
            event.target = event.target.parentNode;
        }

        return fixHook.filter? fixHook.filter( event, originalEvent ) : event;
    },
    // 事件修正对象集
    special: {
        // 修正load事件不允许冒泡
        load: {
            // 表示当前事件类型不支持或不允许冒泡
            noBubble: true
        },
        // 在未不冒泡的事件应用代理时，需要把事件修正为代理事件
        focus: {
            //  用于执行特殊的事件响应行为，在触发当前类型的事件时被调用
            trigger: function() {
                if ( this !== safeActiveElement() && this.focus ) {
                    this.focus();
                    return false;
                }
            },
            delegateType: "focusin" // 表示代理事件使用的事件类型
        },
        blur: {
            trigger: function() {
                if ( this === safeActiveElement() && this.blur ) {
                    this.blur();
                    return false;
                }
            },
            delegateType: "focusout" // 表示代理事件时使用的事件类型
        },
        click: {
            // For checkbox, fire native event so checked state will be right
            trigger: function() {
                if ( this.type === "checkbox" && this.click && jQuery.nodeName( this, "input" ) ) {
                    this.click();
                    return false;
                }
            },

            // 用于执行特殊的默认行为，在触发默认行为时被调用，如果该方法返回false则触发浏览器的默认行为
            _default: function( event ) {
                return jQuery.nodeName( event.target, "a" );
            }
        },
        // 在页面刷新或关闭时触发，
        beforeunload: {
            postDispatch: function( event ) {

                // Support: Firefox 20+
                // Firefox doesn't alert if the returnValue field is not set.
                if ( event.result !== undefined ) {
                    event.originalEvent.returnValue = event.result;
                }
            }
        }
    },
    // 模拟事件
    simulate: function( type, elem, event, bubble ) {
        // Piggyback on a donor event to simulate a different one.
        // Fake originalEvent to avoid donor's stopPropagation, but if the
        // simulated event prevents default then we do the same on the donor.
        var e = jQuery.extend(
            new jQuery.Event(),
            event,
            {
                type: type,
                isSimulated: true,
                originalEvent: {}
            }
        );
        if ( bubble ) {
            jQuery.event.trigger( e, null, elem );
        } else {
            jQuery.event.dispatch.call( elem, e );
        }
        if ( e.isDefaultPrevented() ) {
            event.preventDefault();
        }
    }
};
// 移除主监听函数
jQuery.removeEvent = function( elem, type, handle ) {
    if ( elem.removeEventListener ) {
        elem.removeEventListener( type, handle, false );
    }
};
// jQuery 事件对象
/**
 *
 * @param src 原生事件类型 自定义事件类型 原生事件对象 或jQuery事件对象
 * @param props 可选的javascript对象，其中的属性将被设置到新创建的jQuery事件对象上
 * @returns {jQuery.Event}
 * @constructor
 */
jQuery.Event = function( src, props ) {
    // 允许省略new操作符
    if ( !(this instanceof jQuery.Event) ) {
        return new jQuery.Event( src, props );
    }
    // 事件对象 所有的原生事件对象都有type属性
    if ( src && src.type ) {
        this.originalEvent = src; // 备份到jQuery事件对象的属性上
        this.type = src.type;
        this.isDefaultPrevented = ( src.defaultPrevented ||
        src.getPreventDefault && src.getPreventDefault() )
            ? returnTrue : returnFalse;
    } else { // 如果参数是原生事件类型
        this.type = src;
    }
    // 扩展自定义属性 ，props是扩展的属性参数
    if ( props ) {
        jQuery.extend( this, props );
    }
    // 修正时间戳 这个时间戳指定了浏览器创建事件的时间，
    // 如果参数src是事件类型，则把属性设置成当前时间
    this.timeStamp = src && src.timeStamp || jQuery.now();
    // 设置当前的jQuery对象有jQuery.expando属性，在事件系统的其他部分中通过jQuery.expando
    // 是否为true 连判断当前对象是否为jQuery对象
    this[ jQuery.expando ] = true;
};
// 事件实例上的方法
jQuery.Event.prototype = {
    isDefaultPrevented: returnFalse,
    isPropagationStopped: returnFalse,
    isImmediatePropagationStopped: returnFalse,
    // 阻止浏览器的默认行为
    preventDefault: function() {
        var e = this.originalEvent;
        // 修正属性为true,这个属性是用来判断是否在当前jQuery事件对象上调用过方法preventDefault
        this.isDefaultPrevented = returnTrue;
        if ( e && e.preventDefault ) {
            e.preventDefault();
        }
    },
    // 停止事件传播,阻止任何祖先元素收到该事件
    stopPropagation: function() {
        var e = this.originalEvent;
        this.isPropagationStopped = returnTrue;
        if ( e && e.stopPropagation ) {
            e.stopPropagation();
        }
    },
    // 立即停止事件执行和事件传播，同时停止当前元素和祖先元素上的事件
    stopImmediatePropagation: function() {
        this.isImmediatePropagationStopped = returnTrue;
        this.stopPropagation();
    }
};

// 初始化事件 mouseenter,mouseleave,submit,change,focus,blur对应的修正对象
jQuery.each({
    mouseenter: "mouseover",
    mouseleave: "mouseout"
}, function( orig, fix ) {
    jQuery.event.special[ orig ] = {
        delegateType: fix,
        bindType: fix,

        handle: function( event ) {
            var ret,
                target = this,
                related = event.relatedTarget,
                handleObj = event.handleObj;

            // For mousenter/leave call the handler if related is outside the target.
            // NB: No relatedTarget if the mouse left/entered the browser window
            if ( !related || (related !== target && !jQuery.contains( target, related )) ) {
                event.type = handleObj.origType;
                ret = handleObj.handler.apply( this, arguments );
                event.type = fix;
            }
            return ret;
        }
    };
});
if ( !jQuery.support.focusinBubbles ) {
    jQuery.each({ focus: "focusin", blur: "focusout" }, function( orig, fix ) {

        // Attach a single capturing handler while someone wants focusin/focusout
        var attaches = 0,
            handler = function( event ) {
                jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ), true );
            };

        jQuery.event.special[ fix ] = {
            setup: function() {
                if ( attaches++ === 0 ) {
                    document.addEventListener( orig, handler, true );
                }
            },
            teardown: function() {
                if ( --attaches === 0 ) {
                    document.removeEventListener( orig, handler, true );
                }
            }
        };
    });
}
 // jQuety对象的事件方法
jQuery.fn.extend({
    // 统一事件绑定方法
    /**
     * 用于为匹配元素集合中的每个元素绑定一个或多个类型的事件监听函数
     * @param types 事件类型字符串
     * @param selector  一个选择器表达式字符串，用于绑定代理事件,有值时，则绑定的是代理事件
     * @param data  传递给事件监听函数的自定义数据
     * @param fn 待绑定的监听函数
     * @param one 仅在内部使用
     * @returns {*}
     */
    on: function( types, selector, data, fn, /*INTERNAL*/ one ) {
        var origFn, type;
        // types是对象类型，属性是事件类型字符串，属性值是监听函数
        if ( typeof types === "object" ) {
            // selector是null 或者为传入，则绑定的是普通事件
            if ( typeof selector !== "string" ) {
                data = data || selector;
                selector = undefined;
            }
            // 提供了参数selector则绑定的是代理事件，
            for ( type in types ) {
                this.on( type, selector, data, types[ type ], one );
            }
            return this;
        }
        //
        if ( data == null && fn == null ) {
            // ( types, fn )
            fn = selector;
            data = selector = undefined;
        } else if ( fn == null ) {
            if ( typeof selector === "string" ) {
                // ( types, selector, fn )
                fn = data;
                data = undefined;
            } else {
                // ( types, data, fn )
                fn = data;
                data = selector;
                selector = undefined;
            }
        }
        if ( fn === false ) {
            fn = returnFalse;
        } else if ( !fn ) {
            return this;
        }

        if ( one === 1 ) {
            origFn = fn;
            fn = function( event ) {
                // Can use an empty set, since event contains the info
                jQuery().off( event );
                return origFn.apply( this, arguments );
            };
            // Use same guid so caller can remove using origFn
            fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
        }
        return this.each( function() {
            jQuery.event.add( this, types, fn, data, selector );
        });
    },
    // 绑定最多执行一次的事件监听函数
    one: function( types, selector, data, fn ) {
        return this.on( types, selector, data, fn, 1 );
    },
    // 统一的事件移除方法
    /**
     * 移除事件
     * @param types 一个或多个空格隔开的事件类型和可选的命名空间
     * @param selector 选择器表达式字符串，用于移除代理事件
     * @param fn 待移除的监听函数
     * @returns {*}
     */
    off: function( types, selector, fn ) {
        var handleObj, type;
        // 参数types是被分发的jQuery事件对象的情况
        if ( types && types.preventDefault && types.handleObj ) {
            // ( event )  dispatched jQuery.Event
            handleObj = types.handleObj;
            jQuery( types.delegateTarget ).off(
                handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType,
                handleObj.selector,
                handleObj.handler
            );
            return this;
        }
        // 参数是对象情况
        if ( typeof types === "object" ) {
            // ( types-object [, selector] )
            for ( type in types ) {
                this.off( type, selector, types[ type ] );
            }
            return this;
        }
        // 根据参数类型修正参数
        if ( selector === false || typeof selector === "function" ) {
            // ( types [, fn] )
            fn = selector;
            selector = undefined;
        }
        if ( fn === false ) {
            fn = returnFalse;
        }
        // 返回当前匹配元素集合
        return this.each(function() {
            jQuery.event.remove( this, types, fn, selector );
        });
    },
    // 手动触发事件监听函数和默认行为
    trigger: function( type, data ) {
        return this.each(function() {
            jQuery.event.trigger( type, data, this );
        });
    },
    // s手动触发事件监听函数
    triggerHandler: function( type, data ) {
        var elem = this[0];
        if ( elem ) {
            return jQuery.event.trigger( type, data, elem, true );
        }
    }
});