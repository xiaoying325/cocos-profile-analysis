import { parseGIF, decompressFrames } from "gifuct-js";

const { ccclass, property } = cc._decorator;

@ccclass
export default class webworkder extends cc.Component {
    @property(cc.Sprite)
    someSprite: cc.Sprite = null;

    @property
    gifUrl: string = "http://127.0.0.1:10001/test.gif";

    private frames: cc.SpriteFrame[] = [];
    private delays: number[] = [];
    private frameIndex: number = 0;
    private elapsed: number = 0;

    onLoad() {
        this.loadGif(this.gifUrl);
    }

    private loadGif(url: string) {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = "arraybuffer";

        xhr.onload = () => {
            if (xhr.status === 200) {
                let buffer = xhr.response;
                this.decodeGif(buffer);
            } else {
                console.error("加载失败", xhr.status);
            }
        };

        xhr.onerror = () => {
            console.error("网络错误");
        };

        xhr.send();
    }

    private decodeGif(buffer: ArrayBuffer) {
        let gif = parseGIF(buffer);
        let frames = decompressFrames(gif, true);

        this.frames = frames.map(frame => {
            let imageData = frame.patch; // RGBA Uint8ClampedArray
            let tex = new cc.Texture2D();
            tex.initWithData(
                imageData,
                cc.Texture2D.PixelFormat.RGBA8888,
                frame.dims.width,
                frame.dims.height
            );
            return new cc.SpriteFrame(tex);
        });

        this.delays = frames.map(f => f.delay / 100); // gifuct-js delay 单位是 10ms
        this.frameIndex = 0;
        this.elapsed = 0;

        if (this.someSprite) {
            this.someSprite.spriteFrame = this.frames[0];
        }
    }

    update(dt: number) {
        if (!this.frames.length) return;

        this.elapsed += dt;
        let delay = this.delays[this.frameIndex] || 0.1; // 默认 0.1s 一帧

        if (this.elapsed >= delay) {
            this.elapsed = 0;
            this.frameIndex = (this.frameIndex + 1) % this.frames.length;
            this.someSprite.spriteFrame = this.frames[this.frameIndex];
        }
    }
}
