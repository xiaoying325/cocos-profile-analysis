

import BaseHook, { SOURCE_MULTI_KEY, SOURCE_PATH, SOURCE_PATHS } from "../hook/BaseHook";

// 比较条件:,如果传入值 > /< />= /<= /== 某值时，执行的action类型

const { ccclass, property, executeInEditMode, menu, help } = cc._decorator;


enum FILTER_MODE {
    "none",
    "==", //正常计算，比较 等于
    "!=", //正常计算，比较 不等于
    ">",  //正常计算，比较>
    ">=", //正常计算，比较>=
    "<",  //正常计算，比较<
    "<=", // 正常计算，比较>=
}

/**
 * 数据来源变化是，用EvenHook可以关联到特定组件的事件上面
 * -比如 粒子系统，有resetSytem事件，那你就可以关联这个事件，当某个数据来源发生变化时，就会触发这个事件
 * -还有就是，你自定义的脚本也可可以关联到事件上面 若有疑问，联系@彭超
 */
@ccclass
@executeInEditMode
@menu('实验性/组件/添加特殊事件数据劫持组件')
@help('https://chatgpt.com/')
export default class EventHook extends BaseHook {

    @property({
        displayName: '多重数据来源',

        tooltip: '多重数据来源'
    })
    public multi_key_hook: boolean = false;

    @property({
        displayName: "数据来源",
        tooltip: '监听获取值的路径',
        visible: function () {
            return this.multi_key_hook === false
        }
    })
    source_path: string = "";

    @property({
        displayName: '触发一次',
        tooltip: '触发一次后会自动关闭该事件'
    })
    triggerOnce: boolean = false;

    @property({
        displayName: '多重数据来源',
        tooltip: '监听获取值的多条路径,这些值的改变都会通过这个函数回调,请使用 pathArr 区分获取的值 ',
        type: [cc.String],
        visible: function () {
            return this.multi_key_hook === true
        }
    })
    protected source_paths: string[] = [];

    @property({
        displayName: '过滤模式',

        tooltip: '过滤模式，会根据条件过滤掉事件的触发',
        type: cc.Enum(FILTER_MODE)
    })
    public filterMode: FILTER_MODE = FILTER_MODE.none;

    @property({
        displayName: "比较值",

        visible: function () {
            return this.filterMode !== FILTER_MODE.none
        }
    })
    public compareValue: string = '';


    @property(
        {
            displayName: "事件列表",
            type: [cc.Component.EventHandler]
        }

    )
    changeEvents: cc.Component.EventHandler[] = [];


    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    onValueInit() {

    }

    onValueChanged(newVar: any, oldVar: any, pathArr: any[]) {
        let res = this.conditionCheck(newVar, this.compareValue);
        if (!res) {
            return;
        }

        if (Array.isArray(this.changeEvents)) {
            this.changeEvents.forEach(v => {
                v.emit([newVar, oldVar, pathArr]); // 触发所有关联的事件
            })
        }

        //激活一次后，自动关闭组件，就相当于once事件
        if (this.triggerOnce === true) {
            this.enabled = false;
        }
    }


    /**条件检查 */
    private conditionCheck(a, b): boolean {
        let cod = FILTER_MODE;

        switch (this.filterMode) {
            case cod.none:
                return true;
            case cod["=="]:
                if (a == b) return true;
                break;
            case cod["!="]:
                if (a != b) return true;
                break;
            case cod["<"]:
                if (a < b) return true;
                break;
            case cod[">"]:
                if (a > b) return true;
                break;
            case cod[">="]:
                if (a >= b) return true;
                break;
            case cod["<"]:
                if (a < b) return true;
                break;
            case cod["<="]:
                if (a <= b) return true;
                break;

            default:
                break;
        }

        return false;
    }

    // update (dt) {}
}

