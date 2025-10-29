
import BaseHook from './BaseHook';
import { StringUtls } from './utils/StringUtils';



const { ccclass, property, menu, executeInEditMode, help } = cc._decorator;

enum LABEL_TYPE {
    CC_LABEL,
    CC_RICH_TEXT,
    CC_EDIT_BOX
}


/**
 * 用来处理label组件的数据更新
 * TODO 如果是单数据来源，希望也能支持文本范式，比如我填写的文本范式为{kmbt:{0}},或者说是富文本的范式如
 * <size=42><outline color=#654111 width=3>{{0}}</outline></size>，其中{{0}} 就是你用来存放值得地方
 *  @彭超 近期优化
 */
@ccclass
//@executeInEditMode
@menu('实验性/组件/1.添加文本数据劫持组件')
@help('https://chatgpt.com/')
export default class LabelHook extends BaseHook {


    @property({
        displayName: "数据来源",
        tooltip: '当数据来源更新时，此组件会自动更新',
        visible: function () {
            return this.multi_key_hook === false;
        }
    })
    source_path: string = "";


    @property({
        displayName: "组件类型",
        type: cc.Enum(LABEL_TYPE),
        //readonly: true // 组件类型不能修改，只在面板做展示

    })
    private type: LABEL_TYPE = LABEL_TYPE.CC_LABEL;

    @property({
        displayName: "是否启用双数据来源",
        tooltip: ""
    })
    public multi_key_hook: boolean = false;


    @property({
        displayName: "文本范式",
        tooltip: "当选择多重数据来源是，请指定文本范式，如：{{0}}  - Lv.{{1}}，请记住，占位符一定要和数据源数量匹配，不匹配的情况还没时间优化",
        visible: function () {
            return this.multi_key_hook;
        },
    })
    format_string: string = "";



    /**
     * 双数据来源
     * - 也就是说 如果你指定了两个数据key，那这个组件的展示会根据两个key的数据来处理
     */
    @property({
        displayName: "多重数据来源",
        type: [cc.String],
        visible() {
            return this.multi_key_hook === true
        }
    })
    protected source_paths: string[] = [];



    /**
     * 从数据model中解析的双数据来源的值
     * - 只针对监听了双数据来源的情况
     */
    protected temp_values: any[] = [];



    /**
     * format_list
     * - 用来存储文本范式中的占位符号，比如你在文本范式中存储的内容为：{{0:kmbt}}  / {{1:kmbt}}
     * - 那么当数据源刷新之后，这个组件就知道如何根据这个范式来刷新数据，比如kmbt 就是要把当前内容金币格式化，
     */
    private format_list: string[] = [];



    /**
     * 组件类型
     */

    private component: cc.Label | cc.RichText | cc.EditBox = null;

    /**
     * 组件上你给的默认的数据，比如你在label上写了 {{0}}  - Lv.{{1}} 这样的数据
     * - 那就一定要要勾选双数据监听
     * - model.key1  对应的就是0
     * - model.key2  对应的就是1
     * - 当然了，你要不嫌麻烦，其实也可以用两个LabelListener来监听这两个key，然后搞两个label组件来展示
     */
    default_text: string = null;

    // LIFE-CYCLE CALLBACKS:


    getLabel() {

        if (this.type === LABEL_TYPE.CC_LABEL) {
            this.component = this.getComponent(cc.Label)
            if (!this.component) {
                console.error('没有挂载cc.Label组件,将自动挂载该组件');
                this.component = this.node.addComponent(cc.Label);
            }
        } else if (this.type === LABEL_TYPE.CC_RICH_TEXT) {
            this.component = this.getComponent(cc.RichText)
            if (!this.component) {
                console.error('没有挂载cc.RichText组件,将自动挂载该组件');
                this.component = this.node.addComponent(cc.RichText);
            }
        } else if (this.type === LABEL_TYPE.CC_EDIT_BOX) {
            this.component = this.getComponent(cc.EditBox)
            if (!this.component) {
                console.error('没有挂载cc.EditBox组件,将自动挂载该组件');
                this.component = this.node.addComponent(cc.EditBox);
            }
        }
    }




