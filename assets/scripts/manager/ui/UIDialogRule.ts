// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import UIBase from "./UIBase";

const {ccclass, property} = cc._decorator;

@ccclass
export default class UIDialogRule extends UIBase {
    public uiName: string = "UIDialogRule";


    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    public onFocus(...params: any[]): void {
        console.log('UIDialogRule onFocus', ...params);
        
        // 调用父类的onFocus
        super.onFocus(...params);
        
        // 实现具体的焦点处理逻辑
        this.onFocusGained(...params);
    }

    protected onFocusGained(...params: any[]): void {
        console.log('UIDialogRule 获得焦点，可以在这里刷新规则数据');
        
        // 示例：刷新规则数据
        // this.refreshRuleData();
    }

    start () {

    }

    // update (dt) {}
}
