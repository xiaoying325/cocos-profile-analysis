// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { UILayer } from "./UIConfig";
import UIManager from "./UIManager";







const { ccclass, property } = cc._decorator;

@ccclass
export default class TestUIManager extends cc.Component {

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        UIManager.instance.init(this.node);
    }

    start() {



        console.log(UILayer);

        console.log(UILayer.BACKGROUND)
        console.log(UILayer[UILayer.NORMAL])

        console.log(Object.keys(UILayer))



        // 模拟网络请求
        setTimeout(() => {
            let newData = { key: "网络数据" }

            UIManager.instance.open({
                bundle: 'resources',
                url: 'prefabs/hobby/UIHobby',
                layer: UILayer.NORMAL,
                isCache: true,
            }, newData)

            // 加载你自己的bundle
            //UIManager.instance.open('activity', 'prefabs/activity/UIActivity', UILayer.NORMAL, newData)
        }, 300);



        let newData = { key: "网络弹窗数据" }

        UIManager.instance.open({
            bundle: 'resources',
            url: 'prefabs/dialog/UIDialogRule',
            layer: UILayer.POPUP,
            isCache: true,
        }, newData)



        // setTimeout(() => {
        //     let newData = { key: "网络数据2" }
        //     UIManager.instance.open({
        //         bundle: 'resources',
        //         url: 'prefabs/hobby/UIHobby',
        //         layer: UILayer.NORMAL,
        //         isCache: true,
        //     }, newData)

        // }, 2000);


    }



    // update (dt) {}
}
