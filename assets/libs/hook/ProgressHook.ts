
import DataHook from "./DataHook";
import { StringUtls } from "./utils/StringUtils";


const { ccclass, property, menu, help } = cc._decorator;


/**
 * 若有疑问，联系 @彭超
 * - progressHook 必须至少传递三个参数，
 * - tempvalue[0] 是 min值 值
 * - tempvalue[1] 是 max 值
 * - tempvalue[2] 是 旧值，当进度增长动画启用时，需要提供旧值，同时呢，你提供这个值，但是呢，你又没有勾选'启用进度增长动画'，这个值也是没什么作用的，所以放心使用，没什么影响
 */
@ccclass
@menu('实验性/组件/添加进度数据劫持组件')
@help('https://chatgpt.com/')
export default class ProgressHook extends DataHook {

    @property({
        displayName: '数据来源',
        visible: false,
        override: true  //覆盖重写父类的source_path
    })
    source_path: string = '';

    @property({
        displayName: '多重数据来源',
        type: [cc.String],
        tooltip: '第一个值是当前进度值，第二个值 是最大进度值，会计算出两者的比例，第三个值是旧值，做进度增长动画使用,第4个值是进度增长时，需要更新的关联的数据来源'
    })
    protected source_paths: string[] = [];




    public multi_key_hook: boolean = true;

    @property({
        visible: function () { return this.componentProperty === 'string' },
        tooltip: '字符串格式化，和 LabelHook 的字段一样，需要填入对应的格式化字符串'
    })
    stringFormat: string = '';


    /**
     * 是否启用进度值增长动画
     */
    @property({
        displayName: '启用进度增长动画',
        tooltip: '是否启用进度条数值变化动画,比如从旧值涨到新值，需要你提供旧值',
    })
    public useTween: boolean = false;


    @property({
        displayName: '动画时长(秒)',
        tooltip: '进度条从当前值到目标值的过渡时间',

        visible: function () { return this.useTween },
    })
    tweenDuration: number = 0.3;


    @property(
        {
            displayName: '进度变化事件',
            tooltip: '进度值变化时触发的事件',
            type: [cc.Component.EventHandler],
            visible: function () { return this.useTween }
        }
    )
    notifyEvents: cc.Component.EventHandler[] = [];



    @property({
        displayName: '影响数据源',
        tooltip: '进度增长动画过程中，可能会影响到的数据源，一般都是和LabelHook搭配使用',
        type: [cc.String],
        visible: function () { return this.useTween },
    })
    //notify_source_path: string = ''; 这里时值类型，在submodelhook中改变之后，这里不会受到影响，所以要换成引用类型
    notify_source_paths: string[] = [];



    private tweening: cc.Tween = null; // 缓存tween实例


    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        if (this.source_paths.length < 2 || this.source_paths[0] == '[min]' || this.source_paths[1] == '[max]') {
            console.error('ProgressHook需要至少指定两个数据来源');
        }
        super.onLoad();
    }

    start() {
        //  if (!CC_EDITOR) {
        this.onValueInit();
        //}
    }

    onValueInit() {
        let max = this.source_paths.length; // 注意注意，如果勾选了进度增长动画，那么source_paths 至少需要指定3个数据来源，index=2 的就是旧数据来源
        for (let i = 0; i < max; i++) {
            this.temp_values[i] = this.VM.getValue(this.source_paths[i]);
        }
        let curValue = this.temp_values[0] / this.temp_values[1]; //计算出最新的进度比例
        this.setComponentValue(curValue);
    }

    setComponentValue(value: any) {
        if (this.stringFormat !== '') {
            let res = StringUtls.deal(value, this.stringFormat);
            super.setComponentValue(res);
        } else {
            if (this.useTween && typeof value === "number") {
                this.playTween();
            } else {

                super.setComponentValue(value);
            }
        }
    }





    /**
     * 
     * @param targetValue 
     */
    private playTween() {
        if (this.tweening) {
            this.tweening.stop();
            this.tweening = null;
        }



        let newValue = this.temp_values[0];        // 新值SA
        let maxValue = this.temp_values[1];        // 满值
        let oldValue = this.temp_values[2];          // 旧值

        let oldProgress = oldValue / maxValue;
        let newProgress = newValue / maxValue;

        this._watchComponent[this.componentProperty] = oldProgress; //先给玩家展示出旧的进度


        this.scheduleOnce(() => {  //1s之后 在开始进度增长动画
            // --- 进度label文本数据同步 ---
            let time = this.tweenDuration;
            let elapsed = 0;

            this.schedule((dt: number) => {
                elapsed += dt;
                let ratio = Math.min(elapsed / time, 1);
                // 只保留整数部分
                let currentValue = Math.floor(oldValue + (newValue - oldValue) * ratio);

                // 通知关联的数据源
                this.notify_source_paths.forEach(v => {
                    this.VM.setValue(v, `${currentValue}/${maxValue}`);
                })

                if (ratio >= 1) {
                    this.unscheduleAllCallbacks(); // 停止调度
                }
            }, 0); // 每帧回调


            // 进度条 UI 直接补间
            this._watchComponent[this.componentProperty] = oldProgress;
            cc.tween(this._watchComponent)
                .to(time, { progress: newProgress })
                .start();

        }, 0.5)








    }

    onValueController(n, o) {

    }

    /**
     * 初始化改变数据
     */
    onValueChanged(n, o, pathArr: string[]) {
        if (this.multi_key_hook === false) {
            return;
        }


        let path = pathArr.join('.');
        //寻找缓存位置
        let index = this.source_paths.findIndex(v => v === path);
        if (index >= 0) {
            //如果是所属的路径，就可以替换文本了
            this.temp_values[index] = n; //缓存值
        }

        let value = this.temp_values[0] / this.temp_values[1];
        if (value > 1) value = 1;
        if (value < 0 || Number.isNaN(value)) value = 0;

        this.setComponentValue(value);
    }




}
