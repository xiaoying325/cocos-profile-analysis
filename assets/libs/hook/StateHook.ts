import BaseHook from './BaseHook';
import { VM } from './ViewModel';

enum CONDITION {
    /**
     * 等于
     */
    "==",
    /**
     * 不等于
     */
    "!=",
    /**
     * 大于
     */
    ">",
    /**
     * 大于等于
     */
    ">=",
    /**
     * 小于
     */
    "<",
    /**
     * 小于等于
     */
    "<=",
    /**
     * 范围
     */

    "range",
    /**
     * 双值监听
     */
    "double",
}


enum ACTION {
    /**
     * 节点激活
     */
    /**
     * 节点激活
     */
    NODE_ACTIVE,
    /**
     * 节点显示
     */
    NODE_VISIBLE,
    /**
     * 节点不透明度
     */
    NODE_OPACITY,
    /**
     * 节点颜色
     */
    NODE_COLOR,
    /**
     * 自定义组件
     */
    //COMPONENT_CUSTOM,
}


enum CHILD_MODE_TYPE {
    NODE_INDEX,
    NODE_NAME
}

const { ccclass, property, menu, executeInEditMode, help } = cc._decorator;
/**
 * 监听状态数据变换,根据给定条件设置节点是否激活  若有疑问，联系@彭超
 */
@ccclass
//@executeInEditMode
@menu('实验性/组件/4.添加状态数据劫持组件')
@help('https://chatgpt.com/')
export default class StateHook extends BaseHook {

    /**
     * 数据来源A
     */
    @property({
        displayName: '数据来源',

        visible: function () {
            return this.multi_key_hook === false;
        }
    })
    source_path: string = "";


    /**
     * 单值监听b
     */

    @property({
        displayName: '数据来源B',

        visible: function () {
            return this.condition === CONDITION.double
        }
    })
    source_path_b: string = "";


    /**
     * 是否启用遍历子节点模式
     */
    @property({
        displayName: '启用遍历子节点模式',
        tooltip: '遍历子节点,根据子节点的名字或名字转换为值，判断值满足条件 来激活'
    })
    foreachChildMode: boolean = false;

    @property({
        displayName: '对比条件',
        type: cc.Enum(CONDITION),
    })
    condition: CONDITION = CONDITION["=="];

    @property({
        displayName: "指定子节点模式",
        type: cc.Enum(CHILD_MODE_TYPE),
        tooltip: '遍历子节点,根据子节点的名字转换为值，判断值满足条件 来激活',
        visible: function () {
            return this.foreachChildMode === true
        }
    })
    foreachChildType: CHILD_MODE_TYPE = CHILD_MODE_TYPE.NODE_INDEX;


    /**
     * 值a
     */
    @property({
        displayName: '对比数据A',
        visible: function () {
            return this.foreachChildMode === false
        }
    })
    valueA: number = 0;



    /**
     * 值b
     */
    @property({
        displayName: '对比数据B',
        visible: function () {
            return (this.foreachChildMode === false && this.condition === CONDITION.range)
        }
    })
    valueB: number = 0;



    @property({
        displayName: '执行行为',

        type: cc.Enum(ACTION),
        tooltip: '一旦满足条件就对节点执行操作'
    })
    valueAction: ACTION = ACTION.NODE_ACTIVE;



    @property({
        visible: function () {
            return this.valueAction === ACTION.NODE_OPACITY
        },
        range: [0, 255],
        type: cc.Integer,
        displayName: '节点透明度'
    })
    valueActionOpacity: number = 0;

    @property({
        visible: function () {
            return this.valueAction === ACTION.NODE_COLOR
        },
        displayName: '节点颜色'
    })
    valueActionColor: cc.Color = cc.color(155, 155, 155);

