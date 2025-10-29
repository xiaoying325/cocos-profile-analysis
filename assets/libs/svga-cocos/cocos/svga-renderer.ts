
import { SVGABezierPath } from '../svga/svga-bezierPath'
import SVGASprite from './svga-sprite'
import SVGAGraphics from './svga-graphics'
import SVGAVectorLayer from './svga-vectorLayer'
import SVGAPlayer, { SVGADynamicImage, SVGADynamicImageType } from './svga-player'
import { SvgaTransform } from '../svga/svga-transform'
import { SVGAEllipsePath } from '../svga/svga-ellipsePath'
import { SVGARectPath } from '../svga/svga-rectPath'

const validMethods = 'MLHVCSQAZmlhvcsqaz'

function getImageFormatByData(imgData) {
    // if it is a png file buffer.
    if (imgData.length > 8 && imgData[0] === 0x89
        && imgData[1] === 0x50
        && imgData[2] === 0x4E
        && imgData[3] === 0x47
        && imgData[4] === 0x0D
        && imgData[5] === 0x0A
        && imgData[6] === 0x1A
        && imgData[7] === 0x0A) {
        return cc.macro.ImageFormat.PNG;
    }

    // if it is a tiff file buffer.
    if (imgData.length > 2 && ((imgData[0] === 0x49 && imgData[1] === 0x49)
        || (imgData[0] === 0x4d && imgData[1] === 0x4d)
        || (imgData[0] === 0xff && imgData[1] === 0xd8))) {
        return cc.macro.ImageFormat.TIFF;
    }
    return cc.macro.ImageFormat.UNKNOWN;
}

export class SVGARenderer {
    private _owner: SVGAPlayer;

    constructor(owner) {
        this._owner = owner;
    }

    requestContentLayer(sprite) {
        let did = null;
        let ssl = new cc.Node();
        ssl.setAnchorPoint(0, 1);
        let ss = ssl.addComponent(SVGASprite);
        if (sprite.imageKey) {
            did = this._owner.dynamicImage[sprite.imageKey];
            if (!did) {
                let base64 = this._owner.videoItem.images[sprite.imageKey];
                if (base64) {
                    did = {
                        type: SVGADynamicImageType.Base64,
                        base64: base64,
                    };

                }
            }
            if (did) {
                this.requestBitmapLayer(ss, did, this._owner.dynamicImageTransform[sprite.imageKey], sprite.frames);
            }
            if (this._owner.dynamicText[sprite.imageKey]) {
                ss.label = this._owner.dynamicText[sprite.imageKey];
                ssl.addChild(this._owner.dynamicText[sprite.imageKey].node, 1);
            }
        }
        ssl.addChild(this.requestVectorLayer(sprite));
        ss.stepToFrameFunc = (frame) => {
            if (frame < sprite.frames.length) {
                let frameItem = sprite.frames[frame];
                if (frameItem.alpha > 0.0) {
                    ssl.opacity = frameItem.alpha * 255;
                    ssl.active = true;
                    ss.updateTransform(new SvgaTransform(frameItem.transform.a, frameItem.transform.b, frameItem.transform.c, frameItem.transform.d, frameItem.transform.tx, frameItem.transform.ty));
                    ssl.setContentSize(cc.size(frameItem.layout.width - frameItem.layout.x, frameItem.layout.height - frameItem.layout.y));

                    if (frameItem.maskPath) {
                        SVGARenderer.requestBezierShape(frameItem.maskPath, ssl, true);
                    }

                    if (ss.label && ss.label.node.zIndex <= 0) {
                        ss.label.node.zIndex = 1;
                    }
                }
                else {
                    ssl.active = false;
                }

                for (let index = 0; index < ssl.childrenCount; index++) {
                    const child = ssl.children[index];
                    let vl = child.getComponent(SVGAVectorLayer);
                    if (vl) {
                        vl.stepToFrame(frame);
                    }
                    let s = child.getComponent(SVGASprite);
                    if (s) {
                        s.stepToFrame(frame);
                    }
                }
            }
            else {
                ssl.active = false;
            }

        };

        return ssl;
    }

