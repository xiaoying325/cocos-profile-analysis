import { SVGAFrameEntity } from './svga-frameEntity'
import { SVGABezierPath } from './svga-bezierPath'
import { SVGARectPath } from './svga-rectPath'
import { SVGAEllipsePath } from './svga-ellipsePath'

export class SVGASpriteEntity {

    /**
     * string
     */
    matteKey = null

    /**
     * string
     */
    imageKey = null

    /**
     * FrameEntity[]
     */
    frames = []

    constructor(spec) {
        this.matteKey = spec.matteKey;
        this.imageKey = spec.imageKey;
        if (spec.frames) {
            this.frames = spec.frames.map((obj) => {
                return new SVGAFrameEntity(obj)
            })
        }
    }

}