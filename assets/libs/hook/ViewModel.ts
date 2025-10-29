import { JsonOb } from './JsonOb';

const VM_EMIT_HEAD = 'VC:';
const DEBUG_SHOW_PATH = false;


//通过 .  路径 设置值
function setValueFromPath(obj: any, path: string, value: any, tag: string = '') {
    let props = path.split('.');
    for (let i = 0; i < props.length; i++) {
        const propName = props[i];
        if (propName in obj === false) {
            console.error('[' + propName + '] not find in ' + tag + '.' + path);
            break;
        }
        if (i == props.length - 1) {
            obj[propName] = value;  // 当设置值的时候，数据劫持就会响应，这也是vue响应式的由来
        } else {
            obj = obj[propName];
        }
    }

}

//通过 . 路径 获取值
function getValueFromPath(obj: any, path: string, def?: any, tag: string = ''): any {
    let props = path.split('.');
    for (let i = 0; i < props.length; i++) {
        const propName = props[i];
        if ((propName in obj === false)) {
            console.error('[' + propName + '] not find in ' + tag + '.' + path);
            return def;
        }
        obj = obj[propName];
    }
    if (obj === null || typeof obj === "undefined") obj = def;//如果g == null 则返回一个默认值
    return obj;

}



/**
 * ModelViewer 类
 */
class ViewModel<T> {
    constructor(data: T, tag: string) {
        new JsonOb(data, this._callback.bind(this));
        this.$data = data;
        this._tag = tag;
    }

    public $data: T;

    //索引值用的标签
    private _tag: string = null;

    /**激活状态, 将会通过 cc.director.emit 发送值变动的信号, 适合需要屏蔽的情况 */
    public active: boolean = true;

    /**是否激活根路径回调通知, 不激活的情况下 只能监听末端路径值来判断是否变化 */
    public emitToRootPath: boolean = false;

    //回调函数 请注意 回调的 path 数组是 引用类型，禁止修改
    private _callback(n: any, o: any, path: string[]): void {
        if (this.active == true) {
            // path [player , name]
            let name = VM_EMIT_HEAD + this._tag + '.' + path.join('.')
            if (DEBUG_SHOW_PATH) cc.log('>>', n, o, path);

            // console.log(
            //     "%c[HOOK]%c 更新数据来源:",
            //     "color: #f9008b; background: #00ffddff; font-weight: bold; padding: 2px 4px; border-radius: 3px;",
            //     "color: #00ffddff;", // 更新数据来源
            //     name, n, o, [this._tag].concat(path)
            // );



            cc.director.emit(name, n, o, [this._tag].concat(path)); //通知末端路径

            if (this.emitToRootPath) {
                cc.director.emit(VM_EMIT_HEAD + this._tag, n, o, path);//通知主路径
            }

            if (path.length >= 2) {
                for (let i = 0; i < path.length - 1; i++) {
                    const e = path[i];
                    //cc.log('中端路径');

                }
            }

        }
    }

    //通过路径设置数据的方法
    public setValue(path: string, value: any) {
        setValueFromPath(this.$data, path, value, this._tag);
    }
    //获取路径的值
    public getValue(path: string, def?: any): any {
        return getValueFromPath(this.$data, path, def, this._tag);
    }
}

/**
 * VM 对象管理器(工厂)
 */
class VMManager {
    /**静态数组，保存创建的 mv 组件 */
    private _mvs: Array<{ tag: string, vm: ViewModel<any> }> = [];

    private EMIT_HEAD = VM_EMIT_HEAD;


    /**
     * 绑定一个数据，并且可以由VM所管理
     * @param data 需要绑定的数据
     * @param tag 对应该数据的标签(用于识别为哪个VM，不允许重复)
     * @param activeRootObject 激活主路径通知，可能会有性能影响，一般不使用
     */
    add<T>(data: T, tag: string = 'global', activeRootObject: boolean = false) {
        let vm = new ViewModel<T>(data, tag);
        let has = this._mvs.find(v => v.tag === tag);
        if (tag.includes('.')) {
            console.error('不允许在tag中使用 . 符号:', tag);

            return;
        }
        if (has) {
            console.error('尝试添加重复的tag:' + tag);

            return;
        }

        vm.emitToRootPath = activeRootObject;
        this._mvs.push({ tag: tag, vm: vm });

        console.log(
            "%c[HOOK]%c 添加数据模块:",
            "color: white; background: #30c14b; font-weight: bold; padding: 2px 4px; border-radius: 3px;",
            //"color: white; background: #0000FF; font-weight: bold; padding: 2px 4px; border-radius: 3px;",
            "color: #a1d11dff;",
            tag
        );


    }