    onLoad() {
        super.onLoad();
        this.getLabel(); // 获取当前节点上的组件
        if (!CC_EDITOR) {
            if (this.multi_key_hook) {
                this.default_text = this.format_string || this.component.string; // "{{0}}  - Lv.{{1}}",双重数据来源获取label中默认的内容
                if (this.default_text == "") {
                    console.error('请在组件上指定文本范式');
                    return;
                }
                this.parse();
            }
        }
    }


    /**
     * 从 this.default_text 中找到所有形如 {{xxx:yyy}} 的模板占位符,其实也就是解析出每个内容使用的规则函数，例如kmbt
     * 
     * 
     * @returns 
     */
    parse() {
        let regexAll = /\{\{(.+?)\}\}/g; //匹配： 所有的{{value}}
        let regex = /\{\{(.+?)\}\}/;//匹配： {{value}} 中的 value
        let res = this.default_text.match(regexAll);//匹配结果数组  

        /**
         *  [
         *    "{{0:kmbt}}"
         *    "{{1:kmbt}}"
         * ]
         */
        if (res == null) {
            return;
        }
        for (let i = 0; i < res.length; i++) {
            const e = res[i]; // 最终会匹配出一个数组出来
            let arr = e.match(regex); //[ "{{0:kmbt}}","0:kmbt"]
            let matchName = arr[1];
            let matchInfo = matchName.split(':')[1] || ''; //"kmbt"
            this.format_list[i] = matchInfo;
        }

    }



    replace() {
        if (!this.default_text) {
            console.error('由于你在组件上没有指定文本范式，所以无法解析双数据来源');
            return;
        }
        let regexAll = /\{\{(.+?)\}\}/g; //匹配： 所有的{{value}}
        let regex = /\{\{(.+?)\}\}/;//匹配： {{value}} 中的 value
        let res = this.default_text.match(regexAll);//["{{0:kmbt}}","{{1:kmbt}}"]
        if (res == null) {
            return '';
        }//未匹配到文本
        let str = this.default_text;//原始字符串模板 "name:{{0}} 或 name:{{0:fix2}}"

        for (let i = 0; i < res.length; i++) {
            const e = res[i];
            let getValue;
            let arr = e.match(regex); //["{{0:kmbt}}","0:kmbt"]
            let indexNum = parseInt(arr[1] || '0') || 0; //"1:kmbt"  最终会提取出1  背后原理，parseInt("1:kmbt") ，解析到1符合，就停止解析，换句话说，parseInt("1:kmbt") 会自动忽略冒号和后面的内容，只保留前面的数字
            let format = this.format_list[i]; // 看看第一个数据源的文本范式，用的是什么格式化规则，比如kbmt就是金币格式化
            getValue = this.temp_values[indexNum];
            str = str.replace(e, this.get_formats(getValue, format));//从路径缓存值获取数据
        }
        return str;
    }

    /**
     *  格式化字符串
     */
    get_formats(value: number | string, format: string): string {
        return StringUtls.deal(value, format);
    }



    start(): void {
        //if (CC_EDITOR) return;
        this.onValueInit();
    }

    /**
     * 初始化获取数据
     */
    onValueInit() {

        if (this.multi_key_hook === false) {
            let value = this.VM.getValue(this.source_path);
            this.component.string = value + '';
        } else {
            let max = this.source_paths.length;
            for (let i = 0; i < max; i++) {
                let value = this.VM.getValue(this.source_paths[i], '?');
                this.temp_values[i] = value;
            }

            let value = this.replace();
            this.component.string = value + '';

        }
    }

    /**
     * 监听数据发生了变动的情况
     */
    onValueChanged(n, o, pathArr: string[]) {
        if (this.multi_key_hook === false) {
            this.component.string = n + '';
        } else {
            let path = pathArr.join('.');
            //寻找缓存位置
            let index = this.source_paths.findIndex(v => v === path);

            if (index >= 0) {
                //如果是所属的路径，就可以替换文本了
                this.temp_values[index] = n; //缓存值
                let value = this.replace();
                this.component.string = value + '';

            }

        }
    }
    // update (dt) {}
}
