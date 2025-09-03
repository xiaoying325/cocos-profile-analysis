// 焦点功能测试脚本
import UIManager from "./UIManager";
import { UILayer } from "./UIConfig";

const { ccclass, property } = cc._decorator;

@ccclass
export default class FocusTest extends cc.Component {

    protected onLoad(): void {
        UIManager.instance.init(this.node);
    }

    start() {
        // 延迟执行测试，确保UIManager已初始化
        this.scheduleOnce(() => {
            this.testFocusFunctionality();
        }, 1);
    }

    /**
     * 测试焦点功能
     */
    private async testFocusFunctionality() {
        console.log("=== 开始测试焦点功能 ===");

        try {
            // 测试1：打开第一个UI
            console.log("测试1：打开 UIHobby");
            await UIManager.instance.open({
                bundle: 'resources',
                url: 'prefabs/hobby/UIHobby',
                layer: UILayer.NORMAL,
                isCache: true,
            }, "测试数据1");

            this.printFocusStatus();

            await this.wait(2000);

            // 测试2：打开第二个UI（应该触发 UIHobby 的 onFocusLost）
            console.log("测试2：打开 UIDialogRule （应该触发 UIHobby 的 onFocusLost）");
            await UIManager.instance.open({
                bundle: 'resources',
                url: 'prefabs/dialog/UIDialogRule',
                layer: UILayer.POPUP,
                isCache: true,
            }, "测试数据2");

            this.printFocusStatus();

            await this.wait(2000);

            // 测试3：关闭当前UI → 焦点回到 UIHobby
            console.log("测试3：关闭 UIDialogRule → 焦点应回到 UIHobby");
            UIManager.instance.close('prefabs/dialog/UIDialogRule');

            this.printFocusStatus();

            await this.wait(2000);

            // 测试4：重新打开 UIHobby（从缓存）
            console.log("测试4：重新打开 UIHobby（从缓存，应触发一次 onFocus）");
            await UIManager.instance.open({
                bundle: 'resources',
                url: 'prefabs/hobby/UIHobby',
                layer: UILayer.NORMAL,
                isCache: true,
            }, "测试数据3");

            this.printFocusStatus();

            await this.wait(2000);

            // 测试5：堆叠场景 UIHobby → UIDialogRule → UIShop
            console.log("测试5：堆叠场景测试（Hobby → DialogRule → Shop）");
            await UIManager.instance.open({
                bundle: 'resources',
                url: 'prefabs/dialog/UIDialogRule',
                layer: UILayer.POPUP,
                isCache: true,
            });

            await UIManager.instance.open({
                bundle: 'resources',
                url: 'prefabs/shop/UIShop',
                layer: UILayer.POPUP,
                isCache: true,
            });

            this.printFocusStatus();

            await this.wait(2000);

            console.log("依次关闭 UIShop → UIDialogRule，观察焦点回退到 UIHobby");
            UIManager.instance.close('prefabs/shop/UIShop');
            this.printFocusStatus();

            await this.wait(1000);

            UIManager.instance.close('prefabs/dialog/UIDialogRule');
            this.printFocusStatus();

            console.log("=== 焦点功能测试完成 ===");

        } catch (error) {
            console.error("焦点功能测试失败:", error);
        }
    }

    /**
     * 打印当前焦点状态
     */
    private printFocusStatus() {
        const current = UIManager.instance.getCurrentFocusedUI();
        const stack = UIManager.instance.getFocusStack().map(ui => ui.uiConf.url);

        console.log("当前焦点UI:", current ? current.uiConf.url : "null");
        console.log("焦点栈:", stack);
    }

    /**
     * 等待指定毫秒数
     */
    private wait(ms: number): Promise<void> {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }
}
