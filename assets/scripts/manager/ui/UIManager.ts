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
     * 存放当前所有已经打开的ui
     * - 简单点说，就是把当前打开的ui缓存到这个表中，方便读取内容
     */
    private uiOpens: Map<string, UIBase> = new Map()


    /**
     * 所有标记了cache的UI都会进入这个缓存
     */
    private uiCache: Map<string, UIBase> = new Map()

    /**
     * 当前获得焦点的UI
     */
    private currentFocusedUI: UIBase = null

    /**
     * UI焦点历史栈，用于跟踪UI的打开顺序
     */
    private focusStack: UIBase[] = []


    public init(root: cc.Node) {
        this.uiRoot = root;

        // 创建这些层级节点

        Object.keys(UILayer)
            .filter(key => isNaN(Number(key))) // 过滤掉枚举的数值键
            .forEach(key => {
                const layer = UILayer[key]; // 数值 (0,1,2...)
                const node = new cc.Node(key); // 节点名称用字符串，比如 "BACKGROUND"

                this.uiRoot.addChild(node);
                node.setSiblingIndex(layer);   // 控制渲染顺序
                this.uiLayers.set(layer, node); // 存的是数值作为 key
            });
    }

    private loadBundleAsync(bundleName: string): Promise<cc.AssetManager.Bundle> {
        return new Promise((resolve, reject) => {
            cc.assetManager.loadBundle(bundleName, (err, bundle) => {
                if (err) reject(err);
                else resolve(bundle);
            });
        });
    }

    // 封装成 Promise 版本的 load
    private loadPrefabAsync(bundle: cc.AssetManager.Bundle, url: string): Promise<cc.Prefab> {
        return new Promise((resolve, reject) => {
            bundle.load(url, cc.Prefab, (err, prefab) => {
                if (err) reject(err);
                else resolve(prefab);
            });
        });
    }

    public async open(uiconf: UIConfig, ...params: any[]): Promise<UIBase> {
        const { bundle, url, layer, isCache } = uiconf;

        if (!bundle || !url || !layer) {
            cc.error("UIManager.open 传入的参数不完整");
            return null;
        }

        // 已经打开的UI
        if (this.uiOpens.has(url)) {
            cc.error(`UIManager.open 重复打开UI: ${url}`);

            let ui = this.uiOpens.get(url);
            ui.onShow(...params);
            this.setFocus(ui);
            return ui;
        }

        // 缓存的UI
        if (this.uiCache.has(url)) {
            const ui = this.uiCache.get(url);
            ui.node.active = true;
            ui.onShow(...params);
            this.uiOpens.set(url, ui);
            this.setFocus(ui);
            return ui;
        }

        try {
            // 加载 bundle
            const loadedBundle = await this.loadBundleAsync(bundle);
            // 加载 prefab
            const prefab = await this.loadPrefabAsync(loadedBundle, url);
            // 实例化节点
            const node = cc.instantiate(prefab);
            const parent = this.uiLayers.get(layer);
            parent.addChild(node);

            const ui = node.getComponent(UIBase);
            if (!ui) {
                cc.error(`Prefab 没有继承 BaseUI: ${url}`);
                node.destroy();
                return null;
            }

            ui.uiConf = uiconf;
            this.uiOpens.set(url, ui);
            // 如果需要缓存起来不销毁的话，还需要保存在这个cache中
            if (isCache) {
                this.uiCache.set(url, ui);
            }

            ui.onShow(...params);
            this.setFocus(ui);

            return ui;
        } catch (err) {
            cc.error(`打开 UI 失败: ${url}`, err);
            return null;
        }
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
        }

        // 处理焦点转移
        this.handleFocusOnClose(ui);

        this.uiOpens.delete(url);
    }

    /**
     * 设置UI焦点
     * @param ui 要设置焦点的UI
     */
    private setFocus(ui: UIBase) {
        // 如果当前有焦点UI且不是同一个UI，先调用失焦处理
        if (this.currentFocusedUI && this.currentFocusedUI !== ui) {
            this.currentFocusedUI.onFocusLost();
            this.removeFromFocusStack(this.currentFocusedUI);
        }

        // 设置新的焦点UI
        this.currentFocusedUI = ui;
        
        // 如果UI已经在栈中，先移除
        this.removeFromFocusStack(ui);

        // 添加到栈顶
        this.focusStack.push(ui);

        // 调用onFocus方法
        ui.onFocus();
    }

    /**
     * 从焦点栈中移除UI
     * @param ui 要移除的UI
     */
    private removeFromFocusStack(ui: UIBase) {
        const index = this.focusStack.indexOf(ui);
        if (index > -1) {
            this.focusStack.splice(index, 1);
        }
    }

    /**
     * 获取当前焦点UI
     */
    public getCurrentFocusedUI(): UIBase {
        return this.currentFocusedUI;
    }

    /**
     * 获取焦点栈
     */
    public getFocusStack(): UIBase[] {
        return [...this.focusStack]; // 返回副本，避免外部修改
    }

    /**
     * 当UI关闭时，处理焦点转移
     * @param closedUI 被关闭的UI
     */
    private handleFocusOnClose(closedUI: UIBase) {
        // 如果被关闭的UI是当前焦点UI，先调用失焦处理
        if (this.currentFocusedUI === closedUI) {
            closedUI.onFocusLost();
        }

        // 从焦点栈中移除被关闭的UI
        this.removeFromFocusStack(closedUI);

        // 如果被关闭的UI是当前焦点UI
        if (this.currentFocusedUI === closedUI) {
            // 从焦点栈中获取上一个UI作为新的焦点
            if (this.focusStack.length > 0) {
                const newFocusUI = this.focusStack[this.focusStack.length - 1];
                this.currentFocusedUI = newFocusUI;
                newFocusUI.onFocus();
            } else {
                this.currentFocusedUI = null;
            }
        }
    }

    // update (dt) {}
}
