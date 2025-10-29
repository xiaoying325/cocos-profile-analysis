import BaseHook from "./BaseHook";



const { ccclass, property, menu, help } = cc._decorator;

/**限制值边界范围的模式 */
enum CLAMP_MODE {
    MIN,
    MAX,
    MIN_MAX,
}

/**
 * 动态快速的修改模型的数值,使用按钮 绑定该组件上的函数，即可动态调用
 * 修改 Model 的值 若有疑问，联系@彭超
 */
@ccclass
@menu('实验性/组件/添加快速修改数据源组件')
export default class ModifyHook extends BaseHook {


    source_path: string = "";

    @property()
    valueClamp: boolean = false;

    @property({
        type: cc.Enum(CLAMP_MODE),
        visible: function () { return this.valueClamp === true }
    })
    valueClampMode: CLAMP_MODE = CLAMP_MODE.MIN_MAX;

    @property({
        visible: function () { return this.valueClamp === true && this.valueClampMode !== CLAMP_MODE.MAX }
    })
    valueMin: number = 0;

    @property({
        visible: function () { return this.valueClamp === true && this.valueClampMode !== CLAMP_MODE.MIN }
    })
    valueMax: number = 1;

    // LIFE-CYCLE CALLBACKS:

    start() {

    }

    //限制最终结果的取值范围
    private clampValue(res) {
        let min = this.valueMin;
        let max = this.valueMax;
        if (this.valueClamp == false) {
            return res;
        }
        switch (this.valueClampMode) {
            case CLAMP_MODE.MIN_MAX:
                if (res > max) res = max;
                if (res < min) res = min;
                break;
            case CLAMP_MODE.MIN:
                if (res < min) res = min;
                break;
            case CLAMP_MODE.MAX:
                if (res > max) res = max;
                break;
            default:
                break;
        }

        return res;
    }


    vAddInt(e, data) {
        this.vAdd(e, data, true);
    }

    vSubInt(e, data) {
        this.vSub(e, data, true);
    }

    vMulInt(e, data) {
        this.vMul(e, data, true);
    }

    vDivInt(e, data) {
        this.vDiv(e, data, true);
    }

    vAdd(e: cc.Event, data: any, int: boolean = false) {
        let a = parseFloat(data);
        let res = this.VM.getValue(this.source_path, 0) + a;
        if (int) { res = Math.round(res) }
        this.VM.setValue(this.source_path, this.clampValue(res));
    }

    vSub(e, data: any, int: boolean = false) {
        let a = parseFloat(data);
        let res = this.VM.getValue(this.source_path, 0) - a;
        if (int) { res = Math.round(res) }
        this.VM.setValue(this.source_path, this.clampValue(res));
    }

    vMul(e, data: any, int: boolean = false) {
        let a = parseFloat(data);
        let res = this.VM.getValue(this.source_path, 0) * a;
        if (int) { res = Math.round(res) }
        this.VM.setValue(this.source_path, this.clampValue(res));
    }

    vDiv(e, data: any, int: boolean = false) {
        let a = parseFloat(data);
        let res = this.VM.getValue(this.source_path, 0) / a;
        if (int) { res = Math.round(res) }
        this.VM.setValue(this.source_path, this.clampValue(res));
    }

    vString(e, data: any) {
        let a = data;
        this.VM.setValue(this.source_path, a);
    }

    vNumberInt(e, data: any) {
        this.vNumber(e, data, true);
    }

    vNumber(e, data: any, int: boolean = false) {
        let a = parseFloat(data);
        if (int) { a = Math.round(a) }
        this.VM.setValue(this.source_path, this.clampValue(a));
    }

    // update (dt) {}
}
