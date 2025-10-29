
import { SVGABezierPath } from './svga-bezierPath'

export class SVGAEllipsePath extends SVGABezierPath {

    x;
    y;
    radiusX;
    radiusY;

    constructor(x, y, radiusX, radiusY, transform, styles) {
        super(null, transform, styles);
        this.x = x;
        this.y = y;
        this.radiusX = radiusX;
        this.radiusY = radiusY;
    }

}