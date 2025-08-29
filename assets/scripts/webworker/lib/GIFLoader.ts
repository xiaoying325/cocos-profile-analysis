
import { AnimatedImage } from "./AnimatedFrame";
import lzw from "./lzw";

type CanvasData = {
    data: Uint8Array;
    width: number;
    height: number;
}

type FrameData = {
    data: Uint8Array;
    x: number;
    y: number;
    width: number;
    height: number;
}

type GraphicsCtrl = {
    /** dispose method */
    disp?: number;
    delay?: number;
    i?: number;
    t?: number;
    tranIndex?: number
}
type RawImage = {
    x?: number;
    y?: number;
    w?: number;
    h?: number;
    /** interlaced */
    i?: number;
    m?: number;
    r?: number;
    s?: number;
    codeSize?: number;
    colorTab?: Uint8Array;
    srcBuf?: number[];
    pixel?: number;
}

type RawFrame = {
    ctrl: GraphicsCtrl;
    img: RawImage
}

type GIFInfo = {
    header?: string;
    appVersion?: string;
    /** 全局颜色标识 1:用全局颜色，背景色有意义 */
    m?: number;
    s?: number;
    cr?: number;
    pixel?: number;
    radio?: number;
    /** 全局颜色表 */
    colorTab?: Uint8Array;
    /** 背景色 索引 */
    bgColor?: number;
    comment?: string;
    /** 画布宽 */
    w?: number;
    /** 画布高 */
    h?: number;
    frames?: RawFrame[];
}

export class GIFLoader {
    private static _initialized: boolean = false;
    public static init(): void {
        if (this._initialized) return;
        this._initialized = true;

        //@ts-ignore
        let downloadArraybuffer = cc.assetManager.downloader._downloaders[".bin"];
        cc.assetManager.downloader.register(".gif", downloadArraybuffer);

        let weakmap = new WeakMap<ArrayBuffer, AnimatedImage>();
        cc.assetManager.parser.register('.gif', (buffer: string | ArrayBuffer, options, onComplete) => {

            let asset: AnimatedImage | null;
            let ab: ArrayBuffer;

            if (typeof buffer == "string") {
                if (CC_JSB) {
                    //@ts-ignore
                    ab = jsb.fileUtils.getDataFromFile(buffer);
                } else {
                    console.error("GIF下载失败", buffer);
                }
            }
            else {
                ab = buffer;
            }

            if (ab) {
                asset = weakmap.get(ab);

                if (!asset) {
                    asset = new GIF().parse(ab);
                    weakmap.set(ab, asset);
                }
                onComplete(null, asset);
            }
            else {
                onComplete(new Error("GIF解析失败"), null);
            }

        });

        //@ts-ignore
        cc.assetManager.factory.register('.gif', (id, data, options, onComplete) => {
            //@ts-ignore
            data._nativeUrl = id;
            //@ts-ignore
            data._uuid = "";
            onComplete(null, data);
        })
    }
}


/**
 * GIF解析
 */
class GIF {

    private _view: Uint8Array;
    private _offset: number = 0;

    private _info: GIFInfo = {
        header: '',
        frames: [],
        comment: ''
    };
    private _frame: RawFrame;

    private _delays: number[] = [];
    private _spriteFrames: Array<cc.SpriteFrame> = [];

    private setBuffer(buffer: ArrayBuffer) {
        this.clear();
        this._view = new Uint8Array(buffer);
    }

    /**
     * 将buffer 解析为gif 核心
     * @param item
     * @param callback
     */
    parse(item: ArrayBuffer): AnimatedImage | null {
        const begin = (performance || Date).now();

        this.setBuffer(item);

        this.getHeader();
        this.getScrDesc();
        this.getTexture();

        const end = (performance || Date).now();
        console.info("gif 解析耗时", end - begin);

        if (this._spriteFrames.length == 0) {
            return null;
        } else {
            let out = new AnimatedImage();
            out.width = this._info.w;
            out.height = this._info.h;
            out.delays = this._delays.map(v => v / 100);
            out.spriteFrames = this._spriteFrames;
            return out;
        }
    }

