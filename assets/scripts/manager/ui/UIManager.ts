import UIBase from "./UIBase";
import { UILayer, UIConfig } from "./UIConfig";

export default class UIManager {
    private static _instance: UIManager = null;
    public static get instance(): UIManager {
        if (this._instance == null) {
            this._instance = new UIManager();
        }
        return this._instance;
    }

    private uiRoot: cc.Node = null;
    private uiLayers: Map<UILayer, cc.Node> = new Map();
    private uiOpens: Map<string, UIBase> = new Map();
    private uiCache: Map<string, UIBase> = new Map();

    private currentFocusedUI: UIBase = null;
    private focusStack: UIBase[] = [];

    public init(root: cc.Node) {
        this.uiRoot = root;

        // 创建层节点（保持原有逻辑）
        Object.keys(UILayer)
            .filter(key => isNaN(Number(key)))
            .forEach(key => {
                const layer = (UILayer as any)[key] as UILayer;
                const node = new cc.Node(key);
                this.uiRoot.addChild(node);
                node.setSiblingIndex(layer);
                this.uiLayers.set(layer, node);
            });
    }

    public async open(uiconf: UIConfig, ...params: any[]): Promise<UIBase> {
        const { bundle, url, layer, isCache } = uiconf;
        if (!bundle || !url || layer === undefined || layer === null) {
            cc.error("UIManager.open 传入的参数不完整");
            return null;
        }

        let ui: UIBase = null;

        // 已经打开的 UI —— 重复打开，只触发 onShow + setFocus
        if (this.uiOpens.has(url)) {
            ui = this.uiOpens.get(url);
            ui.onShow(...params);
            this.setFocus(ui);
            return ui;
        }

        // 缓存中的 UI —— 直接激活、onShow、入打开表、focus
        if (this.uiCache.has(url)) {
            ui = this.uiCache.get(url);
            ui.node.active = true;
            ui.onShow(...params);
            this.uiOpens.set(url, ui);
            this.setFocus(ui);
            return ui;
        }

        // 直接加载 bundle + prefab（把原来两个 Promise 函数内联）
        try {
            const loadedBundle: cc.AssetManager.Bundle = await new Promise((resolve, reject) => {
                cc.assetManager.loadBundle(bundle, (err, b) => {
                    if (err) reject(err);
                    else resolve(b);
                });
            });

            const prefab: cc.Prefab = await new Promise((resolve, reject) => {
                loadedBundle.load(url, cc.Prefab, (err, p: cc.Prefab) => {
                    if (err) reject(err);
                    else resolve(p);
                });
            });

            const node = cc.instantiate(prefab);
            const parent = this.uiLayers.get(layer);
            parent.addChild(node);

            ui = node.getComponent(UIBase);
            if (!ui) {
                cc.error(`Prefab 没有继承 BaseUI: ${url}`);
                node.destroy();
                return null;
            }

            ui.uiConf = uiconf;
            this.uiOpens.set(url, ui);
            if (isCache) this.uiCache.set(url, ui);

            ui.onShow(...params);
            this.setFocus(ui);
            return ui;
        } catch (err) {
            cc.error(`打开 UI 失败: ${url}`, err);
            return null;
        }
    }

    public close(url: string) {
        const ui = this.uiOpens.get(url);
        if (!ui) {
            cc.error(`UIManager.close 没有找到这个UI: ${url}`);
            return;
        }

        const { isCache } = ui.uiConf;

        // —— inline 的焦点回退逻辑（原来在 handleFocusOnClose）
        const wasFocused = (this.currentFocusedUI === ui);
        if (wasFocused) {
            // 只有当它当前具有焦点时才调用一次 onFocusLost
            ui.onFocusLost();
        }

        // 从历史栈中移除（不论是否是焦点）
        this.removeFromFocusStack(ui);

        // 如果它曾是焦点，回退到栈顶的上一个 UI（如果有）
        if (wasFocused) {
            const newFocusUI = this.focusStack[this.focusStack.length - 1] || null;
            this.currentFocusedUI = newFocusUI;
            if (newFocusUI) newFocusUI.onFocus();
        }

        // 再做隐藏或销毁
        if (isCache) {
            ui.node.active = false;
            ui.onHide();
        } else {
            ui.onClose();
            ui.node.destroy();
        }

        this.uiOpens.delete(url);
    }

    private setFocus(ui: UIBase) {
        if (this.currentFocusedUI && this.currentFocusedUI !== ui) {
            this.currentFocusedUI.onFocusLost();
            // 注意：不要从栈中移除旧的 currentFocusedUI，这样才能回退
        }

        this.currentFocusedUI = ui;

        // 把新 UI 在栈中去重后压栈
        this.removeFromFocusStack(ui);
        this.focusStack.push(ui);

        ui.onFocus();
    }

    private removeFromFocusStack(ui: UIBase) {
        const idx = this.focusStack.indexOf(ui);
        if (idx > -1) this.focusStack.splice(idx, 1);
    }

    public getCurrentFocusedUI(): UIBase {
        return this.currentFocusedUI;
    }

    public getFocusStack(): UIBase[] {
        return [...this.focusStack];
    }
}
