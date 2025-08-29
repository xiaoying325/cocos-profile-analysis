const { ccclass, property } = cc._decorator;

@ccclass
export default class GifDomPlayer extends cc.Component {

    @property({ tooltip: "GIF 图片地址" })
    gifUrl: string = "";

    private img: HTMLImageElement = null;
    private gameDiv: HTMLElement = null;

    onLoad() {
        if (!CC_JSB) { // 只在 Web 平台有效
            this.createGifDom();
        }
    }

    private createGifDom() {
        this.gameDiv = document.getElementById("GameDiv"); // Cocos 默认容器 id
        if (!this.gameDiv) {
            console.error("找不到 GameDiv 容器");
            return;
        }

        this.img = document.createElement("img");
        this.img.src = this.gifUrl;
        this.img.style.position = "absolute";
        this.img.style.pointerEvents = "none"; // 不影响鼠标事件
        this.img.style.transform = "translate(-50%, -50%)"; // 让坐标对齐到中心
        this.gameDiv.appendChild(this.img);
    }

    update() {
        if (!this.img) return;

        // 把节点坐标转换成屏幕坐标
        let worldPos = this.node.convertToWorldSpaceAR(cc.Vec3.ZERO);
        let viewSize = cc.view.getVisibleSize();
        let canvasSize = cc.view.getCanvasSize();

        let x = (worldPos.x / viewSize.width) * canvasSize.width;
        let y = (1 - worldPos.y / viewSize.height) * canvasSize.height;

        this.img.style.left = `${x}px`;
        this.img.style.top = `${y}px`;

        // 同步缩放
        this.img.style.width = `${this.node.width * this.node.scaleX}px`;
        this.img.style.height = `${this.node.height * this.node.scaleY}px`;
    }

    onDestroy() {
        if (this.img && this.img.parentNode) {
            this.img.parentNode.removeChild(this.img);
            this.img = null;
        }
    }
}
