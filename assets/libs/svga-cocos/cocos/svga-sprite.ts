// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { SVGAFrameEntity } from "../svga/svga-frameEntity";
import { SvgaTransform } from "../svga/svga-transform";

const { ccclass, property } = cc._decorator;

@ccclass
export default class SVGASprite extends cc.Component {

    // @property(cc.Sprite)
    sprite: cc.Sprite = null;
    // @property(cc.Label)
    label: cc.Label = null;

    // LIFE-CYCLE CALLBACKS:

    private _imageKey: string = "";
    private _frames: SVGAFrameEntity[] = [];
    private _stepToFrameFunc: Function = null;

    // onLoad () {}

    start() {

    }


    public set imageKey(v: string) {
        this._imageKey = v;
    }


    public get imageKey(): string {
        return this._imageKey;
    }

    public set frames(v: SVGAFrameEntity[]) {
        this._frames = v;
    }

    public get frames(): SVGAFrameEntity[] {
        return this._frames;
    }


    public set stepToFrameFunc(v: Function) {
        this._stepToFrameFunc = v;
    }

    updateTransform(td: SvgaTransform) {
        if (!td) {
            return;
        }

        let sttd = td.decompose();

        this.node.x = sttd.x;
        this.node.y = -sttd.y;
        this.node.scaleX = sttd.scaleX;
        this.node.scaleY = sttd.scaleY;
        // this.node.skewX = sttd.skewX;
        // this.node.skewY = sttd.skewY;
        this.node.is3DNode = true;
        if (sttd.rotation != 0) {
            this.node.angle = -sttd.rotation;
        }
        else {
            if (sttd.skewX < 0) {
                this.node.eulerAngles = cc.v3(sttd.skewX, sttd.skewY, sttd.skewX);
            }
            else {
                this.node.eulerAngles = cc.v3(sttd.skewX, sttd.skewY, 0);
            }
        }

    }

    stepToFrame(frameIndex) {
        if (this._stepToFrameFunc) {
            this._stepToFrameFunc(frameIndex);
        }
    }

    // update (dt) {}
}
