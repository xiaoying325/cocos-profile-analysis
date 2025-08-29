/**
 * HttpUtil - XMLHttpRequest 封装
 * - 支持 GET / POST / 二进制请求
 * - 带超时处理
 * - 网络耗时统计
 */
export class HttpUtil {
    /**
     * GET 请求
     */
    public static get(url: string, params: Record<string, any> = {}, onSuccess?: (data: any, timeCost: number) => void, onError?: (err: any) => void, timeoutMs: number = 10000) {
        const xhr = new XMLHttpRequest();
        // 拼接参数
        let query = Object.keys(params).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join("&");
        if (query) url += (url.includes("?") ? "&" : "?") + query;

        this._send(xhr, "GET", url, null, onSuccess, onError, timeoutMs);
    }

    /**
     * POST 请求
     */
    public static post(url: string, body: any = {}, onSuccess?: (data: any, timeCost: number) => void, onError?: (err: any) => void, timeoutMs: number = 10000, isJson: boolean = true) {
        const xhr = new XMLHttpRequest();
        let payload: string;

        if (isJson) {
            xhr.setRequestHeader?.("Content-Type", "application/json");
            payload = JSON.stringify(body);
        } else {
            xhr.setRequestHeader?.("Content-Type", "application/x-www-form-urlencoded");
            payload = Object.keys(body)
                .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(body[k])}`)
                .join("&");
        }

        this._send(xhr, "POST", url, payload, onSuccess, onError, timeoutMs);
    }

    /**
     * 发送二进制数据 (protobuf/arraybuffer)
     */
    public static postBinary(
        url: string,
        buffer: Uint8Array,
        onSuccess?: (data: ArrayBuffer, timeCost: number) => void,
        onError?: (err: any) => void,
        timeoutMs: number = 10000,
        contentType: string = "application/octet-stream"
    ) {
        const xhr = new XMLHttpRequest();
        xhr.responseType = "arraybuffer";
        xhr.setRequestHeader?.("Content-Type", contentType);

        HttpUtil._send(xhr, "POST", url, buffer, onSuccess, onError, timeoutMs);
    }

    /**
     * 内部通用发送逻辑
     */
    private static _send(xhr: XMLHttpRequest, method: string, url: string, data: any, onSuccess?: (data: any, timeCost: number) => void, onError?: (err: any) => void, timeoutMs: number = 10000) {
        const startTime = Date.now();
        let finished = false;

        // 超时控制
        const timer = setTimeout(() => {
            if (!finished) {
                finished = true;
                xhr.abort();
                onError?.({ type: "timeout", msg: "请求超时" });
            }
        }, timeoutMs);

        // 状态变化
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4 && !finished) {
                finished = true;
                clearTimeout(timer);

                const cost = Date.now() - startTime;

                if (xhr.status === 200) {
                    try {
                        let resp = xhr.response;
                        if (xhr.responseType === "" || xhr.responseType === "text") {
                            resp = JSON.parse(xhr.responseText);
                        }
                        onSuccess?.(resp, cost);
                    } catch (err) {
                        onError?.({ type: "parse", msg: "数据解析失败", detail: err });
                    }
                } else {
                    onError?.({ type: "http", status: xhr.status, msg: xhr.statusText });
                }
            }
        };

        // 基础事件监听
        xhr.onerror = () => {
            if (!finished) {
                finished = true;
                clearTimeout(timer);
                onError?.({ type: "error", msg: "网络错误" });
            }
        };

        xhr.onabort = () => {
            if (!finished) {
                finished = true;
                clearTimeout(timer);
                onError?.({ type: "abort", msg: "请求被取消" });
            }
        };

        // 打开 & 发送
        xhr.open(method, url, true);
        xhr.send(data);
    }
}
