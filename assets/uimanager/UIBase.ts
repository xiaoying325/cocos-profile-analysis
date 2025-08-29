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

     */
    public onFocus(...params: any[]) {

    }



}
