import { SvgaTransform } from "./svga-transform";

export class SVGABezierPath {

    d;
    transform: SvgaTransform;
    styles;
    shape;

    constructor(d, transform, styles) {
        this.d = d;
        this.transform = transform;
        this.styles = styles;
    }

}