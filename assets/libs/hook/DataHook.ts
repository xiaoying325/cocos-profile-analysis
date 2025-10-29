import BaseHook from "./BaseHook";

const { ccclass, property, executeInEditMode, menu, help } = cc._decorator;


/**
 * 挂载了DataListener之后，会自动识别放到此列表中的组件，进行关联操作
 */
const COMP_ARRAY_CHECK = [
    ['BhvFrameIndex', 'index', false],
    ['BhvGroupToggle', 'index', false],
    ['BhvRollNumber', 'targetValue', false],



    //TODO 添加更多你封装的自定义组件
    ['BundleSpriteLoad', 'path', false],  //动态加载Sprite组件
    ['RemoteSpriteLoad', 'path', false],  //远程加载Sprite组件  这两个理论上来说可以合并，但是我不想这么做，理由就这么简单
    ['SvgaLoad', 'path', false],  //添加SVGA加载组件


    /**
     * Label组件
     */
    ['cc.Label', 'string', false],
    /**
     * 富文本组件
     */
    ['cc.RichText', 'string', false],
    /**
     * 编辑框组件
     */
    ['cc.EditBox', 'string', true],
    /**
     * 滑动器组件
     */
    ['cc.Slider', 'progress', true],

    /**
     * 挂载了Cocos进度条组件的
     */
    ['cc.ProgressBar', 'progress', false],
    /**
     * toggle组件
     */
    ['cc.Toggle', 'isChecked', true]
];


/**
 * DataHook 主要是配合各种hook组件使用，通过自动拦截属性，对组件进行赋值操作，同时也支持双向绑定数据 若有疑问，联系@彭超
 */
@ccclass
@menu('实验性/组件/添加自定义数据劫持组件')
@help('https://chatgpt.com/')
export default class DataHook extends BaseHook {

    @property({
        displayName: '启用双向绑定',

        tooltip: '勾选后，你的操作将改变数据来源的值，其他组件也会受到影响'
    })
    controller: boolean = false;

    @property({
        displayName: '数据来源',
        // visible: false,
        // override: true
    })

    source_path: string = "";

    @property({
        displayName: '劫持组件名称',
        tooltip: '绑定组件的名字'
    })
    componentName: string = "";

    @property({
        displayName: '劫持组件属性',
        tooltip: '组件上需要监听的属性'
    })
    componentProperty: string = "";

    @property({
        displayName: '刷新间隔频率',
        tooltip: '刷新间隔频率(只影响脏检查的频率)',
        step: 0.01,
        range: [0, 1],
        visible: function () {
            return this.controller === true
        }
    })
    refreshRate: number = 0.1;

    /**
     * 刷新间隔计时器
     */
    _timer = 0;

    /**
     * 监听的组件对象
     * - 比如如果是cc.Progress的话，componentProperty 就是 progress
     */
    _watchComponent: any = null;

    /**
     * 是否能监听组件的数据
     */
    _canWatchComponent: boolean = false;

    /**
     * 检查的值
     */
    _oldValue: any = null;


    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        super.onLoad();
        //只在运行时检查组件是否缺失可用
        this.checkEditorComponent();//编辑器检查
        if (!CC_EDITOR) {
            this._watchComponent = this.node.getComponent(this.componentName);
            this.checkComponentState();
        }
    }


    start() {
        //从 source 数据的路径中获取一个初始值
        this.onValueInit();
    }


    onRestore() {
        this.checkEditorComponent();
    }


    checkEditorComponent() {
        if (CC_EDITOR) {  //编辑器模式下，自动给组件赋值
            let checkArray = COMP_ARRAY_CHECK;
            this.controller = false;
            for (let i = 0; i < checkArray.length; i++) {
                const params = checkArray[i];
                let comp = this.node.getComponent(params[0] as string);
                if (comp) {
                    if (this.componentName == '') this.componentName = params[0] as string;
                    if (this.componentProperty == '') this.componentProperty = params[1] as string;
                    if (params[2] !== null) this.controller = params[2] as boolean;  //默认开启双向绑定

                    break;
                }

            }
        }


    }

    checkComponentState() {
        this._canWatchComponent = false;
        if (!this._watchComponent) {
            console.error('未设置需要监听的组件');
            return;
        }
        if (!this.componentProperty) {
            console.error('未设置需要监听的组件 的属性');
            return;
        }
        if (this.componentProperty in this._watchComponent === false) {
            console.error('需要监听的组件的属性不存在,请按照右侧输出日志进行排查', this.node.name);
            return;
        }
        this._canWatchComponent = true;
    }

    getComponentValue() {
        return this._watchComponent[this.componentProperty];

    }

    setComponentValue(value: any) {
        //如果遇到cc.Toggle 组件就调用上面的方法解决
        if (this.componentName == "cc.Toggle") {
            if (value == true) {
                this.node.getComponent(cc.Toggle).check();
            }
            if (value == false) {
                this.node.getComponent(cc.Toggle).uncheck();
            }
        } else {
            this._watchComponent[this.componentProperty] = value; // 比如是进度组件，只需要赋值progress属性即可
        }
    }


    /**
     * 初始化获取数据
     */
    onValueInit() {
        if (CC_EDITOR) {
            return; //编辑器模式不初始化
        }
        //更新信息
        let value = this.VM.getValue(this.source_path);
        this.setComponentValue(value);
    }

    /**
     * 相当于就是说，当组件的值发生变化后，触发更新此值
     * - 你可以重写此函数，指定你想更新的值
     */
    onValueController(newValue, oldValue) {
        this.VM.setValue(this.source_path, newValue);
    }

    /**
     * [可重写]初始化改变数据
     */
    onValueChanged(n, o, pathArr: string[]) {
        this.setComponentValue(n);
    }

    update(dt) {
        //脏检查（组件是否存在，是否被激活）
        if (CC_EDITOR == true || !this.controller) {
            return;
        }
        if (!this._canWatchComponent || this._watchComponent['enabled'] === false) { //组件是否已激活
            return;
        }

        //刷新频率检查
        this._timer += dt;
        if (this._timer < this.refreshRate) {
            return;
        }
        this._timer = 0;

        let oldValue = this._oldValue;
        let newValue = this.getComponentValue();

        if (this._oldValue === newValue) {
            return;
        }


        this._oldValue = this.getComponentValue();
        this.onValueController(newValue, oldValue);

    }
}
