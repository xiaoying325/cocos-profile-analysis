
export enum UILayer {
    /**
     * 背景层
     */
    BACKGROUND,
    /**
     * 普通UI
     */
    NORMAL,
    /**
     * 弹窗
     */
    POPUP,

    /**
     * 顶层，或者是一些提示啊，跑马灯
     */
    TOP,

}



export interface UIConfig {
    bundle: string;
    url: string;
    layer: UILayer;
    /**
     * 是否缓存当前这个UI实例
     */
    isCache: boolean;

}
