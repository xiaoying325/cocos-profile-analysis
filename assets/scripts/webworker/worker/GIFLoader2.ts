export class GIFLoader2 {
    private static _worker: Worker;

    public static initWorker() {
        if (!this._worker) {
            this._worker = new Worker('./gif-worker.js');
        }
    }

    /**
     * 分帧解析 GIF，并回调每帧数据
     */
    public static parseGIF(buffer: ArrayBuffer, onFrame: (frame: cc.SpriteFrame, index: number) => void): Promise<void> {
        this.initWorker();

        return new Promise((resolve, reject) => {
            const worker = this._worker;

            const handleMessage = (e: MessageEvent) => {
                const msg = e.data;

                if (msg.type === 'frame') {
                    const texture = new cc.Texture2D();
                    const u8 = new Uint8Array(msg.data);
                    texture.initWithData(u8, cc.Texture2D.PixelFormat.RGBA8888, msg.width, msg.height);

                    const sf = new cc.SpriteFrame(texture);
                    onFrame(sf, msg.index);
                } else if (msg.type === 'done') {
                    worker.removeEventListener('message', handleMessage);
                    resolve();
                } else if (msg.type === 'error') {
                    worker.removeEventListener('message', handleMessage);
                    reject(new Error(msg.message));
                }
            };

            worker.addEventListener('message', handleMessage);
            worker.postMessage({ type: 'parse', buffer }, [buffer]);
        });
    }
}



// buffer 为 ArrayBuffer GIF 数据
// GIFLoader2.parseGIF(buffer, (spriteFrame, index) => {
//     console.log("接收到帧", index);
//     mySprite.spriteFrame = spriteFrame; // 实时显示
// }).then(() => {
//     console.log("GIF 全部解析完成");
// });
