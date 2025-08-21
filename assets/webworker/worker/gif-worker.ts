import lzw from "../lib/lzw";

/** 
 * GIF 类，保留原解析逻辑
 * 注意去掉 cc.Texture2D / SpriteFrame 相关
 */
class GIF {
    public _view: Uint8Array;
    public _offset: number = 0;
    public _info: any = { header: '', frames: [] };
    public _frame: any;

    public setBuffer(buffer: ArrayBuffer) {
        this._view = new Uint8Array(buffer);
        this._offset = 0;
    }

    public getHeader() {
        this._info.header = '';
        this.read(6).forEach(e => this._info.header += String.fromCharCode(e));
    }

    public getScrDesc() {
        const arr = this.read(7);
        const width = arr[0] + (arr[1] << 8);
        const height = arr[2] + (arr[3] << 8);

        const flag = arr[4];
        const globalColorTabFlag = (flag >> 7) & 1;
        const sizeOfGlobalColorTable = flag & 7;

        const bgColor = arr[5];
        const colorTab = globalColorTabFlag ? this.read((2 << sizeOfGlobalColorTable) * 3) : null;

        Object.assign(this._info, {
            w: width,
            h: height,
            m: globalColorTabFlag,
            bgColor: bgColor,
            colorTab
        });

        this.decode();
    }

    private decode() {
        let arr = this.read(1);
        switch (arr[0]) {
            case 33: this.extension(); break;
            case 44:
                arr = this.read(9);
                this._frame = { ctrl: null, img: null };
                this._frame.img = {
                    x: arr[0] + (arr[1] << 8),
                    y: arr[2] + (arr[3] << 8),
                    w: arr[4] + (arr[5] << 8),
                    h: arr[6] + (arr[7] << 8),
                    m: (arr[8] >> 7) & 1,
                    i: (arr[8] >> 6) & 1,
                    pixel: arr[8] & 0x07
                };
                if (this._frame.img.m) {
                    this._frame.img.colorTab = this.read((2 << this._frame.img.pixel) * 3);
                }
                this._frame.img.codeSize = this.read(1)[0];
                let srcBuf: number[] = [];
                while (true) {
                    arr = this.read(1);
                    if (!arr[0]) break;
                    srcBuf.push(...this.read(arr[0]));
                }
                this._frame.img.srcBuf = srcBuf;
                this._info.frames.push(this._frame);
                this.decode();
                break;
            case 59: break; // GIF 结束
        }
    }

    private extension() {
        const arr = this.read(1);
        switch (arr[0]) {
            case 255: // 应用扩展
                if (this.read(1)[0] === 11) this.read(11);
                while (true) if (!this.read(1)[0]) break;
                this.decode();
                break;
            case 249: // 图形控制扩展
                if (this.read(1)[0] === 4) {
                    const a = this.read(4);
                    this._frame = { ctrl: null, img: null };
                    this._frame.ctrl = {
                        disp: (a[0] >> 2) & 7,
                        t: a[0] & 1,
                        delay: a[1] + (a[2] << 8),
                        tranIndex: a[3]
                    };
                    this._info.frames.push(this._frame);
                    if (!this.read(1)[0]) this.decode();
                }
                break;
            case 254: // 注释块
                while (this.read(1)[0]) this.read(arr[0]);
                this.decode();
                break;
        }
    }

    public decodeFrame(frame: any): Uint8Array {
        const { img, ctrl } = frame;
        const colorTab = img.colorTab || this._info.colorTab;
        let colorIndexes = lzw.decode(img.srcBuf, img.codeSize);
        if (ctrl.i) colorIndexes = lzw.deinterlace(colorIndexes, img.w);

        const imgData = new Uint8Array(img.w * img.h * 4);
        for (let i = 0; i < colorIndexes.length; i++) {
            const idx = i * 4;
            const colorIdx = colorIndexes[i] * 3;
            imgData[idx] = colorTab[colorIdx];
            imgData[idx + 1] = colorTab[colorIdx + 1];
            imgData[idx + 2] = colorTab[colorIdx + 2];
            imgData[idx + 3] = (ctrl.t && colorIndexes[i] === ctrl.tranIndex) ? 0 : 255;
        }
        return imgData;
    }

    private read(len: number): Uint8Array {
        const start = this._offset;
        this._offset += len;
        return this._view.slice(start, this._offset);
    }
}
type GIFMessage = {
    type: 'parse';
    buffer: ArrayBuffer;
};

type WorkerResponse = {
    type: 'frame';
    index: number;
    width: number;
    height: number;
    data: ArrayBuffer; // 当前帧的数据
} | {
    type: 'done';
} | {
    type: 'error';
    message: string;
};

// Worker 主逻辑
self.onmessage = (e: MessageEvent<GIFMessage>) => {
    const msg = e.data;
    if (msg.type === 'parse') {
        try {
            const gif = new GIF();
            gif.setBuffer(msg.buffer);

            gif.getHeader();
            gif.getScrDesc();

            // 创建空画布
            const canvasData = new Uint8Array(gif._info.w * gif._info.h * 4);

            for (let i = 0; i < gif._info.frames.length; i++) {
                const frame = gif._info.frames[i];
                const frameData = gif.decodeFrame(frame); // Uint8Array
                // 将帧合并到 canvas
                mergeFrame(canvasData, frameData, frame, gif._info.w);

                // 发送当前帧给主线程
                const response: WorkerResponse = {
                    type: 'frame',
                    index: i,
                    width: gif._info.w,
                    height: gif._info.h,
                    data: canvasData.buffer.slice(0) // 传拷贝
                };
                self.postMessage(response, [response.data]);
            }

            self.postMessage({ type: 'done' });
        } catch (err: any) {
            self.postMessage({ type: 'error', message: err.message });
        }
    }
};

// 合并帧到画布（根据 x, y, dispose 等逻辑可改进）
function mergeFrame(canvas: Uint8Array, frameData: Uint8Array, frame: any, width: number) {
    const { x, y, w, h } = frame.img;
    for (let row = 0; row < h; row++) {
        for (let col = 0; col < w; col++) {
            const srcIdx = (row * w + col) * 4;
            const dstIdx = ((y + row) * width + (x + col)) * 4;

            canvas[dstIdx] = frameData[srcIdx];
            canvas[dstIdx + 1] = frameData[srcIdx + 1];
            canvas[dstIdx + 2] = frameData[srcIdx + 2];
            canvas[dstIdx + 3] = frameData[srcIdx + 3];
        }
    }
}

// --- 这里放 GIF 类和 decodeFrame 等方法，不含 cc.Texture2D / SpriteFrame ---
