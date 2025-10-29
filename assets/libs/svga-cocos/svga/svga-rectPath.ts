import { SVGABezierPath } from './svga-bezierPath'

export class SVGARectPath extends SVGABezierPath {

    x;
    y;
    width;
    height;
    cornerRadius;

    constructor(x, y, width, height, cornerRadius, transform, styles) {
        super(null,transform, styles);
        this.x = x
        this.y = y
        this.width = width
        this.height = height
        this.cornerRadius = cornerRadius
    }

}