    private hasPrevFrame: boolean = false;
    private getTexture(): void {
        this.hasPrevFrame = false;

        const globalWidth = this._info.w;
        const globalHeight = this._info.h;

        this.canvas = { data: null, width: this._info.w, height: this._info.h };
        this.canvas.data = new Uint8Array(this.canvas.width * this.canvas.height * 4);
        this.prevCanvas = { data: null, width: this._info.w, height: this._info.h };

        let bgColor = this.bgColor.fill(0);
        if (this._info.m) {
            const colorTabOffset = this._info.bgColor * 4;
            bgColor = this._info.colorTab.slice(colorTabOffset, colorTabOffset + 4);
        }

        let prevFrame: FrameData;

        for (let i = 0, len = this._info.frames.length; i < len; i++) {
            const frame = this._info.frames[i];

            const imageData = this.decodeFrame(frame);

            const curFrame: FrameData = {
                data: imageData,
                x: frame.img.x,
                y: frame.img.y,
                width: frame.img.w,
                height: frame.img.h,
            };

            if (i === 0) {
                this.putImgData(this.canvas, curFrame);

                this._spriteFrames[i] = this.date2SpriteFrame(curFrame.data, curFrame, this._info);
                this._delays[i] = frame.ctrl.delay;

                prevFrame = curFrame;
                continue;
            }

            const previousFrame = this._info.frames[i - 1];
            const disposalMethod = previousFrame.ctrl.disp;

            if (frame.ctrl.disp === 3 && disposalMethod < 2) {
                this.hasPrevFrame = true;
                if (!this.prevCanvas.data) {
                    this.prevCanvas.data = new Uint8Array(this.canvas.width * this.canvas.height * 4);
                }
                this.prevCanvas.data.set(this.canvas.data);
            }

            if (disposalMethod === 0) {
                this.canvas.data.fill(0);
                this.putImgData(this.canvas, curFrame);
            }
            else if (disposalMethod === 1) {
                this.putImgData(this.canvas, curFrame);
            }
            else if (disposalMethod === 2) {
                this.clearBitmap(this.canvas, prevFrame, bgColor);
                this.putImgData(this.canvas, curFrame);
            }
            else if (disposalMethod === 3) {
                if (this.hasPrevFrame) {
                    this.canvas.data.set(this.prevCanvas.data);
                } else {
                    this.canvas.data.fill(0);
                }
                this.putImgData(this.canvas, curFrame);
            }

            if (disposalMethod === 1 || disposalMethod === 2 || (this.hasPrevFrame && disposalMethod === 3)) {
                Object.assign(curFrame, {
                    width: globalWidth,
                    height: globalHeight,
                    x: 0,
                    y: 0,
                    data: this.canvas.data,
                });
            }

            this._spriteFrames[i] = this.date2SpriteFrame(curFrame.data, curFrame, this._info);
            this._delays[i] = frame.ctrl.delay;

            prevFrame = curFrame;
        }

        this.canvas.data = null;
        this.prevCanvas.data = null;
    }

    /**
     * 解析frame数据为ImageData
     * 最耗时的操作(80%耗时归究这里)
     * @param frame frame数据
     */
    private decodeFrame(frame: RawFrame): Uint8Array {
        const imgData = new Uint8Array(frame.img.w * frame.img.h * 4);
        const { img, ctrl } = frame;
        const { codeSize, m } = img;
        const { tranIndex, t } = ctrl;
        const colorTab = !m && this._info.m ? this._info.colorTab : img.colorTab;

        let colorIndexes = lzw.decode(img.srcBuf, codeSize);

        if (ctrl.i) {
            colorIndexes = lzw.deinterlace(colorIndexes, img.w);
        }

        for (let i = 0; i < colorIndexes.length; i++) {
            const pixelIndex = i * 4;
            const colorIndex = colorIndexes[i] * 3;

            imgData[pixelIndex] = colorTab[colorIndex];
            imgData[pixelIndex + 1] = colorTab[colorIndex + 1];
            imgData[pixelIndex + 2] = colorTab[colorIndex + 2];
            imgData[pixelIndex + 3] = t && colorIndexes[i] === tranIndex ? 0 : 255;
        }

        return imgData;
    }

