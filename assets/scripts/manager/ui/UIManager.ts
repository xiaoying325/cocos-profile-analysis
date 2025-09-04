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

    /**
     * ui根节点
     */
    private uiRoot: cc.Node = null;
    /**
     * ui层级
     */
    private uiLayers: Map<UILayer, cc.Node> = new Map();
    /**
     * 当前已经打开的ui
     */
    private uiOpens: Map<string, UIBase> = new Map();
    /**
     * 当前需要缓存的ui
     */
    private uiCache: Map<string, UIBase> = new Map();
    /**
     * 打开某个ui的函数执行promise
     * @param url 
     * @returns 
     */
    private loadingMap: Map<string, Promise<UIBase>> = new Map();




    /**
     * 当前处在焦点的ui
     */
    private currentFocusedUI: UIBase = null;

    /**
     * 焦点UI栈
     */
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



    /**
     * 判断某个ui是否正在打开
     * @param url 
     * @returns 
     */
    private isLoading(url: string): boolean {
        return this.loadingMap.has(url); // 你即使同一帧同一时刻，发起n多个重复的，打开重复UI的请求，最终也只会返回同一个promise
    }


    //加一个优化，同一帧 或者同一时刻，调用了多次打开同样的ui，这个时候，需要判断下当前这个ui是否正在加载中
    public async open(uiconf: UIConfig, ...params: any[]): Promise<UIBase> {
        const { bundle, url, layer, isCache } = uiconf;
        if (!bundle || !url || layer === undefined || layer === null) {
            cc.error("UIManager.open 传入的参数不完整");
            return null;
        }

        // 已经打开的 UI
        if (this.uiOpens.has(url)) {
            const ui = this.uiOpens.get(url);
            ui.onShow(...params);
            this.setFocus(ui);
            return ui;
        }

        // 缓存中的 UI
        if (this.uiCache.has(url)) {
            const ui = this.uiCache.get(url);
            ui.node.active = true;
            ui.onShow(...params);
            this.uiOpens.set(url, ui);
            this.setFocus(ui);
            return ui;
        }

        // 如果正在加载中，直接复用正在进行的 Promise
        if (this.isLoading(url)) {
            const loadingPromise = this.loadingMap.get(url);
            return loadingPromise;
        }

        // 发起加载
        const loadPromise = (async () => {
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

                const ui = node.getComponent(UIBase);
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
            } finally {
                // 无论成功还是失败，加载结束后都清理掉
                this.loadingMap.delete(url);
            }
        })(); //我是用了一个立即执行函数

        // 标记到 loadingMap 中
        this.loadingMap.set(url, loadPromise);

        return loadPromise;
    }


    // 此时UI焦点栈中有 uiA uib uic uid...
    // 我们先关闭uid 预期肯定是uid的onFocusLost调用，然后uic的onFocus调用,执行完之后，此时ui栈中只有uiA uib uic
    // 我们再关闭uic 预期肯定是uic的onFocusLost调用，然后uib的onFocus调用,执行完之后，此时ui栈中只有uiA uib

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
            const newFocusUI = this.focusStack[this.focusStack.length - 1] || null; // 比如此时UI栈中有两个打开的UI，移除掉顶层Ui之后，我们要把顶层之下的UI的onFocus调用下
            this.currentFocusedUI = newFocusUI;
            if (newFocusUI) {
                newFocusUI.onFocus();
            }
        }

        // 再做隐藏或销毁
        if (isCache) {
            ui.node.active = false;// 如果时缓存的画，我们肯定是不希望释放资源的，不然的画，你的缓存没有任何意义
            ui.onHide();
        } else {
            ui.onClose();
            ui.node.destroy();// 这个地方你可以关联你的资源释放逻辑
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
