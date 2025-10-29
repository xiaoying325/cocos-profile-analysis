import { VM } from './ViewModel';


/**
 * 如果指定多数据来源
 */
export const SOURCE_MULTI_KEY = 'multi_key_hook';
/**
 * 如果指定 单数据来源
 */
export const SOURCE_PATH = 'source_path';

/**
 * 多数据来源path
 */
export const SOURCE_PATHS = 'source_paths'



/**
 * 可能会影响到的其他数据来源key
 */
export const NOTIFY_SOURCE_PATHS = 'notify_source_paths'

const DEBUG_SOURCE_PATH: boolean = false;
const { ccclass } = cc._decorator;

/**
 * HOOK 组件关键字集合。（实验性功能）
 *
 * ### 使用规则
 * - **禁止**在普通节点名称中包含这些关键字。
 * - 如果需要某个节点被 HOOK，可在名称中显式使用相应关键字。
 * - **数据 model 必须与节点名称对应**，否则无法正确绑定。
 * - 如果不想使用自动化赋值，请不要使用这些关键字，手动挂载组件并指定数据来源。
 *
 * ### 关键字说明
 * - `model (md_)`  
 *   标记数据来源的 model 名称。节点必须以 `md_xxxx` 形式声明，例如 `md_camelmable`。
 *
 * - `hook (hk_)`  
 *   标记为 HOOK 节点，触发 HOOK 组件的解析逻辑。
 *
 * - `sp`  
 *   表示 HOOK 的目标是 **cc.Sprite** 组件。会自动挂载 `BundleSpriteLoad`。
 *
 * - `lb`  
 *   表示 HOOK 的目标是 **cc.Label** 组件，会自动绑定LabelHook组件。
 *
 * - `pro`  
 *   表示 HOOK 的目标是 **cc.ProgressBar** 组件。会自动绑定ProgressHook组件。
 *
 * ### 示例
 * ```ts
 * // 节点结构：
 * //   父节点：md_camelmable
 * //   子节点：hk_sp_title
 *
 * // 解析逻辑：
 * //   - `hk` → 标记为 HOOK 组件，需向上查找父节点
 * //   - `md_camelmable` → 指定数据来源 model = "camelmable"
 * //   - `sp` → 表示 HOOK cc.Sprite 组件
 * //   - 自动赋值 path = "camelmable.title"
 * //   - 自动挂载 BundleSpriteLoad 组件
 * ```
 *
 * @constant
 * @type {string[]}
 */
const HOOK_COMPONENT_HEAD = ['model', 'hook', 'sp', 'lb', 'pro'];


/**
 * Cocos Creator 生命周期执行细节：
 *
 * 1. 节点 & 组件初始化
 *    - 当场景或 prefab 反序列化时，会先创建节点对象并挂载组件实例，同时恢复序列化属性。
 *    - 此时节点与组件实例已存在，但生命周期回调（onLoad、start 等）尚未执行。
 *
 * 2. onLoad
 *    - 当场景加载并遍历到该组件时调用。
 *    - 调用时机是：节点树已经构建完成，所有子节点和组件都已经创建并挂载。
 *    - 调用时，该节点上的所有组件均已实例化（可通过 this.getComponent() 获取）。
 *    - 但同级或其他节点的 onLoad 不保证已执行完毕（按递归顺序逐个执行）。
 *
 * 3. onEnable
 *    - 在所有组件的 onLoad 都执行完毕后，批量调用。
 *    - 此时可以认为整个场景的节点与组件已完成加载（仅可能有的处于禁用状态）。
 *
 * 4. start
 *    - 在所有 onLoad 与 onEnable 执行后统一调用。
 *    - 在该阶段，几乎可以安全访问场景中的所有节点和组件。
 *
 *总结：
 * - onLoad：本节点已准备好（但其他节点未必）。
 * - onEnable：场景中所有组件已初始化。
 * - start：所有人都已到位，可以开始逻辑。
 */




/**
 * MVVM实现通知数据的基础类
 * - 理论上来说，虽然我们用了数据劫持，但还是建议，能合并的数据变化，尽量合并到一个劫持组件中
 * 
 * - 关于性能问题，我gpt了下，得到的结论和我预期是一致的
 * - 就是说在正常的业务需求场景中，就是即使劫持的数据变化很多，对于性能的影响也是可控的，或者说是可以忽略不计的，当然后续也可以采用手段优化下
 * 
 * - 如果想执行默认初始化，那你就让子类重写start方法，调用onValueInit
 * * 同一个节点上，不允许绑定多个集成了BaseHook的组件，
 * 若有疑问，联系@彭超
 */
@ccclass
export default class BaseHook extends cc.Component {

    /**
     * 数据来源
     * - 也就是你指定监听的数据model中对应的key
     */
    public source_path: string = '';