    /**
     * 移除并且销毁 VM 对象
     * @param tag 
     */
    remove(tag: string) {
        let index = this._mvs.findIndex(v => v.tag === tag);
        if (index >= 0) this._mvs.splice(index, 1);
    }

    /**
     * 获取绑定的数据
     * @param tag 数据tag
     */
    get<T>(tag: string): ViewModel<T> {
        let res = this._mvs.find(v => v.tag === tag); // player
        if (res == null) {
            console.error('没有从持有的Model实例中找到对应tag', tag);
        } else {
            return res.vm;
        }
    }

    /**
     * 通过全局路径,而不是 VM 对象来 设置值
     * @param path - 全局取值路径
     * @param value - 需要增加的值
     */
    addValue(path: string, value: any) {
        path = path.trim();//防止空格,自动剔除
        let rs = path.split('.');
        if (rs.length < 2) {
            console.error('添加值的时候，路径格式错误' + path);

        };
        let vm = this.get(rs[0]);
        if (!vm) {
            console.error('添加值的时候，没有找到对应的Model:' + rs[0]);
            return;
        };
        let resPath = rs.slice(1).join('.');
        vm.setValue(resPath, vm.getValue(resPath) + value);
    }


    /**
     * 通过全局路径,而不是 VM 对象来 获取值
     * @param path - 全局取值路径
     * @param def - 如果取不到值的返回的默认值
     */
    getValue(path: string, def?: any): any {
        path = path.trim();//防止空格,自动剔除
        let rs = path.split('.'); //  主动拆分成如右侧这种形式 [player  name]
        if (rs.length < 2) {
            console.error('注册的监听键值路径不对' + path);
            return;
        };
        let vm = this.get(rs[0]);
        if (!vm) {
            console.error('没有获取到Model:' + rs[0]);

            return;
        };
        return vm.getValue(rs.slice(1).join('.'), def);
    }



    /**
     * 通过完整的监听路径来更新数据model中对应的value
     * - 例如 VM.setValue('treasure.totalRechage', 1000);
     * @param path - 全局取值路径
     * @param value - 需要设置的值
     */
    setValue(path: string, value: any) {
        path = path.trim();//防止空格,自动剔除
        let rs = path.split('.');
        if (rs.length < 2) {
            console.error('设置值的时候，路径格式错误' + path);

            return;
        };
        let vm = this.get(rs[0]);
        if (!vm) {
            console.error('设置值的时候，没有找到对应的Model:' + rs[0]);

            return;
        };

        let resPath = rs.slice(1).join('.');
        vm.setValue(resPath, value);

    }

    setObjValue = setValueFromPath;
    getObjValue = getValueFromPath;

    /**等同于 cc.director.on */
    bindPath(path: string, callback: Function, target?: any, useCapture?: boolean): void {
        path = path.trim();//防止空格,自动剔除  player.name
        if (path == '') {
            console.error(target.node.name, '节点绑定的路径为空');
            return;
        }
        if (path.split('.')[0] === '*') {
            console.error(path, '路径不合法,可能错误覆盖了 VMParent 的onLoad 方法, 或者父节点并未挂载 VMParent 相关的组件脚本');
            return;
        }
        // VC:player.name
        // console.log(
        //     "%c[HOOK]%c 绑定数据来源:",
        //     "color: white; background: #007bffff; font-weight: bold; padding: 2px 4px; border-radius: 3px;",
        //     "color: #fbd239;", // 绑定数据来源颜色
        //     VM_EMIT_HEAD + path
        // );


        cc.director.on(VM_EMIT_HEAD + path, callback, target, useCapture);
    }

    /**等同于 cc.director.off */
    unbindPath(path: string, callback: Function, target?: any): void {
        path = path.trim();//防止空格,自动剔除
        if (path.split('.')[0] === '*') {
            console.error(path, '路径不合法,可能错误覆盖了 VMParent 的onLoad 方法, 或者父节点并未挂载 VMParent 相关的组件脚本');
            return;
        }
        cc.director.off(VM_EMIT_HEAD + path, callback, target);
    }


    /**冻结所有标签的 VM，视图将不会受到任何信息 */
    inactive(): void {
        this._mvs.forEach(mv => {
            mv.vm.active = false;
        })
    }

    /**激活所有标签的 VM*/
    active(): void {
        this._mvs.forEach(mv => {
            mv.vm.active = true;
        })
    }



}



/**
 * 在 ESM 模块规范 下（import / export），是 不会返回多个实例的。
 * 彭超 新增
 */
export let VM = new VMManager();


if (CC_DEV) {
    window['VM'] = VM;
}
