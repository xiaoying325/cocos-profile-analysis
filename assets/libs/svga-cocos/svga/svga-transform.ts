
export class SvgaTransformDecompose {
    x: number = 0;
    y: number = 0;
    scaleX: number = 1;
    scaleY: number = 1;
    skewX: number = 0;
    skewY: number = 0;
    rotation: number = 0;
}

export class SvgaTransform {
    a: number   //缩放或旋转图像时影响像素沿 x 轴定位的值。
    b: number   //旋转或倾斜图像时影响像素沿 y 轴定位的值。
    c: number   //旋转或倾斜图像时影响像素沿 x 轴定位的值。
    d: number   //缩放或旋转图像时影响像素沿 y 轴定位的值。
    tx: number  //沿 x 轴平移每个点的距离。
    ty: number  //沿 y 轴平移每个点的距离。

    constructor(a, b, c, d, tx, ty) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.tx = tx;
        this.ty = ty;
    }

    decompose() {
        let stdd = new SvgaTransformDecompose();
        let DEG_TO_RAD = Math.PI / 180;

        stdd.x = this.tx;
        stdd.y = this.ty;
        
        stdd.scaleX = Math.sqrt(this.a * this.a + this.b * this.b);
        stdd.scaleY = Math.sqrt(this.c * this.c + this.d * this.d);

        var skewX = Math.atan2(-this.c, this.d);
        var skewY = Math.atan2(this.b, this.a);

        var delta = Math.abs(1 - skewX / skewY);
        if (delta < 0.00001) { // effectively identical, can use rotation:
            stdd.rotation = skewY / DEG_TO_RAD;
            if (this.a < 0 && this.d >= 0) {
                stdd.rotation += (stdd.rotation <= 0) ? 180 : -180;
            }
            stdd.skewX = stdd.skewY = 0;
        } else {
            stdd.skewX = skewX / DEG_TO_RAD;
            stdd.skewY = skewY / DEG_TO_RAD;
        }
        return stdd;
    }
}