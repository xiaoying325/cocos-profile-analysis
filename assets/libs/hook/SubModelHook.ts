import BaseHook, { NOTIFY_SOURCE_PATHS, SOURCE_MULTI_KEY, SOURCE_PATH, SOURCE_PATHS } from "../hook/BaseHook";
import { VM } from './ViewModel';



const { ccclass, executionOrder, menu, help } = cc._decorator;


/**
 * 针对局部内的组件进行数据劫持操作
 *
 * **使用建议：**
 * - 所有需要使用该组件的地方，建议新建一个类并继承它，例如：
 *   `class PlayerSubModelHook extends SubModelHook`
 * - 使用 `SubModelHook` 时，不允许将同一份数据同时注册到多个子模块。
 *   比如 `playerData` 已注册给 A 模块，又注册给 B 模块，那么最终只会 B 生效。
 *   这是因为在 `JsonObj` 中劫持数据时会产生以下问题：
 *
 * **潜在问题：**
 * 1. **重复定义 getter/setter**
 *    - `observe` 中使用 `Object.defineProperty` 劫持属性。
 *    - 如果同一个 `obj.key` 被劫持第二次，会覆盖第一次定义的 getter/setter。
 *    - 原先闭包里的 `oldVal` 丢失，依赖追踪链路断开。
 *
 * 2. **数组原型被多次覆盖**
 *    - `overrideArrayProto` 会执行 `array.__proto__ = overrideProto`。
 *    - 多次调用会反复覆盖 `__proto__`，导致：
 *      - 每次 `push` / `splice` 都重新触发 `observe`。
 *      - 回调可能多次执行。
 *      - 递归调用，性能下降。
 *
 * 3. **回调可能多次触发**
 *    - 如果对同一对象创建了多个 `JsonOb`，如：
 *      ```ts
 *      new JsonOb(obj, cb1);
 *      new JsonOb(obj, cb2);
 *      ```
 *    - 属性的 getter/setter 只会保留最后一次定义 → 仅 `cb2` 生效。
 *    - 但数组方法的劫持可能让两个回调都触发，表现不一致。
 *
 * 4. **性能与内存隐患**
 *    - 每次 `observe` 都会深度遍历对象/数组。
 *    - 重复劫持会造成无限嵌套代理。
 *    - 对大对象拖慢性能，甚至可能导致 **递归栈溢出**（尤其有循环引用时）。
 */

@ccclass
@menu('实验性/组件/5.添加子模块数据劫持组件')
@help('https://chatgpt.com/')
@executionOrder(-1)
export default class SubModelHook extends cc.Component {

    /**绑定的标签，可以通过这个tag 获取 当前的 vm 实例 */
    protected tag: string = '_submodel';

    /**需要绑定的私有数据 */
    protected data: any = {};

    /**VM 管理 */
    public VM = VM;



    protected onLoad() {
        if (this.data == null) {
            return;
        }
        this.tag = '_submodel' + '<' + this.node.uuid.replace('.', '') + '>'; //uuid是唯一的
        VM.add(this.data, this.tag);

        //搜寻所有节点：找到 watch path
        let comps = this.getBaseHookComponents();
        //console.group();
        for (let i = 0; i < comps.length; i++) {
            const comp = comps[i];
            this.replace(comp, this.tag)
        }
        //console.groupEnd()
        this.onBind();
    }



    /**
     * 在ONload执行之前，就要把数据赶紧灌进来，这样才能利用引擎的时序
     * @param data 
     */
    init(data: any) {
        this.data = data;
    }





    protected onBind() {

    }

    protected onUnBind() {

    }


    private replace(comp: cc.Component, tag: string) {
        let path: string = comp[SOURCE_PATH];

        if (comp[SOURCE_MULTI_KEY] == true) {
            let pathArr: string[] = comp[SOURCE_PATHS];
            if (pathArr) {
                for (let i = 0; i < pathArr.length; i++) {
                    const path = pathArr[i];
                    pathArr[i] = path.replace('*', tag);
                }
            }
        } else {
            //把*.nickName 替换成 _temp<Node788>.nickName
            if (path.split('.')[0] === '*') {
                comp[SOURCE_PATH] = path.replace('*', tag);
            }
        }



        /**
         * 如果存在可能影响到其他数据源的，这里可以处理下，如果没有就不管，也不会影响
         */
        if (comp[NOTIFY_SOURCE_PATHS]) {

            let pathArr: string[] = comp[NOTIFY_SOURCE_PATHS];
            if (pathArr) {
                for (let i = 0; i < pathArr.length; i++) {
                    const path = pathArr[i];
                    pathArr[i] = path.replace('*', tag);
                }
            }

            console.log("当前组件存在可能影响其他的数据来源", comp[NOTIFY_SOURCE_PATHS], path)
        }
    }




    /**
     * 从自身节点，以及子节点身上查找到所有继承了BaseHook的组件
     * - 说白了，也就是我需要收集当前节点及其子节点中挂载的所有 BaseHook 组件，但如果某个 BaseHook 是属于另一个 SubModelHook 管理的，那我就不处理它，主要就是为了做隔离
     * @returns 
     */
    private getBaseHookComponents() {
        let result: BaseHook[] = [];

        // 1. 找出当前节点及所有子节点上的 BaseHook 组件
        let allBaseComponents = this.node.getComponentsInChildren(BaseHook);

        // 2. 找出当前节点及其子节点上的所有 SubModelHook 组件
        let allSourceComponents = this.node.getComponentsInChildren(SubModelHook);

        // 用来保存被排除的 BaseHook 组件（也就是挂在其他 SubModelHook 节点下的 BaseHook
        let baseToExclude: BaseHook[] = [];

        for (let i = 0; i < allSourceComponents.length; i++) {
            let src = allSourceComponents[i];

            // 排除当前节点自己挂的 SubModelHook
            if (src.uuid === this.uuid) {
                continue;
            }

            // 对其他挂载了 SubModelHook 的节点，找它自己和它的子节点中的 base 组件
            let baseInThisSource = src.getComponentsInChildren(BaseHook);
            for (let j = 0; j < baseInThisSource.length; j++) {
                baseToExclude.push(baseInThisSource[j]);
            }
        }

        // 3. 遍历所有找到的 BaseHook 组件，如果它不在排除列表里，就保留
        for (let i = 0; i < allBaseComponents.length; i++) {
            let b = allBaseComponents[i];
            let flag = false;

            for (let j = 0; j < baseToExclude.length; j++) {
                if (baseToExclude[j] === b) {
                    flag = true;
                    break;
                }
            }

            if (!flag) {
                result.push(b);
            }
        }

        return result;  //只处理我这个节点的BaseHook组件，不过还是建议挂载的SubModelHook的，下面所有的子节点的BaseHook的数据来源都是来自于这个SubModelHook,就不要在子节点上再挂SubModelHook了
    }




    protected onDestroy() {
        this.onUnBind();
        //解除全部引用
        VM.remove(this.tag);
        this.data = null;
    }

}
