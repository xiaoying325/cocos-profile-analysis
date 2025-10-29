import BaseHook from "./BaseHook";




const { ccclass, property, menu, help } = cc._decorator;

/**
 * 说白了，其实就是传入一个数据{}进来，设置当前节点node的所有属性，如坐标啊，缩放啊，颜色啊等等
 */
@ccclass
//@executeInEditMode
@menu('实验性/组件/节点属性数据劫持组件')
@help('https://chatgpt.com/')
export default class NodePropertyHook extends BaseHook {


    @property({
        displayName: "数据来源",
        tooltip: '当数据来源更新时，此组件会自动更新',
    })
    source_path: string = "";


    onLoad() {
        super.onLoad();

    }

    start(): void {
        this.onValueInit()
    }




    private setProperty(data: NodeTransform) {
        if (!data) {
            return;
        }
        let { x, y, rotation, scaleX, scaleY, anchorX, anchorY, sizeX, sizeY, color, opacity, skewX, skewY } = data;
        if (x !== undefined) {
            this.node.x = x;
        }
        if (y !== undefined) {
            this.node.y = y;
        }
        if (rotation !== undefined) {
            this.node.rotation = rotation || 0;
        }
        if (scaleX !== undefined) {
            this.node.scaleX = scaleX || 1;
        }
        if (scaleY !== undefined) {
            this.node.scaleY = scaleY || 1;
        }
        if (anchorX !== undefined) {
            this.node.anchorX = anchorX || 0;
        }
        if (anchorY !== undefined) {
            this.node.anchorY = anchorY || 0;
        }
        if (sizeX !== undefined) {
            this.node.width = sizeX || 0;
        }
        if (sizeY !== undefined) {
            this.node.height = sizeY || 0;
        }
        if (color !== undefined) {
            let color = cc.Color.BLACK;
            cc.Color.fromHEX(color, "#ffffff");
            this.node.color = color;
        }
        if (opacity !== undefined) {
            this.node.opacity = opacity || 255;
        }
        if (skewX !== undefined) {
            this.node.skewX = skewX || 0;
        }
        if (skewY !== undefined) {
            this.node.skewY = skewY || 0;
        }

        // TOTO
        // this.node.scaleX = scaleX || 1;
        // this.node.scaleY = scaleY || 1;
    }




    onValueInit(): void {
        let data = this.VM.getValue(this.source_path); //获取的应该是url，我之前也考虑过获取的就是spriteframe资源，在写的demo中也验证过，但是感觉还是用url好些，当然这只是我自己的看法
        this.setProperty(data)

    }


    onValueChanged(n, o, pathArr: string[]) {
        this.setProperty(n)
    }

}