    /**
     * native版转换
     * 用renderTexture将二进制数据制作为cc.SpriteFrame
     * @param data
     * @param w
     * @param h
     */
    private date2SpriteFrame(data: Uint8Array, img: FrameData, canvas: GIFInfo): cc.SpriteFrame {
        let texture = new cc.Texture2D();

        let spriteFrame = new cc.SpriteFrame();
        texture.initWithData(data, cc.Texture2D.PixelFormat.RGBA8888, img.width, img.height);

        let offset = cc.v2(img.x - (canvas.w - img.width) / 2, -img.y + (canvas.h - img.height) / 2);
        let originSize = cc.rect(0, 0, canvas.w, canvas.h);
        spriteFrame.setTexture(texture, null, null, offset, originSize);
        return spriteFrame;
    }

    private prevCanvas: CanvasData;
    private canvas: CanvasData;
    private bgColor: Uint8Array = new Uint8Array(4);

    private traverseBitmap(canvas: CanvasData, frame: FrameData, callback: (canvasData: Uint8Array, i: number, frameData: Uint8Array, j: number) => void) {
        const W = canvas.width;

        const startIndex = (frame.y * W + frame.x) * 4;
        const { width, height } = frame;

        for (let row = 0; row < height; row++) {
            let rowStride = row * 4;
            const rowStartIndex = startIndex + rowStride * W;
            const localStartIndex = rowStride * width;

            for (let column = 0; column < width; column++) {
                let columnStride = column * 4;
                const pixelIndex = rowStartIndex + columnStride;
                const localIndex = localStartIndex + columnStride;

                callback(canvas.data, pixelIndex, frame.data, localIndex);
            }
        }
    }

    private putImgData(canvas: CanvasData, img: FrameData) {
        this.traverseBitmap(canvas, img, (canvasData, i, frameData, j) => {
            if (frameData[j + 3]) {
                canvasData[i] = frameData[j];
                canvasData[i + 1] = frameData[j + 1];
                canvasData[i + 2] = frameData[j + 2];
                canvasData[i + 3] = frameData[j + 3];
            }
        })
    }

    private clearBitmap(canvas: CanvasData, bgColor: Uint8Array): void;
    private clearBitmap(canvas: CanvasData, dirtyRect: FrameData, bgColor: Uint8Array): void;
    private clearBitmap(canvas: CanvasData, dirtyRect?: FrameData | Uint8Array, bgColor?: Uint8Array): void {
        if (bgColor != null) {
            this.traverseBitmap(canvas, <FrameData>dirtyRect, (canvasData, i, frameData, j) => {
                if (frameData[j + 3]) {
                    canvasData[i] = bgColor[0];
                    canvasData[i + 1] = bgColor[1];
                    canvasData[i + 2] = bgColor[2];
                    canvasData[i + 3] = bgColor[3];
                }
            });
        }
        else {
            const data = canvas.data;
            bgColor = <Uint8Array>dirtyRect;

            for (let i = 0, len = data.length; i < len; i += 4) {
                data[i] = bgColor[0];
                data[i + 1] = bgColor[1];
                data[i + 2] = bgColor[2];
                data[i + 3] = bgColor[3];
            }
        }
    }

    /**
     * 读文件流
     * @param len 读取的长度
     */
    private read(len: number): Uint8Array {
        const sliceStart = this._offset;
        this._offset += len;
        const sliceEnd = this._offset;
        return this._view.slice(sliceStart, sliceEnd);
    }

    private getHeader() {
        this._info.header = '';
        this.read(6).forEach((e, i, arr) => {
            this._info.header += String.fromCharCode(e);
        });
    }

