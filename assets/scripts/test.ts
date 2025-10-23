// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

@ccclass
export default class test extends cc.Component {

    @property(cc.Label)
    label: cc.Label = null;

    @property
    text: string = 'hello';

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {

        cc.assetManager.loadAny('configs/gifconf', { __requestType__: "path", type: null, bundle: 'resources', __outputAsArray__: Array.isArray("configs/gifconf") }, (err, asset) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log(asset);
        })

    }

    // update (dt) {}
}
