import { ImageComponent } from "./lib/ImageComponent";


/**
 * 从URL中获取查询参数
 * @param {string} url 
 * @returns object
 */
export function getQueryString<T extends QueryObject>(url: string): T {
    let [cleanUrl, search] = url.split('?');

    let match = cleanUrl.match(/[^./\\]*\.(\w+)(?:\?.*)?$/i);
    let ext = match ? match[1].toLowerCase() : "";

    let info: QueryObject = { ext, hasQuery: "" };
    if (!search) {
        return info as T
    }
    let query = JSON.parse('{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
    info.hasQuery = "1";
    Object.assign(info, query);
    return info as T;
}


export interface QueryObject extends Object {
    ext: string;
    hasQuery: "" | "1";
}
/**
 * 处理头像url,由于头像url是外部传入的，尺寸不可控，所以需要处理
 * @param url 
 * @returns [url, extension]
 */
export function processAvatarUrl(url: string, size: number = 100): [string, string] {
    if (!url) {
        return ["", ""];
    }

    interface AvatarQueryObject extends QueryObject { w: string, h: string, is_gif: string };

    const info = getQueryString<AvatarQueryObject>(url);
    const w = +info.w || 1;
    const h = +info.h || 1;

    let ext = info.ext ? info.ext : info.is_gif ? 'gif' : 'png';

    url += info.hasQuery ? "&" : "?";

    const scaleMode = w == h ? "m_fixed" : "m_fill";
    url += `x-oss-process=image/resize,${scaleMode},h_${size},w_${size}`;

    if (ext == "webp") {

        if (cc.sys.os == cc.sys.OS_IOS) {
            const userAgent = navigator.userAgent;
            //因为判断了iOS系统，这里只用识别系统大版本就行.例如： 12.1版本 对应 OS 12_1，只会识别出12
            const [, os] = userAgent.match(/ OS (\d+)/) || [];
            const version = +os;
            if (version < 14) {
                url += "/format,png";
                ext = "png";
            }
        }

    }
    return [url, ext];
}
const { ccclass, property } = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {

    @property(ImageComponent)
    image: ImageComponent = null;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {
        let gifURL = 'http://127.0.0.1:10001/test.gif';
        let [url, ext] = processAvatarUrl(gifURL);
        this.image.setUrl(url, ext);
    }

    // update (dt) {}
}
