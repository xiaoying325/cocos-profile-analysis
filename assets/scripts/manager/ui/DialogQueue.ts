import DialogBase from "./DialogBase";

// TODO 弹窗队列
// 弹窗队列，用于管理弹窗的打开和关闭
export class DialogQueue {
    private static _instance: DialogQueue = null;
    public static get instance(): DialogQueue {
        if (this._instance == null) {
            this._instance = new DialogQueue();
        }
        return this._instance;
    }
    private _dialogQueue: DialogBase[] = [];
    public addDialog(dialog: DialogBase) {
        this._dialogQueue.push(dialog);
    }
    public getDialog(): DialogBase {
        return this._dialogQueue.shift();
    }
    public getDialogCount(): number {
        return this._dialogQueue.length;
    }
}