    @property({
        displayName: "节点数组",
        type: [cc.Node],
        tooltip: '需要执行条件的节点，如果不填写则默认会执行本节点以及本节点的所有子节点 的状态'
    })
    watchNodes: cc.Node[] = [];


    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        super.onLoad();
        //如果数组里没有监听值，那么默认把所有子节点给监听了
        if (this.watchNodes.length == 0) {
            if (this.valueAction !== ACTION.NODE_ACTIVE && this.foreachChildMode === false) {
                this.watchNodes.push(this.node);
            }
            this.watchNodes = this.watchNodes.concat(this.node.children);
        }


    }



    start() {
        this.onValueInit()
    }


    protected onValueInit() {
        let value = VM.getValue(this.source_path);
       // console.error(`${this.source_path}对应的值:`, value);
        this.check(value);
    }


    protected onValueChanged(newVar: any, oldVar: any, pathArr: any[]) {
        this.check(newVar);

    }


    /**
     * 检查节点值更新
     * @param value  传入的值
     */
    private check(value) {
        if (this.foreachChildMode) {  //先看下选择的对比类型，
            this.watchNodes.forEach((node, index) => {
                let v;
                if (this.foreachChildType === CHILD_MODE_TYPE.NODE_INDEX) { //如果是使用子节点index来做比较
                    v = index;
                } else if (this.foreachChildType === CHILD_MODE_TYPE.NODE_NAME) {  //如果是使用子节点名称来做比较
                    v = node.name;
                }
                let check = this.conditionCheck(value, v);
                this.setNodeState(node, check);
            })
        } else {


            if (this.condition === CONDITION.double) { //如果启用了单值监听b
                this.valueB = VM.getValue(this.source_path_b);
                console.log('单值监听b', this.valueB);
            }

            // 如果没有启用遍历子节点模式，我们就按照设置好的比较条件去进行处理
            let check = this.conditionCheck(value, this.valueA, this.valueB);
            this.setNodesStates(check);
        }
    }


    /**
     * 根据对比条件，更新节点的状态
     * @param checkState 
     */
    private setNodesStates(checkState?: boolean) {
        let nodes = this.watchNodes;
        let check = checkState;
        nodes.forEach((node) => {
            this.setNodeState(node, check);
        })
    }

    /**
     * 更新单个节点的状态
     * @param node 要更新的节点
     * @param status 要更新的状态 值只可能为true or false

     */
    private setNodeState(node: cc.Node, status?: boolean) {
        // valueAction是我们当前选定的节点状态变化的方式，比如是隐藏呀，还是显示呀，还是透明度变化呀等等
        switch (this.valueAction) {
            case ACTION.NODE_ACTIVE:
                node.active = status;
                break;
            case ACTION.NODE_VISIBLE:
                node.opacity = status ? 255 : 0;
                break;
            case ACTION.NODE_COLOR:
                node.color = status ? this.valueActionColor : cc.color(255, 255, 255);
                break;
            case ACTION.NODE_OPACITY:
                node.opacity = status ? this.valueActionOpacity : 255;
                break;
            default:
                break;
        }
    }


    /**
     * 条件检查
     * @param v 要检查的值
     * @param a 比较值a
     * @param b 比较值b （只有当条件类型为范围是，才会使用到b值）
     * @returns 
     */
    private conditionCheck(v, a, b?): boolean {
        switch (this.condition) {
            case CONDITION["=="]:
                if (v == a) return true;
                break;
            case CONDITION["!="]:
                if (v != a) return true;
                break;
            case CONDITION["<"]:
                if (v < a) return true;
                break;
            case CONDITION[">"]:
                if (v > a) return true;
                break;
            case CONDITION[">="]:
                if (v >= a) return true;
                break;
            case CONDITION["<"]:
                if (v < a) return true;
                break;
            case CONDITION["<="]:
                if (v <= a) return true;
                break;
            case CONDITION["range"]:  // 只有当条件类型为范围是，才会使用到b值
                if (v >= a && v <= b) return true;
                break;
            case CONDITION["double"]:  // 只有当条件类型双值监听时，才会使用到b值，当v大于当前组件设置的a值，且a大于给定的b值，才返回true
                if (v >= a && a > b) return true;
                break;

        }

        return false;
    }
}