    drawFrame(frame) {
        for (let index = 0; index < this._owner.contentLayer.childrenCount; index++) {
            const child = this._owner.contentLayer.children[index];
            let vl = child.getComponent(SVGAVectorLayer);
            if (vl) {
                vl.stepToFrame(frame);
            }
            let ss = child.getComponent(SVGASprite);
            if (ss) {
                ss.stepToFrame(frame);
            }
        }
    }

    requestBitmapLayer(contentLayer: SVGASprite, did: SVGADynamicImage, bitmapTransform, frames) {
        if (did.type == SVGADynamicImageType.SpriteFrame) {
            if (!did.spriteFrame) {
                return;
            }
            if (!contentLayer.sprite) {
                contentLayer.sprite = new cc.Node().addComponent(cc.Sprite);
                contentLayer.sprite.node.setAnchorPoint(0, 1);
                contentLayer.node.addChild(contentLayer.sprite.node);
            }
            contentLayer.sprite.spriteFrame = did.spriteFrame;
        }
        else {
            this._getSpriteFrame(did, (sf) => {
                if (!sf) {
                    return;
                }

                //存在异步操作，需要检查节点是否有效
                if (!contentLayer || !contentLayer.node || !cc.isValid(contentLayer.node)) {
                    return;
                }

                if (!contentLayer.sprite) {
                    contentLayer.sprite = new cc.Node().addComponent(cc.Sprite);
                    contentLayer.sprite.node.setAnchorPoint(0, 1);
                    contentLayer.node.addChild(contentLayer.sprite.node);
                }
                contentLayer.sprite.spriteFrame = sf;
            });
        }
        if (bitmapTransform !== undefined) {
            contentLayer.updateTransform(new SvgaTransform(bitmapTransform.a, bitmapTransform.b, bitmapTransform.c, bitmapTransform.d, bitmapTransform.tx, bitmapTransform.ty));
        }
        contentLayer.frames = frames;
    }

    requestVectorLayer(ssd) {
        let vl = new cc.Node();
        let svl = vl.addComponent(SVGAVectorLayer);
        svl.setSprite(ssd);
        return vl;
    }

    static requestBezierShape(obj: SVGABezierPath, node: cc.Node = null, isMask: boolean = false) {
        if (!node) {
            node = new cc.Node();
            node.setAnchorPoint(0, 1);
        }
        //由于 mask 的graphics 画多了会报错，所以先移除再创建
        let sg = node.getComponent(SVGAGraphics);
        if (sg) {
            sg.destroy();
            sg = null;
        }
        sg = node.addComponent(SVGAGraphics);
        sg.isMask = isMask;
        SVGARenderer.resetStyle(obj, sg);
        let currentPoint = { x: 0, y: 0, x1: 0, y1: 0, x2: 0, y2: 0 }
        const d = obj.d.replace(/([a-zA-Z])/g, '|||$1 ').replace(/,/g, ' ');
        d.split('|||').forEach(segment => {
            if (segment.length == 0) { return; }
            const firstLetter = segment.substr(0, 1);
            if (validMethods.indexOf(firstLetter) >= 0) {
                const args = segment.substr(1).trim().split(" ");
                SVGARenderer.drawBezierElement(sg, currentPoint, firstLetter, args);
            }
        })
        if (obj.transform !== undefined && obj.transform !== null) {
            sg.updateTransform(new SvgaTransform(obj.transform.a, obj.transform.b, obj.transform.c, obj.transform.d, obj.transform.tx, obj.transform.ty));
        }
        sg.customRender(0, 0);
        return node;
    }

    static resetStyle(obj: SVGABezierPath, shape: SVGAGraphics) {
        const styles = obj.styles;
        if (!styles) { return; }
        if (styles && styles.stroke) {
            if (typeof styles.stroke === 'string') {
                shape.beginStroke(new cc.Color().fromHEX(styles.stroke));
            }
            else {
                shape.beginStroke(`rgba(${parseInt(styles.stroke[0] * 255 as any)}, ${parseInt(styles.stroke[1] * 255 as any)}, ${parseInt(styles.stroke[2] * 255 as any)}, ${styles.stroke[3]})`);
            }
        }
        if (styles) {
            const width = styles.strokeWidth || 0.0;
            const caps = styles.lineCap || '';
            const joints = styles.lineJoin || '';
            const miterLimit = styles.miterLimit || '';
            shape.setStrokeStyle(width, caps, joints, miterLimit);
        }
        if (styles && styles.fill) {
            if (typeof styles.fill === 'string') {
                shape.beginFill(new cc.Color().fromHEX(styles.fill));
            }
            else {
                shape.beginFill(`rgba(${parseInt(styles.fill[0] * 255 as any)}, ${parseInt(styles.fill[1] * 255 as any)}, ${parseInt(styles.fill[2] * 255 as any)}, ${styles.fill[3]})`);
            }
        }
        if (styles && styles.lineDash) {
            shape.setStrokeDash([styles.lineDash[0], styles.lineDash[1]], styles.lineDash[2]);
        }
    }

