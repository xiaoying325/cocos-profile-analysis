// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import UIBase from "./UIBase";
import { UILayer } from "./UIConfig";
import UIManager from "./UIManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class UIHobby extends UIBase {
    public uiName: string = "UIHobby";


    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}


    onCloseClick() {
        UIManager.instance.close(this.uiConf.url);


        
        setTimeout(() => {
            let newData = { key: "网络数据2" }
            UIManager.instance.open({
                bundle: 'resources',
                url: 'prefabs/hobby/UIHobby',
                layer: UILayer.NORMAL,
                isCache: true,
            }, newData)

        }, 2000);

    }


    public onShow(...params: any[]): void {
        console.log('UIHobby onShow', ...params);

    }


    public onFocus(...params: any[]): void {
        console.log('UIHobby onFocus', ...params);
        
        // 调用父类的onFocus
        super.onFocus(...params);
        
        // 实现具体的焦点处理逻辑
        this.onFocusGained(...params);
    }

    protected onFocusGained(...params: any[]): void {
        console.log('UIHobby 获得焦点，可以在这里刷新数据或更新UI状态');
        
        // 示例：刷新数据
        // this.refreshData();
        
        // 示例：重新绑定事件
        // this.bindEvents();
        
        // 示例：更新UI状态
        // this.updateUIState();
    }

    public onFocusLost(...params: any[]): void {
        console.log('UIHobby 失去焦点，可以在这里暂停动画或保存状态');
        
        // 调用父类的onFocusLost
        super.onFocusLost(...params);
        
        // 示例：暂停动画
        // this.pauseAnimations();
        
        // 示例：保存当前状态
        // this.saveCurrentState();
        
        // 示例：解绑事件监听
        // this.unbindEvents();
    }


    public onHide(): void {
        console.log('UIHobby onHide');
    }


    public onClose(): void {
        console.log('UIHobby onClose');
    }

    start() {

    }

    // update (dt) {}
}
