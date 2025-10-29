// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { SvgaTransform } from "../svga/svga-transform";

const { ccclass, property } = cc._decorator;

@ccclass
export default class SVGAGraphics extends cc.Component {

    // @property(cc.Graphics)
    graphics: cc.Graphics = null; //保存数据使用
    // @property(cc.Mask)
    mask: cc.Mask = null;
    // @property(cc.Boolean)
    isMask: boolean = false;

    // private _graphics:cc.Graphics = null; //真正用来画的
    // LIFE-CYCLE CALLBACKS:

    private _strokeDash: { arr: number[], phese: number } = null;//arr 实现和虚线,phese偏移量
    private _currentPath = [];
    private _fillStyle = null;
    private _strokeStyle = null;

    onLoad() {
        // this._init();
    }

    start() {
        // this._init();
    }

    private _init() {
        if (!this.graphics) {
            if (this.isMask) {
                this.mask = this.getComponent(cc.Mask);
                if (!this.mask) {
                    this.mask = this.addComponent(cc.Mask);
                    this.mask.type = cc.Mask.Type.RECT;
                }
                this.graphics = this.mask["_graphics"];
            }
            else {
                this.graphics = this.getComponent(cc.Graphics);
                if (!this.graphics) {
                    this.graphics = this.addComponent(cc.Graphics);
                }
            }
        }
    }

    private _clear() {
        if (this.graphics) {
            this.graphics.clear();
        }
    }

    getBounds() {
        return this.node.getBoundingBox();
    }

    beginFill(fillColor) {
        this._init();
        this._fillStyle = fillColor;
        if (typeof fillColor === 'string') {
            if (fillColor.startsWith('rgba')) {
                const components = fillColor.replace('rgba(', '').replace(')', '').split(',');
                this.graphics.fillColor = cc.color(parseInt(components[0]), parseInt(components[1]), parseInt(components[2]))
            }
        } else {
            this.graphics.fillColor = fillColor;
        }
    }

    beginStroke(strokeColor) {
        this._init();
        this._strokeStyle = strokeColor;
        if (typeof strokeColor === 'string') {
            if (strokeColor.startsWith('rgba')) {
                const components = strokeColor.replace('rgba(', '').replace(')', '').split(',');
                this.graphics.strokeColor = cc.color(parseInt(components[0]), parseInt(components[1]), parseInt(components[2]))
            }
        } else {
            this.graphics.strokeColor = strokeColor;
        }
    }

    setStrokeStyle(width, caps, joints, miterLimit) {
        this._init();
        this.graphics.lineCap = caps;
        this.graphics.lineJoin = joints;
        this.graphics.lineWidth = width;
        this.graphics.miterLimit = miterLimit;
    }

    setStrokeDash(arr, arg) {
        this._strokeDash = { arr: arr, phese: arg };
    }

    moveTo(x, y) {
        this._currentPath.push(["moveTo", x, -y]);
    }

    lineTo(x, y) {
        this._currentPath.push(["lineTo", x, -y]);
    }

    bezierCurveTo(x1, y1, x2, y2, x, y) {
        this._currentPath.push(["bezierCurveTo", x1, -y1, x2, -y2, x, -y]);
    }

    quadraticCurveTo(x1, y1, x, y) {
        this._currentPath.push(["quadraticCurveTo", x1, -y1, x, -y]);
    }

    closePath() {
        this._currentPath.push(["closePath"]);
    }

    drawEllipse(left, top, dX, dY) {
        if (!this._currentPath) {
            this._currentPath = [];
        }
        this._currentPath.push(["ellipse", left, -top, dX, -dY]);
    }

    drawRoundRect(x, y, width, height, cornerRadius) {
        if (!this._currentPath) {
            this._currentPath = [];
        }
        this._currentPath.push(["rect", x, -y, width, -height, cornerRadius]);
    }

    customRender(x, y) {
        this._init();
        this._clear();

        let tx = x;
        let ty = y;
        if (this._strokeDash) {
            // 使用虚线
            // todo
        }

        if (this._currentPath instanceof Array) {
            this._currentPath.forEach((item) => {
                if (item[0] === "moveTo") {
                    const tPoint = { x: item[1], y: item[2] };
                    this.graphics.moveTo(tPoint.x, tPoint.y);
                }
                else if (item[0] === "lineTo") {
                    const tPoint = { x: item[1], y: item[2] };
                    this.graphics.lineTo(tPoint.x, tPoint.y);
                }
                else if (item[0] === "bezierCurveTo") {
                    const tPoint1 = { x: item[1], y: item[2] };
                    const tPoint2 = { x: item[3], y: item[4] };
                    const tPoint3 = { x: item[5], y: item[6] };
                    this.graphics.bezierCurveTo(tPoint1.x, tPoint1.y, tPoint2.x, tPoint2.y, tPoint3.x, tPoint3.y);
                }
                else if (item[0] === "quadraticCurveTo") {
                    const tPoint1 = { x: item[1], y: item[2] };
                    const tPoint2 = { x: item[3], y: item[4] };
                    this.graphics.quadraticCurveTo(tPoint1.x, tPoint1.y, tPoint2.x, tPoint2.y);
                }
                else if (item[0] === "closePath") {
                    this.graphics.close();
                }
                else if (item[0] === "ellipse") {
                    let x = item[1];
                    let y = item[2];
                    let w = item[3];
                    let h = item[4];
                    var kappa = .5522848,
                        ox = (w / 2) * kappa,
                        oy = (h / 2) * kappa,
                        xe = x + w,
                        ye = y + h,
                        xm = x + w / 2,
                        ym = y + h / 2;

                    this.graphics.moveTo(x, ym);
                    this.graphics.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
                    this.graphics.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
                    this.graphics.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
                    this.graphics.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
                }
                else if (item[0] === "rect") {
                    const tPoint = { x: item[1], y: item[2] };
                    let x = tPoint.x;
                    let y = tPoint.y;
                    let width = item[3];
                    let height = item[4];
                    let radius = item[5];
                    this.graphics.moveTo(x + radius, y);
                    this.graphics.lineTo(x + width - radius, y);
                    this.graphics.quadraticCurveTo(x + width, y, x + width, y + radius);
                    this.graphics.lineTo(x + width, y + height - radius);
                    this.graphics.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
                    this.graphics.lineTo(x + radius, y + height);
                    this.graphics.quadraticCurveTo(x, y + height, x, y + height - radius);
                    this.graphics.lineTo(x, y + radius);
                    this.graphics.quadraticCurveTo(x, y, x + radius, y);
                    this.graphics.lineTo(x, y);
                    this.graphics.close();
                }
            })
        }

        if (this._fillStyle) {
            this.graphics.fill();
        }
        if (this._strokeStyle) {
            this.graphics.stroke();
        }

        if (this.isMask) {
            if (!(this._fillStyle || this._strokeStyle)) {
                if (cc.game.renderType === cc.game.RENDER_TYPE_CANVAS) {
                    this.graphics.stroke();
                }
                else {
                    this.graphics.fill();
                }
            }
            this.mask.setVertsDirty();
        }

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

    // update (dt) {}
}
