
import SVGAPlayer from "../svga-cocos/cocos/svga-player";
import BaseHook from "./BaseHook";


const { ccclass, property, menu, requireComponent } = cc._decorator;

@ccclass
@requireComponent(SVGAPlayer)
@menu("实验性/组件/添加SVGA数据劫持组件")
export default class SvgaHook extends BaseHook {


    @property({
        displayName: "数据来源",
        tooltip: '当数据来源更新时，此组件会自动更新',
    })
    source_path: string = "";


    /**
     * 获取svga组件
     */
    private component: SVGAPlayer = null;



    onLoad() {
        super.onLoad();
        this.getSVGA()

    }

    start(): void {
        this.onValueInit()
    }


    private getSVGA() {

        this.component = this.getComponent(SVGAPlayer);
        if (!this.component) {
            console.error('没有挂载SVGAPlayer组件,将自动挂载该组件');
            this.component = this.node.addComponent(SVGAPlayer);
        }

    }




    private setSVGAFrame(url: string) {

        function isEmpty(str?: string | null): boolean {
            return str == null || str.trim() === "" || str.trim() === '';
        }
        console.log("加载的SVGA资源URL", url)
        if (isEmpty(url)) {
            console.error('加载SVGA资源失败，url为空,请检查URL');
            return

        }
        if (cc.isValid(this.component)) {
            this.component.playRemoteSvga(url);
        }
    }


    onValueInit(): void {
        let url = this.VM.getValue(this.source_path); //获取的应该是url，我之前也考虑过获取的就是spriteframe资源，在写的demo中也验证过，但是感觉还是用url好些，当然这只是我自己的看法
        this.setSVGAFrame(url)

    }


    onValueChanged(n, o, pathArr: string[]) {
        this.setSVGAFrame(n)
    }

}
