export class AnimatedImage extends cc.Asset {
    spriteFrames: cc.SpriteFrame[] = [];
    delays: number[] = [];
    /** 画布宽度 */
    width: number;
    /** 画布高度 */
    height: number;
}