    /**
     * 获取逻辑屏幕标识符(Logical Screen Descriptor)
     * GIF数据流部分(GIF Data Stream)
     */
    private getScrDesc() {
        const arr = this.read(7);

        const width = arr[0] + (arr[1] << 8);
        const height = arr[2] + (arr[3] << 8);

        const flag = arr[4];
        const globalColorTabFlag = flag >> 7 & 1;
        const colorResolution = flag >> 4 & 7;
        const sortFlag = flag >> 3 & 1;
        const sizeOfGlobalColorTable = flag & 7;

        const bgColor = arr[5];
        const radio = arr[6];

        let colorTab: Uint8Array;
        if (globalColorTabFlag) {
            colorTab = this.read((2 << sizeOfGlobalColorTable) * 3);
        }

        Object.assign(this._info, {
            w: width,
            h: height,
            m: globalColorTabFlag,
            cr: colorResolution,
            s: sortFlag,
            pixel: sizeOfGlobalColorTable,
            bgColor: bgColor,
            radio: radio,
            colorTab: colorTab
        });

        this.decode();
    }


    /**
     * 解析GIF数据流
     */
    private decode() {
        let srcBuf = [];
        let arr = this.read(1);

        switch (arr[0]) {
            case 33: //扩展块
                this.extension();
                break;
            case 44: //图象标识符
                arr = this.read(9);
                this._frame.img = {
                    x: arr[0] + (arr[1] << 8),
                    y: arr[2] + (arr[3] << 8),
                    w: arr[4] + (arr[5] << 8),
                    h: arr[6] + (arr[7] << 8),
                    colorTab: null
                };
                this._frame.img.m = 1 & arr[8] >> 7;
                this._frame.img.i = 1 & arr[8] >> 6;
                this._frame.img.s = 1 & arr[8] >> 5;
                this._frame.img.r = 3 & arr[8] >> 3;
                this._frame.img.pixel = arr[8] & 0x07;
                if (this._frame.img.m) {
                    this._frame.img.colorTab = this.read((2 << this._frame.img.pixel) * 3);
                }
                this._frame.img.codeSize = this.read(1)[0];
                srcBuf = [];
                while (1) {
                    arr = this.read(1);
                    if (arr[0]) {
                        this.read(arr[0]).forEach((e, i, arr) => {
                            srcBuf.push(e);
                        });
                    } else {
                        this._frame.img.srcBuf = srcBuf;
                        this.decode();
                        break;
                    }
                };
                break;
            case 59:
                break;
            default:
                break;
        }
    }


    /**
     * 扩展块部分
     */
    private extension() {
        var arr = this.read(1), o, s;
        switch (arr[0]) {
            case 255: //应用程序扩展
                if (this.read(1)[0] == 11) {
                    this._info.appVersion = String.fromCharCode.apply(null, this.read(11));

                    while (true) {
                        const length = this.read(1)[0];
                        if (length) {
                            this.read(length);
                        } else {
                            this.decode();
                            break;
                        }
                    }

                } else {
                    throw new Error('解析出错');
                }
                break;
            case 249: //图形控制扩展
                const readResult = this.read(1);
                const readValue = readResult[0];

                if (readValue === 4) {
                    const arr = this.read(4);
                    this._frame = { ctrl: null, img: null };
                    const { _frame } = this;
                    _frame.ctrl = {
                        disp: 7 & (arr[0] >> 2),
                        i: (1 & (arr[0] >> 1)),
                        t: (arr[0] & 1),
                        delay: (arr[1] + (arr[2] << 8)),
                        tranIndex: arr[3]
                    };
                    this._info.frames.push(_frame);
                    if (this.read(1)[0] === 0) {
                        this.decode();
                    } else {
                        throw new Error('解析出错');
                    }
                } else {
                    throw new Error('解析出错');
                }
                break;
            case 254: //注释块
                arr = this.read(1);
                if (arr[0]) {
                    const readResult = this.read(arr[0]);
                    readResult.forEach((e, i, arr) => {
                        this._info.comment += String.fromCharCode(e);
                    });
                    if (readResult[0] == 0) {
                        this.decode();
                    };
                }
                break;
            default:
                break;
        }
    }


    /**
     * 初始化参数
     */
    private clear() {
        this._view = null;
        this._offset = 0;

        this._frame = null;
        this._info = {
            header: '',
            frames: [],
            comment: ''
        };
        this._delays = [];
        this._spriteFrames = [];

    }

}


