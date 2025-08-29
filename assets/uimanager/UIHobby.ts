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
    public uiName: string;


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


    public onFocus(): void {
        console.log('UIHobby onFocus');
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
