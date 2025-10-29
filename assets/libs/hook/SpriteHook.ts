import BaseHook from "./BaseHook";


enum SPRITE_TYPE {
    CC_SPRITE,
}

const { ccclass, property, executeInEditMode, menu, help } = cc._decorator;


/**
 *  自动拦截属性，根据真实数据来源刷新sprite的显示，若有疑问，联系 @彭超
 */
@ccclass
//@executeInEditMode
@menu('实验性/组件/2.添加精灵数据劫持组件')
@help('https://chatgpt.com/')
export default class SpriteHook extends BaseHook {

    @property({
        displayName: "数据来源",
        tooltip: '当数据来源更新时，此组件会自动更新',
    })
    source_path: string = "";


    @property({
        displayName: "组件类型",
        type: cc.Enum(SPRITE_TYPE),
        //readonly: true // 组件类型不能修改，只在面板做展示

    })
    private type: SPRITE_TYPE = SPRITE_TYPE.CC_SPRITE;



    private default_url = 'resources/internal/default_sprite';

    private component: cc.Sprite = null;

    onLoad() {
        super.onLoad();
        this.getSprite()

    }

    start(): void {
        this.onValueInit()
    }


    private getSprite() {
        if (this.type === SPRITE_TYPE.CC_SPRITE) {
            this.component = this.getComponent(cc.Sprite);
            if (!this.component) {
                console.error('没有挂载cc.Sprite组件,将自动挂载该组件');
                this.component = this.node.addComponent(cc.Sprite);
            }
        }
    }




    private setSpriteFrame(url: string) {

        function isEmpty(str?: string | null): boolean {
            return str == null || str.trim() === "" || str.trim() === '';
        }

        if (isEmpty(url)) {
            //console.error('加载资源失败，url为空,请检查URL，本次将使用引擎内置默认资源加载显示');
            url = this.default_url;

        }

        // 如果url是带有http或https前缀的，说明是从远程下载的，需要使用cc.assetManager.loadRemote接口
        if (url.indexOf('http') === 0 || url.indexOf('https') === 0) {
            cc.assetManager.loadRemote(url, cc.Texture2D, (err, texture: cc.Texture2D) => {
                if (err) {
                    //console.error('加载资源失败', err);
                    this.load_default()
                    return;
                }
                //console.log(`${this.node.parent.name}->${this.node.name}加载资源成功`, texture);
                let spriteFrame = new cc.SpriteFrame(texture);

                if (cc.isValid(this.component)) {
                    this.component.spriteFrame = spriteFrame;
                }
            })

            return;
        }


        let arr = url.split('/');
        if (arr.length < 2) {
            //console.error('资源路径格式错误', url);
            return;
        }
        let bundle = arr[0];
        let path = arr.slice(1).join('/');


        // console.log(`加载资源的bundle包名:${bundle},包内资源路径path:${path}`)


        let bundle_ins = cc.assetManager.getBundle(bundle);
        if (!bundle_ins) {
            console.error('没有找到对应的bundle包', bundle);
            this.load_default()
            return;
        }

        bundle_ins.load(path, cc.SpriteFrame, (err, spriteFrame: cc.SpriteFrame) => {
            if (err) {
                //console.error('加载资源失败,将使用引擎默认资源替代', err);
                this.load_default()
                return;
            }

            //console.log(`${this.node.parent.name}->${this.node.name}加载资源成功`, spriteFrame);
            if (cc.isValid(this.component)) {
                this.component.spriteFrame = spriteFrame;
            }
        })
    }



    load_default() {
        let url = this.default_url;;
        let arr = url.split('/');
        if (arr.length < 2) {
            console.error('资源路径格式错误', url);
            return;
        }
        let bundle = arr[0];
        let path = arr.slice(1).join('/');


        //console.log(`加载默认替代资源的bundle包名:${bundle},对应包内资源路径path:${path}`)
        let bundle_ins = cc.assetManager.getBundle(bundle);
        if (!bundle_ins) {
            // console.error('没有找到resource bundle包', bundle);
            return;
        }

        bundle_ins.load(path, cc.SpriteFrame, (err, spriteFrame: cc.SpriteFrame) => {
            if (err) {
                //  console.error('默认资源也加载失败，那没救了', err);
                return;
            }

            //  console.log(`${this.node.parent.name}->${this.node.name}加载资源成功`, spriteFrame);
            if (cc.isValid(this.component)) {
                this.component.spriteFrame = spriteFrame;
            }
        })
    }


    onValueInit(): void {
        let url = this.VM.getValue(this.source_path); //获取的应该是url，我之前也考虑过获取的就是spriteframe资源，在写的demo中也验证过，但是感觉还是用url好些，当然这只是我自己的看法
        this.setSpriteFrame(url)

    }


    onValueChanged(n, o, pathArr: string[]) {
        this.setSpriteFrame(n)
    }

    // update (dt) {}
}
