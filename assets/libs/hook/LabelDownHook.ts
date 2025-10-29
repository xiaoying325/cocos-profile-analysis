
import BaseHook from './BaseHook';



const { ccclass, property, menu, help } = cc._decorator;

enum LABEL_TYPE {
    CC_LABEL,
    CC_RICH_TEXT,
    CC_EDIT_BOX
}


/**
 * 用来处理文本倒计时功能的
 * - 只接受时间,单位：毫秒！！，不接受 "2025-09-27 00:00:00" 这种形式，如果是这种形式，请你提前转换好，另外需要注意的是，这里时间单位是以毫秒计算的，服务器返回给你的可能是时间戳，需要乘以1000
 */
@ccclass
@menu('实验性/组件/3.添加倒计时劫持组件')
@help('https://chatgpt.com/')
export default class LabelDownHook extends BaseHook {

    @property({
        displayName: "数据来源",
        tooltip: '当数据来源更新时，此组件会自动更新',

    })
    source_path: string = "";

    @property({
        displayName: "数据来源B",
        tooltip: '当数据来源更新时，此组件会自动更新',

    })
    source_path_b: string = "";


    @property({
        displayName: "组件类型",
        type: cc.Enum(LABEL_TYPE),
    })
    private type: LABEL_TYPE = LABEL_TYPE.CC_LABEL;

    private component: cc.Label | cc.RichText | cc.EditBox = null;

    default_text: string = null;
    time_stamp: number = 0;   // 倒计时目标时间戳（毫秒）
    private _accum: number = 0; // 计时器，用于控制 1 秒更新一次

    private server_ms: number = 0;  //服务器返回的标准客户端时间

    getLabel() {
        if (this.type === LABEL_TYPE.CC_LABEL) {
            this.component = this.getComponent(cc.Label)
            if (!this.component) {
                console.error('没有挂载cc.Label组件,将自动挂载该组件');
                this.component = this.node.addComponent(cc.Label);
            }
        } else if (this.type === LABEL_TYPE.CC_RICH_TEXT) {
            this.component = this.getComponent(cc.RichText)
            if (!this.component) {
                console.error('没有挂载cc.RichText组件,将自动挂载该组件');
                this.component = this.node.addComponent(cc.RichText);
            }
        } else if (this.type === LABEL_TYPE.CC_EDIT_BOX) {
            this.component = this.getComponent(cc.EditBox)
            if (!this.component) {
                console.error('没有挂载cc.EditBox组件,将自动挂载该组件');
                this.component = this.node.addComponent(cc.EditBox);
            }
        }
    }

    onLoad() {
        super.onLoad();
        this.getLabel();
    }

    start(): void {
        this.onValueInit();
    }

    onValueInit() {
        let value = this.VM.getValue(this.source_path);

        this.time_stamp = value;

        let server_ms = this.VM.getValue(this.source_path_b);
        if (server_ms) {
            this.server_ms = server_ms;
        } else {
            server_ms = Date.now(); //如果服务器没有返回标准的大区时间戳，则退而求其次用客户端本地的
        }
        this.server_ms = server_ms;

        console.log('LabelHook onValueInit', value, server_ms)
        this.refreshLabel();
    }

    /**
     * 格式化时间
     * - >=1天 => xxDxxH
     * - <1天 且 >=1小时 => xxHxxM
     * - <1小时 => xxMxxS
     */
    format(ms: number): string {
        if (ms <= 0) {
            return "00:00";
        }
        let sec = Math.floor(ms / 1000);
        let min = Math.floor(sec / 60);
        let hour = Math.floor(min / 60);
        let day = Math.floor(hour / 24);

        sec = sec % 60;
        min = min % 60;
        hour = hour % 24;

        // 补零函数
        const pad = (n: number) => n < 10 ? "0" + n : n.toString();

        if (day > 0) {
            return `${pad(day)}D:${pad(hour)}H`;
        } else if (hour > 0) {
            return `${pad(hour)}H:${pad(min)}M`;
        } else {
            return `${pad(min)}M:${pad(sec)}S`;
        }
    }

    /**
     * 刷新 UI 显示
     */
    refreshLabel() {
        let remain = (this.time_stamp - this.server_ms); // 剩余毫秒
        //let remain = this.time_stamp - Date.now()
        let str = this.format(remain);

        if (this.component instanceof cc.Label) {
            this.component.string = str;
        } else if (this.component instanceof cc.RichText) {
            this.component.string = str;
        } else if (this.component instanceof cc.EditBox) {
            this.component.string = str;
        }
    }

    update(dt: number): void {
        if (!this.time_stamp) {
            return;
        }
        this._accum += dt;
        if (this._accum >= 1) {   // 每秒更新一次
            this._accum = 0;
            this.refreshLabel();
        }
    }

    onValueChanged(n, o, pathArr: string[]) {
        this.time_stamp = n;
        this.refreshLabel();
    }
}