    static drawBezierElement(g, currentPoint, method, args) {
        switch (method) {
            case 'M':
                currentPoint.x = Number(args[0]);
                currentPoint.y = Number(args[1]);
                g.moveTo(currentPoint.x, currentPoint.y);
                break;
            case 'm':
                currentPoint.x += Number(args[0]);
                currentPoint.y += Number(args[1]);
                g.moveTo(currentPoint.x, currentPoint.y);
                break;
            case 'L':
                currentPoint.x = Number(args[0]);
                currentPoint.y = Number(args[1]);
                g.lineTo(currentPoint.x, currentPoint.y);
                break;
            case 'l':
                currentPoint.x += Number(args[0]);
                currentPoint.y += Number(args[1]);
                g.lineTo(currentPoint.x, currentPoint.y);
                break;
            case 'H':
                currentPoint.x = Number(args[0]);
                g.lineTo(currentPoint.x, currentPoint.y);
                break;
            case 'h':
                currentPoint.x += Number(args[0]);
                g.lineTo(currentPoint.x, currentPoint.y);
                break;
            case 'V':
                currentPoint.y = Number(args[0]);
                g.lineTo(currentPoint.x, currentPoint.y);
                break;
            case 'v':
                currentPoint.y += Number(args[0]);
                g.lineTo(currentPoint.x, currentPoint.y);
                break;
            case 'C':
                currentPoint.x1 = Number(args[0]);
                currentPoint.y1 = Number(args[1]);
                currentPoint.x2 = Number(args[2]);
                currentPoint.y2 = Number(args[3]);
                currentPoint.x = Number(args[4]);
                currentPoint.y = Number(args[5]);
                g.bezierCurveTo(currentPoint.x1, currentPoint.y1, currentPoint.x2, currentPoint.y2, currentPoint.x, currentPoint.y);
                break;
            case 'c':
                currentPoint.x1 = currentPoint.x + Number(args[0]);
                currentPoint.y1 = currentPoint.y + Number(args[1]);
                currentPoint.x2 = currentPoint.x + Number(args[2]);
                currentPoint.y2 = currentPoint.y + Number(args[3]);
                currentPoint.x += Number(args[4]);
                currentPoint.y += Number(args[5]);
                g.bezierCurveTo(currentPoint.x1, currentPoint.y1, currentPoint.x2, currentPoint.y2, currentPoint.x, currentPoint.y);
                break;
            case 'S':
                if (currentPoint.x1 && currentPoint.y1 && currentPoint.x2 && currentPoint.y2) {
                    currentPoint.x1 = currentPoint.x - currentPoint.x2 + currentPoint.x;
                    currentPoint.y1 = currentPoint.y - currentPoint.y2 + currentPoint.y;
                    currentPoint.x2 = Number(args[0]);
                    currentPoint.y2 = Number(args[1]);
                    currentPoint.x = Number(args[2]);
                    currentPoint.y = Number(args[3]);
                    g.bezierCurveTo(currentPoint.x1, currentPoint.y1, currentPoint.x2, currentPoint.y2, currentPoint.x, currentPoint.y);
                } else {
                    currentPoint.x1 = Number(args[0]);
                    currentPoint.y1 = Number(args[1]);
                    currentPoint.x = Number(args[2]);
                    currentPoint.y = Number(args[3]);
                    g.quadraticCurveTo(currentPoint.x1, currentPoint.y1, currentPoint.x, currentPoint.y);
                }
                break;
            case 's':
                if (currentPoint.x1 && currentPoint.y1 && currentPoint.x2 && currentPoint.y2) {
                    currentPoint.x1 = currentPoint.x - currentPoint.x2 + currentPoint.x;
                    currentPoint.y1 = currentPoint.y - currentPoint.y2 + currentPoint.y;
                    currentPoint.x2 = currentPoint.x + Number(args[0]);
                    currentPoint.y2 = currentPoint.y + Number(args[1]);
                    currentPoint.x += Number(args[2]);
                    currentPoint.y += Number(args[3]);
                    g.bezierCurveTo(currentPoint.x1, currentPoint.y1, currentPoint.x2, currentPoint.y2, currentPoint.x, currentPoint.y);
                } else {
                    currentPoint.x1 = currentPoint.x + Number(args[0]);
                    currentPoint.y1 = currentPoint.y + Number(args[1]);
                    currentPoint.x += Number(args[2]);
                    currentPoint.y += Number(args[3]);
                    g.quadraticCurveTo(currentPoint.x1, currentPoint.y1, currentPoint.x, currentPoint.y);
                }
                break;
            case 'Q':
                currentPoint.x1 = Number(args[0]);
                currentPoint.y1 = Number(args[1]);
                currentPoint.x = Number(args[2]);
                currentPoint.y = Number(args[3]);
                g.quadraticCurveTo(currentPoint.x1, currentPoint.y1, currentPoint.x, currentPoint.y);
                break;
            case 'q':
                currentPoint.x1 = currentPoint.x + Number(args[0]);
                currentPoint.y1 = currentPoint.y + Number(args[1]);
                currentPoint.x += Number(args[2]);
                currentPoint.y += Number(args[3]);
                g.quadraticCurveTo(currentPoint.x1, currentPoint.y1, currentPoint.x, currentPoint.y);
                break;
            case 'A':
                break;
            case 'a':
                break;
            case 'Z':
            case 'z':
                g.closePath();
                break;
            default:
                break;
        }
    }

