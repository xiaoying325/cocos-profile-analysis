import UIBase from "./UIBase";
import { UILayer, UIConfig } from "./UIConfig";



export default class UIManager {

    //单例模式
    private static _instance: UIManager = null;
    public static get instance(): UIManager {
        if (this._instance == null) {
            this._instance = new UIManager();
        }
        return this._instance;
    }


    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    private uiRoot: cc.Node = null;
    private uiLayers: Map<UILayer, cc.Node> = new Map()
    /**
     * 存储了所有打开的UI实例
     * - 叫做，缓存所有打开的UI实例
     */
    private uiOpens: Map<string, UIBase> = new Map()


    /**
     * 所有标记了cache的UI都会进入这个缓存
     */
    private uiCache: Map<string, UIBase> = new Map()


    public init(root: cc.Node) {
        this.uiRoot = root;
        // 创建这些层级节点
        for (let layer = UILayer.BACKGROUND; layer <= UILayer.TOP; layer++) {
            const node = new cc.Node(`UILayer_${layer}_${UILayer[layer]}`);

            this.uiRoot.addChild(node);
            node.setSiblingIndex(layer);
            this.uiLayers.set(layer, node);
        }

    }


    public async open(uiconf: UIConfig, ...params: any[]): Promise<UIBase> {

        // 对传入的参数进行校验
        const { bundle, url, layer, isCache } = uiconf;
        if (!bundle || !url || !layer) {
            cc.error("UIManager.open 传入的参数不完整");
            return null;
        }

        if (this.uiOpens.get(url)) {
            // 说明你打开的这个UI已经打开了
            cc.error(`UIManager.open 重复打开UI: ${url}`);
            const ui = this.uiOpens.get(url);
            return ui;
        }


        if (this.uiCache.get(url)) {
            // 如果缓存中有这个ui的实例，那我们直接就使用即可
            const ui = this.uiCache.get(url)
            ui.node.active = true;
            ui.onShow(...params);
            this.uiOpens.set(url, ui);

            return ui;
        }


        return new Promise<UIBase>((resolve, reject) => {
            cc.assetManager.loadBundle(bundle, (err, bundle) => {
                if (err) {
                    cc.error(`加载 bundle 失败: ${bundle}`, err);
                    reject(err);
                    return;
                }


                // 从bundle中加载url对应的资源
                bundle.load(url, cc.Prefab, (err, prefab) => {

                    if (err) {
                        cc.error(`加载 UI 失败: ${url}`, err);
                        reject(err);
                        return;
                    }
                    const node = cc.instantiate(prefab);
                    const parent = this.uiLayers.get(layer);
                    parent.addChild(node);

                    const ui = node.getComponent(UIBase);
                    if (!ui) {
                        cc.error(`Prefab 没有继承 BaseUI: ${url}`);
                        reject();  // 这里有点问题，
                        return;
                    }


                    ui.uiConf = uiconf; //写入ui配置

                    this.uiOpens.set(url, ui);
                    if (uiconf.isCache) {
                        this.uiCache.set(url, ui);
                    }

                    ui.onShow(...params);
                    resolve(ui);

                });
            });

        })
    }


    /** 
     * 关闭UI
     * - 根据配置中的cache字段，来决定ui实例是隐藏还是销毁
    */
    public close(url: string) {
        // w我检测到这个UI是不需要进缓存的
        let ui = this.uiOpens.get(url);
        if (!ui) {
            cc.error(`UIManager.close 没有找到这个UI: ${url}`);
            return;
        }

        const { isCache } = ui.uiConf;
        if (isCache) {
            ui.node.active = false;
            ui.onHide();
        } else {
            ui.onClose()
            ui.node.destroy();
            // TODO 资源卸载

        }

        this.uiOpens.delete(url);
    }


    // update (dt) {}
}
