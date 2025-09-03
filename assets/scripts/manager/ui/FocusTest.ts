// 焦点功能测试脚本
import UIManager from "./UIManager";
import { UILayer } from "./UIConfig";

const { ccclass, property } = cc._decorator;

@ccclass
export default class FocusTest extends cc.Component {

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
            console.log("测试1：打开UIHobby");
            const ui1 = await UIManager.instance.open({
                bundle: 'resources',
                url: 'prefabs/hobby/UIHobby',
                layer: UILayer.NORMAL,
                isCache: true,
            }, "测试数据1");

            console.log("当前焦点UI:", UIManager.instance.getCurrentFocusedUI()?.uiName);
            console.log("焦点栈:", UIManager.instance.getFocusStack().map(ui => ui.uiName));

            // 等待2秒
            await this.wait(2000);

            // 测试2：打开第二个UI
            console.log("测试2：打开UIDialogRule");
            const ui2 = await UIManager.instance.open({
                bundle: 'resources',
                url: 'prefabs/dialog/UIDialogRule',
                layer: UILayer.POPUP,
                isCache: true,
            }, "测试数据2");

            console.log("当前焦点UI:", UIManager.instance.getCurrentFocusedUI()?.uiName);
            console.log("焦点栈:", UIManager.instance.getFocusStack().map(ui => ui.uiName));

            // 等待2秒
            await this.wait(2000);

            // 测试3：关闭当前UI，测试焦点转移
            console.log("测试3：关闭UIDialogRule，测试焦点转移");
            UIManager.instance.close('prefabs/dialog/UIDialogRule');

            console.log("当前焦点UI:", UIManager.instance.getCurrentFocusedUI()?.uiName);
            console.log("焦点栈:", UIManager.instance.getFocusStack().map(ui => ui.uiName));

            // 等待2秒
            await this.wait(2000);

            // 测试4：重新打开UIHobby（从缓存）
            console.log("测试4：重新打开UIHobby（从缓存）");
            const ui1Again = await UIManager.instance.open({
                bundle: 'resources',
                url: 'prefabs/hobby/UIHobby',
                layer: UILayer.NORMAL,
                isCache: true,
            }, "测试数据3");

            console.log("当前焦点UI:", UIManager.instance.getCurrentFocusedUI()?.uiName);
            console.log("焦点栈:", UIManager.instance.getFocusStack().map(ui => ui.uiName));

            console.log("=== 焦点功能测试完成 ===");

        } catch (error) {
            console.error("焦点功能测试失败:", error);
        }
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
