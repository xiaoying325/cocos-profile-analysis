import BaseHook from "./BaseHook";
import SubModelHook from "./SubModelHook";

/**
 * 列表项劫持组件
 * - 这个咋说呢，适用于那种你有一组数组数据，然后根据这组数组数据来实例化item的场景，支持传入每个item的坐标位置,局部的数据来源，虽然来自于全局，还在考虑要不要收到数据变动的影响？？
 * [
 *  {
 *     url: "resources/prefabs/list_item",
 *     pos: cc.v2(0, 0),
 *     // 其他自定义属性
 * },
 * {
 *     url: "resources/prefabs/list_item",
 *     pos: cc.v2(0, -317),
 *     // 其他自定义属性
 * },
 * {
 *     url: "resources/prefabs/list_item",
 *     pos: cc.v2(0, -634),
 *     // 其他自定义属性
 * }
 * ]
 * - 具体使用
 *  - 1. 在列表item的父结点上挂载这个组件，然后指定预制件URL（这里我不想把预制件直接挂在这个组件上，我想的是通过resource的方式去加载，后续可以和资源加载管理统一）
 *  - 2. 然后指定列表item项的数据来源，这个数据来源肯定是一个数组
 *  - 3. 当数据来源发生变化时，会自动根据数据来源来实例化item，目前是每次变化都会清理所有节点，然后重新实例化，这里其实可以优化，就是不重新实例化
 *  - 比如数据多余初始化的数据时，增加一个item项，数据少于初始化数据时，隐藏/删除 一个item项目,这个地方也可也接入无限循环列表的优化逻辑
 * 若有疑问，联系@彭超
 */
const { ccclass, property, executeInEditMode, menu, help } = cc._decorator;

@ccclass
//@executeInEditMode
@menu('实验性/组件/添加克隆劫持组件')
@help('https://chatgpt.com/')
export default class CloneHook extends BaseHook {


    @property({
        displayName: "数据来源",
        tooltip: '当数据来源更新时，此组件会自动更新',

    })
    source_path: string = "";


    @property({
        displayName: "默认item预制件路径",
        tooltip: '如果你在数据来源中没有指定item预制件路径的话，这里会使用默认的item预制件路径来代替',
        readonly: true
    })
    default_url: string = "resources/prefabs/list_item";

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {
        this.onValueInit()
    }

    private async loadBundle(name: string): Promise<cc.AssetManager.Bundle> {
        return new Promise((resolve, reject) => {
            const existing = cc.assetManager.getBundle(name);
            if (existing) {
                resolve(existing);
                return;
            }

            cc.assetManager.loadBundle(name, (err, bundle) => {
                if (err) {
                    console.error(`加载 bundle 失败：${name}`, err);
                    reject(err);
                    return;
                }
                //log(`成功加载 bundle：${name}`);
                resolve(bundle!);
            });
        });
    }


    private async getBundle(bundleName: string, prefabPath: string): Promise<cc.Prefab> {
        return new Promise((resolve, reject) => {
            const bundle = cc.assetManager.getBundle(bundleName);
            if (!bundle) {
                console.error(`Bundle 未加载：${bundleName}`);
                reject(new Error(`Bundle ${bundleName} not found`));
                return;
            }

            bundle.load(prefabPath, cc.Prefab, (err, prefab: cc.Prefab) => {
                if (err) {
                    console.error(`加载 prefab 失败：${prefabPath}，来自 bundle：${bundleName}`, err);
                    reject(err);
                    return;
                }
                //log(`成功加载 prefab：${prefabPath}，来自 bundle：${bundleName}`);

                resolve(prefab);
            });
        });
    }



    private async create(info: any) {
        const { url, x, y, data } = info;
        const finalUrl = url?.trim() || this.default_url;
        if (!finalUrl) {
            console.error('图片 URL 和默认路径都为空');
            return;
        }

        let parts = finalUrl.split('/');
        let bundle_name = parts[0]; //第一个参数为bundle包名
        let path = parts.slice(1).join('/');
        await this.loadBundle(bundle_name);
        let res = await this.getBundle(bundle_name, path);
        let node = cc.instantiate(res);

        //如果有额外的参数，说明是需要传递局部source data的。
        if (data) {

            // SubModelHook 组件必须是挂载在item上的
            node.getComponent(SubModelHook).init(data); //指定封闭组件的数据来源，另外这里是必须要在onload调用之后，把局部数据模块绑定好！！！！
        }

        this.node.addChild(node);
        node.setPosition(cc.v2(x, y))
    }


    private async initialize(info: any) {
        if (this.node.children.length > 0) {
            this.node.destroyAllChildren();// TODO 就是这里需要优化，数据来源变化时，不想重新实例化
        }

        for (let i = 0; i < info.length; i++) { // TODO 同时，这里又可以优化为分帧实例
            let item = info[i];
            await this.create(item);
        }
    }

    protected onValueInit(): void {
        let data = this.VM.getValue(this.source_path);
        if (!data) {
            console.error(`CloneHook 数据来源为空：${this.source_path},节点将不会实例化`);
            return;
        }
        this.initialize(data);
    }

    protected onValueChanged(n: any, o: any, pathArr: string[]): void {
        this.initialize(n);
    }

    // update (dt) {}
}
