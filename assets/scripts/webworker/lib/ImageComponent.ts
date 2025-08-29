import { AnimatedImage } from "./AnimatedFrame";
import { GIFLoader } from "./GIFLoader";


/**
 * 检查给定的URL是否是远程URL
 * @param {string} url - 检查的URL
 * @return {boolean} 返回true如果给定的URL是远程URL
 */
export function isRemoteUrl(url: string): boolean {
    return url.startsWith("http://") || url.startsWith("https://")
        /** 原生自由路径 ‘/’开头 */
        || url.startsWith("/");
}




// 用作头像缓存，避免多次加载
const cache: { [key: string]: cc.Asset } = {};
const { ccclass, property, requireComponent, menu } = cc._decorator;

export enum ScaleMode {
    /** 无缩放，保持图片原有尺寸 */
    None = 0,
    /** 宽高自由缩放，填满容器 */
    Fill,
    /** 等比缩放显示全部，一边可能会留白 */
    ShowAll,
    /** 等比缩放覆盖，一边可能会超出容器 */
    Cover,
    /** 等比缩放，宽度占满容器宽度 */
    FixedWidth,
    /** 等比缩放，高度占满容器高度 */
    FixedHeight,
}
cc.Enum(ScaleMode);

/**
 * 图片组件
 * 
 * - 支持缩放模式
 * - GIF格式图片，加载前，确保初始化GIFLoader
 */
@ccclass
@requireComponent(cc.Sprite)
@menu("UI/ImageComponent")
export class ImageComponent extends cc.Component {

    @property({ type: ScaleMode })
    scaleMode: ScaleMode = ScaleMode.Cover;

    protected _url: string = "";
    protected _extension: string = "";

    protected defaultWidth: number;
    protected defaultHeight: number;

    public setCompletedCallBack(callBack: () => void): void {
        this.onLoaded = callBack;
    }

    /**
     * 
     * @param url 
     * @param ext 如果是gif图等需要自定义解析图片格式，ext必填
     * @returns 
     */
    public setUrl(url: string, ext?: string, region?: string, uid?: number): void {


        if (this._url == url) return;

        //初始化GIFLoader
        if (ext == 'gif') {
            GIFLoader.init();
        }

        this._extension = ext;
        this._url = url;
        this.loadContent();
    }

    public get url(): string {
        return this._url;
    }

    public get extension(): string {
        return this._extension;
    }

    protected _sprite!: cc.Sprite;
    public get sprite(): cc.Sprite {
        return this._sprite;
    }

    public set spriteFrame(value: cc.SpriteFrame) {
        if (!cc.isValid(this.node)) {
            return;
        }
        if (!this.sprite) {
            this._sprite = this.getComponent(cc.Sprite);
        }
        if (!this.sprite || !this._sprite.node) {
            console.warn(`set spriteFrame fail, sprite is null, url:${this._url}, ${this.node.parent?.name}/${this.node?.name}`);
            return;
        }
        this.sprite.spriteFrame = value;
    }

    public get spriteFrame(): cc.SpriteFrame {
        return this.sprite?.spriteFrame;
    }

    protected _isAnimation: boolean = false;

    public get isAnimation() {
        return this._isAnimation;
    }

    protected animatedFrame: AnimatedImage | null = null;
    protected frameIndex: number = 0;
    protected frameElapsed: number = 0;
    public onLoaded: () => void = null;

    protected onLoad(): void {

        this._sprite = this.getComponent(cc.Sprite) || this.addComponent(cc.Sprite);
        this.defaultWidth = this.node.width;
        this.defaultHeight = this.node.height;
    }

    setNodeDefaultSize(width: number, height: number) {
        this.defaultWidth = width;
        this.defaultHeight = height;
    }




