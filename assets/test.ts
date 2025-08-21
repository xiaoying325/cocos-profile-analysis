

const { ccclass, property } = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {



    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}


    @property(cc.Sprite)
    someSprite:cc.Sprite = null;

    start() {



        cc.assetManager.loadRemote("http://127.0.0.1:10001/test.gif", (err, tex) => {
            if (err) {
                console.error("加载失败", err);
                return;
            }
            console.log("加载成功", tex);


            // 如果是图片，可以生成 SpriteFrame
            let spriteFrame = new cc.SpriteFrame(tex);
            this.someSprite.spriteFrame = spriteFrame;

        });


    }

    // update (dt) {}
}
