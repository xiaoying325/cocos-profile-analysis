declare interface NodeTransform {
    x?: number;          // 节点的X坐标
    y?: number;          // 节点的Y坐标
    rotation?: number;   // 旋转角度（一般是度数）
    scaleX?: number;     // X方向缩放
    scaleY?: number;     // Y方向缩放
    anchorX?: number;    // 锚点X（0~1）
    anchorY?: number;    // 锚点Y（0~1）
    sizeX?: number;      // 宽度
    sizeY?: number;      // 高度
    color?: string;      // 颜色（比如 "#ffffff" 或 "rgba(255,255,255,1)"）  cc.Color.fromHEX("#ffffff")  new Color(255, 255, 255, 255);
    opacity?: number;    // 透明度（0~255 或 0~1，看你的需求）
    skewX?: number;      // X轴倾斜
    skewY?: number;      // Y轴倾斜
}