    protected loadContent(): void {
        const url = this._url;
        // 先清空内容，避免有缓存
        this.clearContent();

        if (!url) {
            return;
        }

        if (cache[url]) {
            this.onLoadSuccess(cache[url]);
            return;
        }

        let onComplete = (err: Error, asset: cc.Asset) => {
            if (this._url !== url) return;
            if (err) return;

            if (!this.node || !cc.isValid(this.node)) {
                console.warn(`loadContent fail, node is invalid, url:${url}, ${this.node.parent?.name}/${this.node?.name}`);
                return;
            }

            this.clearContent();
            cache[url] = asset;

            this.onLoadSuccess(asset);
        }

        if (isRemoteUrl(url)) {
            if (this._extension) cc.assetManager.loadRemote(url, { ext: "." + this._extension }, onComplete);
            else cc.assetManager.loadRemote(url, onComplete);
        } else {
            cc.resources.load(url, cc.Asset, (err, asset) => {
                if (!err) {
                    cache[url] = asset;
                }
                onComplete(err, asset);
            });
        }
    }


    protected onLoadSuccess(asset: cc.Asset): void {
        let width: number, height: number;

        if (asset instanceof AnimatedImage) {

            this._isAnimation = true;
            this.frameElapsed = 0;
            this.frameIndex = 0;

            this.animatedFrame = asset;
            this.spriteFrame = asset.spriteFrames[0];

            width = this.animatedFrame.width;
            height = this.animatedFrame.height;
        }
        else if (asset instanceof cc.SpriteFrame) {

            this.spriteFrame = asset;

            let size = asset.getOriginalSize();
            width = size.width;
            height = size.height;
        }
        else if (asset instanceof cc.Texture2D) {
            /**
             * 1. 更改package为false
            */
            asset.packable = false;

            this.spriteFrame = new cc.SpriteFrame(asset);


            let size = this.spriteFrame.getOriginalSize();
            width = size?.width;
            height = size?.height;
        }

        if (this.sprite.sizeMode == cc.Sprite.SizeMode.CUSTOM) {
            this.resizeNode(width, height);
        }
        this.onLoaded && this.onLoaded();
    }

    private resizeNode(contentWidth: number, contentHeight: number): void {
        if (!this.defaultWidth) {
            this.defaultWidth = this.node.width;
        }
        if (!this.defaultHeight) {
            this.defaultHeight = this.node.height;
        }
        let aspect = contentWidth / contentHeight;
        let aspect0 = this.defaultWidth / this.defaultHeight;

        switch (this.scaleMode) {
            case ScaleMode.None:
                //无缩放
                this.node.setContentSize(contentWidth, contentHeight);
                break;
            case ScaleMode.Fill:
                //宽高自由缩放，填满容器
                this.node.setContentSize(this.defaultWidth, this.defaultHeight);
                break;
            case ScaleMode.ShowAll:
                //等比缩放显示全部，一边可能会留白
                if (aspect < aspect0) {
                    this.node.width = this.defaultHeight * aspect;
                } else {
                    this.node.height = this.defaultWidth / aspect;
                }
                break;
            case ScaleMode.Cover:
                //等比缩放覆盖，一边可能会超出容器
                if (aspect < aspect0) {
                    this.node.height = this.defaultWidth / aspect;
                } else {
                    this.node.width = this.defaultHeight * aspect;
                }
                break;
            case ScaleMode.FixedWidth:
                //等比缩放，宽度占满容器宽度
                this.node.height = this.defaultWidth / aspect;
                break;
            case ScaleMode.FixedHeight:
                //等比缩放，高度占满容器高度
                this.node.width = this.defaultHeight * aspect;
                break;
        }

    }

    protected clearContent(): void {
        this.spriteFrame = null;
        this.animatedFrame = null;
    }

    protected update(dt: number): void {
        if (this.animatedFrame) {
            this.frameElapsed += dt;

            let delay = this.animatedFrame.delays[this.frameIndex];

            if (this.frameElapsed >= delay) {

                this.frameElapsed = 0;

                let nextFrameIndex = this.frameIndex + 1;
                if (nextFrameIndex == this.animatedFrame.delays.length) {
                    nextFrameIndex = 0;
                }

                // 如果还没动画帧没有全部加载完成，就先停留在当前帧
                let nextFrame = this.animatedFrame.spriteFrames[nextFrameIndex];
                if (nextFrame) {
                    this.frameIndex = nextFrameIndex;
                    this.spriteFrame = nextFrame;
                }
            }
        }
    }

    protected onDestroy(): void {
        if (this.animatedFrame) {
            this.animatedFrame = null;
        }
        this._sprite = null;
    }
}