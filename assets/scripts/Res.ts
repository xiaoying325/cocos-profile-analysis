/*
 * @Author: PENGCHAO 
 * @Date: 2024-01-29 16:43:31
 * @Description: 
 */
const { ccclass, property } = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {

    onLoad() {
        cc.systemEvent.on('test', this.test, this);
    }
    test() {
        cc.warn("test触发")
    }

    protected onDestroy(): void {
        //cc.systemEvent.off('test', this.test, this);
    }
}
