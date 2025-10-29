// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { SVGABezierPath } from "../svga/svga-bezierPath";
import { SVGAEllipsePath } from "../svga/svga-ellipsePath";
import { SVGARectPath } from "../svga/svga-rectPath";
import { SVGARenderer } from "./svga-renderer";

const {ccclass, property} = cc._decorator;

@ccclass
export default class SVGAVectorLayer extends cc.Component {

    // LIFE-CYCLE CALLBACKS:

    private _svgaSpriteData;
    private _drawedFrame = 0;
    private _keepFrameCache = {};

    setSprite(ssd) {
        this._svgaSpriteData = ssd;
        this._resetKeepFrameCache();
    }

    _resetKeepFrameCache() {
        this._keepFrameCache = {}
        let lastKeep = 0;
        this._svgaSpriteData.frames.forEach((frameItem, idx) => {
            if (!this._isKeepFrame(frameItem)) {
                lastKeep = idx;
            }
            else {
                this._keepFrameCache[idx] = lastKeep;
            }
        });
    }

    _isKeepFrame(frameItem) {
        return frameItem.shapes && frameItem.shapes.length > 0 && frameItem.shapes[0].type === "keep";
    }

    _requestKeepFrame(frame) {
        return this._keepFrameCache[frame]
    }

    _drawFrame(frame) {
        if (frame < this._svgaSpriteData.frames.length) {
            let frameItem = this._svgaSpriteData.frames[frame];
            if (this._isKeepFrame(frameItem)) {
                if (this._drawedFrame === this._requestKeepFrame(frame)) {
                    return;
                }
            }

            this.node.removeAllChildren(true);
            
            frameItem.shapes.forEach((shape) => {
                if (shape.type === "shape" && shape.pathArgs && shape.pathArgs.d) {
                    this.node.addChild(SVGARenderer.requestBezierShape(new SVGABezierPath(shape.pathArgs.d, shape.transform, shape.styles)));
                }
                else if (shape.type === "ellipse" && shape.pathArgs) {
                    this.node.addChild(SVGARenderer.requestEllipseShape(new SVGAEllipsePath(parseFloat(shape.pathArgs.x) || 0.0, parseFloat(shape.pathArgs.y) || 0.0, parseFloat(shape.pathArgs.radiusX) || 0.0, parseFloat(shape.pathArgs.radiusY) || 0.0, shape.transform, shape.styles)));
                }
                else if (shape.type === "rect" && shape.pathArgs) {
                    this.node.addChild(SVGARenderer.requestRectShape(new SVGARectPath(parseFloat(shape.pathArgs.x) || 0.0, parseFloat(shape.pathArgs.y) || 0.0, parseFloat(shape.pathArgs.width) || 0.0, parseFloat(shape.pathArgs.height) || 0.0, parseFloat(shape.pathArgs.cornerRadius) || 0.0, shape.transform, shape.styles)));
                }
            })
            this._drawedFrame = frame;
        }
    }

    stepToFrame(frame) {
        if (frame < this._svgaSpriteData.frames.length) {
            this._drawFrame(frame);
        }
    }

    // onLoad () {}

    start () {

    }

    // update (dt) {}
}