    /**
     * 多重数据来源
     * - 该功能实现中，暂不建议使用！！！

     */
    protected source_paths: string[] = [];

    /**
     * 是否启用劫持多个数据key
     * - 该功能实验性，不建议使用
     */
    public multi_key_hook: boolean = false;

    /**
     * VM核心
     */
    public VM = VM;


    protected temp_values: any[] = [];


    /**
     * 如果需要重写onLoad 方法，请根据顺序调用 super.onLoad()，执行默认方法
     */
    onLoad() {
        if (CC_EDITOR) {
            return;
        }
        let paths = this.source_path.split('.');

        /**
         * 如果指定的是单数据来源的,检查下，有没有带*号
         * 比如 source_path = "camelmable.title"
         * [
         *  0: "camelmable"
         *  1: "title"
         * ]
         */

        for (let i = 1; i < paths.length; i++) {
            const p = paths[i];
            //如果发现了路径使用了 * ，则自动去自己的父节点查找自己所在 index 值
            if (p == '*') {
                let index = this.node.getParent().children.findIndex(n => n === this.node);
                if (index <= 0) {
                    index = 0;
                }
                paths[i] = index.toString();  // 最后处理成 path.1 path.2 path.3 这种形式，主要是为了方便节点下有多个相同的组件，然后从列表中取出数据
                break;
            }
        }

        //替换掉原路径
        this.source_path = paths.join('.');

        //如果指定了多重数据源的,检查下，有没有带*号
        /**
         *  [
                0: "camelmable.title1"
                1: "camelmable.title2"
            ] 
         */
        let pathArr = this.source_paths;
        if (pathArr.length >= 1) {
            for (let i = 0; i < pathArr.length; i++) {
                const path = pathArr[i];
                let paths = path.split('.'); // ["camelmable" ,"title1"]

                for (let i = 1; i < paths.length; i++) {
                    const p = paths[i];
                    if (p == '*') {
                        let index = this.node.getParent().children.findIndex(n => n === this.node);
                        if (index <= 0) {
                            index = 0;
                        }

                        paths[i] = index.toString();
                        break;
                    }

                }
                this.source_paths[i] = paths.join('.'); // "camelmable.title1"
            }
        }

        //打印出所有绑定的路径，方便调试信息
        if (DEBUG_SOURCE_PATH && CC_DEBUG) {
            console.log('所有路径', this.source_path ? [this.source_path] : this.source_paths, '<<', this.node.getParent().name + '.' + this.node.name)
        }

        if (this.source_path == '' && this.source_paths.join('') == '') {
            console.log('劫持组件未设置数据来源，请按照右侧日志输出检查:', this.node.getParent().name + '.' + this.node.name);
        }



    }


    /**
     * 在所有 onLoad 都执行完之后，才会批量执行 onEnable。
     * - 为什么要放到onEnable中，因为在onLoad注册，同一父节点下的 其他兄弟节点，不一定已经走完 onLoad（因为是逐个递归调用）,但是onEnable就不一样，在这里调用，可以确信，是全部走完了的
     * - 特别是对于DataHook组件来说，必须要放到onEnable中，才能确保，所有的数据来源，都已经注册完成
     * @returns 
     */
    protected onEnable(): void {

        // console.log(`${this.node.name}_Base Hook onEnable`)

        if (CC_EDITOR) {
            return;
        }
        if (this.multi_key_hook) {
            this.sources_event(true);
        } else if (this.source_path != '') {
            this.VM.bindPath(this.source_path, this.onValueChanged, this);
        }
    }


    protected onDisable(): void {
        //console.log(`${this.node.name}_Base Hook onDisable`)
        if (CC_EDITOR) {
            return;
        }
        if (this.multi_key_hook) {
            this.sources_event(false);
        } else if (this.source_path != '') {
            this.VM.unbindPath(this.source_path, this.onValueChanged, this);
        }
    }




    /**
     * 添加多个数据来源的事件监听

     * @param enabled 
     * @returns 
     */
    private sources_event(enabled: boolean = true) {
        if (CC_EDITOR) {
            return;
        }
        let arr = this.source_paths;
        for (let i = 0; i < arr.length; i++) {
            const path = arr[i];
            if (enabled) {
                this.VM.bindPath(path, this.onValueChanged, this);
            } else {
                this.VM.unbindPath(path, this.onValueChanged, this);
            }
        }
    }



    /**
     * 初始化时
     * - 提供给子类重写
     */
    protected onValueInit() { }


    /**
     * 当VM发现数据变化时
     * - 提供给子类重写
     * @param n 
     * @param o 
     * @param pathArr 
     */
    protected onValueChanged(n, o, pathArr: string[]) { }

}
