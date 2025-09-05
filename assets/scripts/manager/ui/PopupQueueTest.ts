// 弹窗队列测试脚本
import UIManager from "./UIManager";
import { UILayer } from "./UIConfig";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PopupQueueTest extends cc.Component {

    protected onLoad(): void {
        UIManager.instance.init(this.node);
    }

    start() {
        // 延迟执行测试，确保UIManager已初始化
        this.scheduleOnce(() => {
            this.testPopupQueue();
        }, 1);
    }

    private async testPopupQueue() {
        console.log("=== 弹窗队列测试开始 ===");

        // 暂停队列  只入队弹窗，但是不立即弹出，在我想弹出的时候，我再弹窗
        UIManager.instance.pausePopupQueue();

        // 模拟三个弹窗，不同优先级
        const popup1 = { bundle: "resources", url: "prefabs/popup/UIPopupA", layer: UILayer.POPUP, isCache: true };
        const popup2 = { bundle: "resources", url: "prefabs/popup/UIPopupB", layer: UILayer.POPUP, isCache: true };
        const popup3 = { bundle: "resources", url: "prefabs/popup/UIPopupC", layer: UILayer.POPUP, isCache: true };

        // 弹窗入队列
        UIManager.instance.enqueuePopup(popup1, ["数据A"], 1).then(ui => {
            console.log("弹窗PopupA显示完毕:", ui?.uiName);
        }).catch(err => {
            console.error("弹窗PopupA显示失败:", err);
        });
        UIManager.instance.enqueuePopup(popup2, ["数据B"], 3).then(ui => {
            console.log("弹窗PopupB显示完毕:", ui?.uiName);
        });
        UIManager.instance.enqueuePopup(popup3, ["数据C"], 2).then(ui => {
            console.log("弹窗PopupC显示完毕:", ui?.uiName);
        });


        // 等到特定时机，再执行队列，进到首页了， 或者是玩家达到某种条件了，此时呢，我们就恢复弹窗队列，触发弹窗队列的执行
        UIManager.instance.resumePopupQueue();


        // 等待一段时间后依次关闭弹窗
        this.scheduleOnce(() => {
            console.log("关闭当前显示的弹窗");
            const current = UIManager.instance.getCurrentFocusedUI();
            if (current) UIManager.instance.close(current.uiConf.url);
        }, 2);

        this.scheduleOnce(() => {
            console.log("再次关闭当前显示的弹窗");
            const current = UIManager.instance.getCurrentFocusedUI();
            if (current) UIManager.instance.close(current.uiConf.url);
        }, 4);

        this.scheduleOnce(() => {
            console.log("最后关闭剩余的弹窗");
            const current = UIManager.instance.getCurrentFocusedUI();
            if (current) UIManager.instance.close(current.uiConf.url);
        }, 6);
    }
}