    static requestEllipseShape(obj: SVGAEllipsePath, node: cc.Node = null) {
        if (!node) {
            node = new cc.Node();
            node.setAnchorPoint(0, 1);
        }
        //由于 mask 的graphics 画多了会报错，所以先移除再创建
        let sg = node.getComponent(SVGAGraphics);
        if (sg) {
            sg.destroy();
            sg = null;
        }
        sg = node.addComponent(SVGAGraphics);
        this.resetStyle(obj, sg);
        sg.drawEllipse(obj.x - obj.radiusX, obj.y - obj.radiusY, obj.radiusX * 2, obj.radiusY * 2);
        if (obj.transform !== undefined && obj.transform !== null) {
            sg.updateTransform(new SvgaTransform(obj.transform.a, obj.transform.b, obj.transform.c, obj.transform.d, obj.transform.tx, obj.transform.ty));
        }
        sg.customRender(0, 0);
        return node;
    }

    static requestRectShape(obj: SVGARectPath, node: cc.Node = null) {
        if (!node) {
            node = new cc.Node();
            node.setAnchorPoint(0, 1);
        }
        //由于 mask 的graphics 画多了会报错，所以先移除再创建
        let sg = node.getComponent(SVGAGraphics);
        if (sg) {
            sg.destroy();
            sg = null;
        }
        sg = node.addComponent(SVGAGraphics);
        this.resetStyle(obj, sg);
        sg.drawRoundRect(obj.x, obj.y, obj.width, obj.height, obj.cornerRadius);
        if (obj.transform !== undefined && obj.transform !== null) {
            sg.updateTransform(new SvgaTransform(obj.transform.a, obj.transform.b, obj.transform.c, obj.transform.d, obj.transform.tx, obj.transform.ty));
        }
        sg.customRender(0, 0);
        return node;
    }

    private _getSpriteFrame(dynamicImageData: SVGADynamicImage, cb) {
        if (!dynamicImageData || !cb) {
            cc.error("data or callback is null");
            if (cb) {
                cb(null);
            }
            return;
        }
        let spu = "";
        if (dynamicImageData.type == SVGADynamicImageType.RemoteUrl) {
            spu = dynamicImageData.remoteUrl;
        }
        else {
            spu = "data:image/png;base64," + dynamicImageData.base64;
        }
        cc.assetManager.loadRemote(spu, { ext: '.png' }, (err, texture: cc.Texture2D) => {
            if (err) {
                cc.error("image spu", err);
                return;
            }

            cb(new cc.SpriteFrame(texture));
        });
    }
}
