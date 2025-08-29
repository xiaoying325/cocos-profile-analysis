const { ccclass, property } = cc._decorator;
const typesssss = {
    [0]: cc.SpriteFrame,
    [1]: cc.Texture2D,
    [2]: cc.AudioClip,
    [3]: cc.AnimationClip,
    [4]: cc.Prefab,
}
@ccclass
export default class show extends cc.Component {

    @property(cc.ScrollView)
    list: cc.ScrollView = null;

    @property(cc.Node)
    contents: cc.Node = null;

    @property(cc.Label)
    lab_textureMemory: cc.Label = null;

    private _curType: number = 0;
    private _curCache: Array<cc.Asset>;

    private _texture_memory: number = 0;


    
    onClickBtn(e, d) {
        this._curType = Number(d);
        this.render();
    }

    render() {
        this.contents.removeAllChildren();
        let ver = cc.ENGINE_VERSION;
        let verNum = Number(ver.replace(/\./g, ""));
        if (verNum < 240) {
            //@ts-ignore
            this._curCache = Object.keys(cc.loader._cache).map(v => cc.loader._cache[v]).filter(v => v.content instanceof typesssss[this._curType]).map(v => v.content).reverse();
        } else {
             //@ts-ignore
            this._curCache = Object.keys(cc.loader._cache).map(v => cc.loader._cache[v]).filter(v => v instanceof typesssss[this._curType]).reverse();;
        }
        this._texture_memory = 0;
        (async () => {
            for (let i = 0; i < this._curCache.length; i++) {
                let item = await this.creatItem(this._curCache[i]);
                if (cc.sys.isBrowser)
                    item.on(cc.Node.EventType.TOUCH_END, () => {
                        var textArea = document.getElementById("clipBoard");
                        if (textArea === null) {
                            textArea = document.createElement("textarea");
                            textArea.id = "clipBoard";
                            textArea.textContent = this._curCache[i]["_uuid"];
                            document.body.appendChild(textArea);
                        }
                        textArea['select']();
                        const msg = document.execCommand('copy') ? 'successful' : 'unsuccessful';
                        document.body.removeChild(textArea);
                    })
                this.contents.addChild(item);
                item.y = 0;
            }
            this.scheduleOnce(() => {
                this.list.scrollToLeft();
            });
            this.lab_textureMemory.string = this._texture_memory.toFixed(2) + "M";
        })();
    }

    creatItem(res: cc.Asset) {
        return new Promise<cc.Node>((resolve, reject) => {
            let node: cc.Node = new cc.Node();
            switch (this._curType) {
                case 0:
                    {
                        let sp = node.addComponent(cc.Sprite);
                        sp.spriteFrame = res as cc.SpriteFrame;
                    }
                    break;
                case 1:
                    {
                        var selfTexture = res;
                        var url = selfTexture.url;
                         //@ts-ignore
                        var num = (res.width * res.height * (url.indexOf('.jpg') > 0 ? 3 : 4) / 1024 / 1024).toFixed(2);
                        this._texture_memory += Number(num);
                        // console.log("==*== 大小=》" + url + "==============>" + num + "M");
                        let sp = node.addComponent(cc.Sprite);
                        let icon = new cc.SpriteFrame(res as cc.Texture2D);
                        sp.spriteFrame = icon;
                        let node_memory = new cc.Node();
                        node_memory.parent = node;
                        node_memory.setPosition(0, - node.height / 2 - 20);
                        let lab_memory = node_memory.addComponent(cc.Label);
                        lab_memory.fontSize = 20;
                        lab_memory.overflow = cc.Label.Overflow.NONE;
                        lab_memory.string = "内存占用:" + num + "M";
                        node_memory.color = cc.color(255, 255, 255);
                        this.lab_textureMemory.string = this._texture_memory.toFixed(2) + "M";
                        if ((this.list.content.height + 40) < node.height) {
                            this.list.content.height = node.height + 100;
                        }
                    }
                    break;
                case 2:
                case 3:
                case 4:
                    let lab = node.addComponent(cc.Label);
                    lab.fontSize = 28;
                    lab.overflow = cc.Label.Overflow.RESIZE_HEIGHT;
                    node.width = 1000;
                    lab.string = res.toString();
                    node.color = cc.color(0, 0, 0)
                    break;
            }
            this.scheduleOnce(() => { resolve(node) }, 0);
        })
    }

    onClickClose() {
        this.node.destroy();
    }
}
