// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { UIConfig } from "./UIConfig";

const { ccclass, property } = cc._decorator;

@ccclass
export default abstract class UIBase extends cc.Component {


    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    // start () {

    // }

    // update (dt) {}


    public uiConf: UIConfig;


    /**
     * UI的位移标识
     */
    public abstract uiName: string;

    /**
     * 当这个UI被打开时，会被主动调用，
     * - UI真正被你看到的
     * @param params 
     */
    public onShow(...params: any[]) {

    }

    /**
     * 当UI被隐藏的时候
     * - 只关闭 ，不销毁prefab实例资源，缓存到内存中，方便下次快速加载
     * @param params 
     */
    public onHide(...params: any[]) {

    }


    /**
     * 当UI被销毁的时候
     * - 会被主动调用
     * @param params 
     */
    public onClose(...params: any[]) {
    }


    /**
     * 当UI被重新聚焦的时候调用
     * - 比如从其他UI切换回来的时候
     * - 当UI重新获得焦点时
     * - 当用户从其他界面返回到当前UI时
     * 
     * 子类可以重写此方法来实现具体的焦点处理逻辑
     * 例如：刷新数据、重新绑定事件、更新UI状态等
     */
    public onFocus(...params: any[]) {
        // 默认实现：输出调试信息
        if (this.uiName) {
            console.log(`UI [${this.uiName}] 获得焦点`, ...params);
        } else {
            console.log(`UI [${this.uiConf?.url || 'Unknown'}] 获得焦点`, ...params);
        }
        
        // 子类可以重写此方法来实现具体的焦点处理逻辑
        // 例如：
        // - 刷新数据
        // - 重新绑定事件监听
        // - 更新UI状态
        // - 播放焦点动画
        // - 重新计算布局等
    }

    /**
     * 检查当前UI是否获得焦点
     */
    public isFocused(): boolean {
        // 这里需要导入UIManager，但为了避免循环依赖，我们通过其他方式判断
        // 子类可以重写此方法来实现更精确的焦点判断
        return this.node && this.node.active;
    }

    /**
     * 获取焦点时的通用处理
     * 子类可以重写此方法来实现具体的焦点处理逻辑
     */
    protected onFocusGained(...params: any[]) {
        // 默认空实现，子类可以重写
    }

    /**
     * 失去焦点时的通用处理
     * 子类可以重写此方法来实现具体的失焦处理逻辑
     */
    public onFocusLost(...params: any[]) {
        // 默认实现：输出调试信息
        if (this.uiName) {
            console.log(`UI [${this.uiName}] 失去焦点`, ...params);
        } else {
            console.log(`UI [${this.uiConf?.url || 'Unknown'}] 失去焦点`, ...params);
        }
        
        // 子类可以重写此方法来实现具体的失焦处理逻辑
        // 例如：
        // - 暂停动画或音效
        // - 保存当前状态
        // - 解绑事件监听
        // - 清理临时数据等
    }

}
