/**
 * HttpUtil - XMLHttpRequest 封装
 * - 支持 GET / POST / 二进制请求
 * - 带超时处理
 * - 网络耗时统计
 * - 支持可配置重试
 */
export class HttpUtil {


    /**
     * GET 请求
     *
     * @param url        请求地址
     * @param params     查询参数对象（会自动拼接到 URL 上）
     * @param onSuccess  成功回调 (data, attemptCost, totalCost?, attempts?)
     * @param onError    失败回调 (err)
     * @param timeoutMs  单次请求超时时间（毫秒），默认 10000
     * @param retry      最大重试次数（0 表示不重试），默认 0
     * @param retryDelay 初始重试延迟（毫秒，指数退避），默认 500
     *
     * @example
     * // GET 请求，失败时最多重试 2 次
     * // 第一次失败后延迟 500ms，再失败则延迟约 1000ms
     * HttpUtil.get(
     *   "https://example.com/api",
     *   { id: 123 },
     *   (data, cost) => {
     *     console.log("成功", data, cost);
     *   },
     *   (err) => {
     *     console.error("失败", err);
     *   },
     *   5000, // timeoutMs
     *   2,    // retry
     *   500   // retryDelay
     * );
     */

    public static get(
        url: string,
        params: Record<string, any> = {},
        onSuccess?: (data: any, timeCost: number) => void,
        onError?: (err: any) => void,
        timeoutMs: number = 10000,
        retry: number = 0,
        retryDelay: number = 500
    ) {
        // 拼接参数
        let query = Object.keys(params) //遍历所有的参数{k:v}
        // 注意要把参数encodeURIComponent一下，组成键值对的形式 也就是 key=value，而且都是经过encode
        // 就是为了避免中文，空格，特殊符号出现问题
            .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`) 
            .join("&");// 用&把这些键值对参数链接起来

            // 1.如果你的url中已经有参数了（？） 就直接用&拼接上新增的参数  https://example.com/api?id=123&name=%EFHGK@#%
            // 2.如果你的url中没有参数，那就加上？，和你上面格式化的参数列表 https://example.com/api?id=123&name=%EFHGK@#%
        if (query) url += (url.includes("?") ? "&" : "?") + query; 

        this._sendWithRetry(() => new XMLHttpRequest(), "GET", url, null, onSuccess, onError, timeoutMs, retry, retryDelay);
    }

    /**
     * POST 请求
     */
    public static post(
        url: string,
        body: any = {},
        onSuccess?: (data: any, timeCost: number) => void,
        onError?: (err: any) => void,
        timeoutMs: number = 10000,
        isJson: boolean = true,
        retry: number = 0,
        retryDelay: number = 500
    ) {
        const xhrFactory = () => {
            const xhr = new XMLHttpRequest();
            if (isJson) {
                xhr.setRequestHeader?.("Content-Type", "application/json");  //如果你想传递json，就设置这个头，告诉服务器，我传递的是json字符串
            } else {
                xhr.setRequestHeader?.("Content-Type", "application/x-www-form-urlencoded"); //否则的话就是走表单解析数据的形式，键值对的形式 key=value&key2=value2
            }
            return xhr;
        };

        let payload: string;
        if (isJson) {
            payload = JSON.stringify(body);
        } else {
            payload = Object.keys(body)
                .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(body[k])}`)  //如果走表单，要进行编码
                .join("&");
        }


        // json和表单有啥区别呢？
        // 结论：推荐使用json,而且现在游戏业务场景大多使用json
        // 后端可能直接用json.parse就解析了
        // 但是如果是表单的话，后端可能需要使用req.body或者req,getParameter来获取数据
        


        this._sendWithRetry(xhrFactory, "POST", url, payload, onSuccess, onError, timeoutMs, retry, retryDelay);
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
        contentType: string = "application/octet-stream",
        retry: number = 0,
        retryDelay: number = 500
    ) {
        const xhrFactory = () => {
            const xhr = new XMLHttpRequest();
            xhr.responseType = "arraybuffer";
            xhr.setRequestHeader?.("Content-Type", contentType);
            return xhr;
        };

        this._sendWithRetry(xhrFactory, "POST", url, buffer, onSuccess, onError, timeoutMs, retry, retryDelay);
    }

    /**
     * 带重试逻辑的发送
     */
    private static _sendWithRetry(
        //工厂函数，用来创建xhr对象，每次请求都会新创建一个xhr对象
        // ？ 因为XMLHttpRequest它是一次性资源，就是说从设计本身来说，就是一个请求，就绑定一个xhr实例
        // 然后因为每次请求都是和这个实例进行绑定的，所以说你不能复用前一个的实例，来发起后面的请求，另外所有成功回调，失败回调也是和这个实例进行绑定的，这样的设计呢，每次我们请求都是创建的新的xhr实例，所以能保证干净的上下文环境

        xhrFactory: () => XMLHttpRequest, 
        // 使用http请求，你指定的方法，时get还是post？
        // 这个get和post有什么区别呢？
        // 1.get请求，参数是可以跟到url后面同时你也可能从地址栏上看到，但是ipots请求，参数跟到body里面的
        //2.语义上的区别，get获取，从服务器数据，一般来说不会改变数据，post 提交数据，一般来说，我们会改变服务器的数据
        //3.缓存上的区别，就是，get方法，浏览器和代理服务器会默认缓存get的请求结构（看你的响应头） URL带参数也可能被缓存 post一般不会被缓存，除非服务器特殊设置

        // 就是根据get的特性，我们说了，get是去服务器请求数据，浏览器和代理服务器的话，肯定是跟希望倾向于你缓存数据对吧，比如下次在来请求这个数据，直接把缓存给你
        // ?sfasa, 即使这种url，如果你的响应允许的话也是可以缓存的，

        // 如果要缓存，会缓存到哪些地方呢？
        // 一种就是内存，这种浏览器关掉了，就清理掉了
        // 一种就是持久化缓存，disk磁盘
        //  中间代理缓存，也就是CDN，这样就不用去和服务器进行交互，用户请求能直接命中缓存，（就是如果有些配置，你需要即使更新，每次发了之后，要强行刷一下CDN缓存）
        // 就比如 服务器返回，Cache-Control: max-age=3600, 意思是，这个数据，缓存1小时，1小时内，再请求这个url，浏览器会直接从缓存里面拿数据，不会再去请求服务器
        //4.数据长度的限制，get参数时放在url上，一般来说，肯定不能把url搞得又长又复杂，参数长度有限制 默认2kb-8kb，不适合传大数据，post就不一样的，因为他的参数时放在body中的，虽然说每有大小限制，但是呢，还是合理些哈，他
        // 支持 json，二进制，大文件

        // 什么时候用get什么时候用post呢？
        // 你只想获取数据，那就用get,参数也比较少，希望缓存（在业务开发中，常用的还是这个get）
        // 要提交数据，修改服务器，比如写入数据库，参数多，内容放大，不希望浏览器缓存，那你就用post
        method: string,
        url: string,
        data: any,
        onSuccess?: (data: any, timeCost: number) => void,
        onError?: (err: any) => void,
        timeoutMs: number = 10000, // 超时的配置
        maxRetry: number = 0,
        retryDelay: number = 500
    ) {
        const attempt = (count: number) => {
            const xhr = xhrFactory();
            this._send( // _send方法是真正的和服务器进行交互的方法
                xhr,
                method,
                url,
                data,
                (resp, cost) => onSuccess?.(resp, cost),
                (err) => {
                    if (count < maxRetry) {
                        const delay = retryDelay * Math.pow(2, count); // 指数退避 每一次请求的时间间隔，都是做了指数退避的 避免短时间内疯狂重试，把压力打到服务器这边
                        setTimeout(() => attempt(count + 1), delay);
                    } else {
                        onError?.(err); //重试次数已经达到上线了
                    }
                },
                timeoutMs
            );
        };
        attempt(0);
    }

    /**
     * 内部通用发送逻辑
     */
    private static _send(
        xhr: XMLHttpRequest,
        method: string,
        url: string,
        data: any, // get的话可以传null
        onSuccess?: (data: any, timeCost: number) => void,
        onError?: (err: any) => void,
        timeoutMs: number = 10000
    ) {
        const startTime = Date.now(); //记录请求开始的时间。用来计算我这个请求耗时多久，在回调函数中会用的到
        let finished = false;// 请求是否结束的标记位，同时呢，也可也防止多次出发回调，因为xhr的状态变化回调，是会多次触发的 onreadystatechange  onerror onabort

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
            if (xhr.readyState === 4 && !finished) { // 状态=4 表示已完成，但是有可能是成功，也有可能是失败
                finished = true;
                clearTimeout(timer);

                const cost = Date.now() - startTime; // 请求发出去到成功，耗时多久

                if (xhr.status === 200) { // 200 就是成功，
                    try {
                        let resp = xhr.response;
                        if (xhr.responseType === "" || xhr.responseType === "text") {
                            resp = JSON.parse(xhr.responseText);
                        }


                        // 返回数据类型
                        // 1. 字符串 "" text 返回字符串，你parse一下
                        // 2. json  就是json，就不需要parse
                        // 3. 二进制  二进制肯定是不能被parse
                        // 4. 流 blob 返回
                        // 针对返回的不同的数据类型，我们采用不同的方式去处理
                        onSuccess?.(resp, cost);
                    } catch (err) {
                        onError?.({ type: "parse", msg: "数据解析失败", detail: err });
                    }
                } else { //返回码是其他的，比如404，500等，统一调用erro，返回码有哪些函数，大家可以百度菜鸟编程http返回码
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
        xhr.open(method, url, true);  // 真正把请求打到服务器，true =异步现在都是用异步的，因为你同步，说不定会把浏览器卡住了，这肯定是不行的 ，这一步时初始化，这一步相当于告诉服务器，我准备好了，请求的类型，和URL都配置好了
        xhr.send(data); // 这一步才是真正把请求发到服务器的动作，send之后，浏览器就开始等待服务器响应，同时呢监听onreadystatechange  onerror onabort 这些时间
    }
}


