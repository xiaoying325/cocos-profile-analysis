

const { ccclass, property } = cc._decorator;

@ccclass
export default class webgl extends cc.Component {

    @property(cc.Label)
    label: cc.Label = null;

    @property
    text: string = 'hello';

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {
        let texture = new cc.Texture2D();
        let impl = texture.getImpl();

        // 看看里面有什么
        console.log("impl:", impl);
    }

    // update (dt) {}
}
