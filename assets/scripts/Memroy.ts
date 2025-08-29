
/**
 * v2.3 版本引擎 EmptyProject项目运行时缓存的内部资源（共19个内置资源）
 * preview-scene.json  //当前的场景资源
 * res/import/0e/0e93aeaa-0b53-4e40-b8e0-6268b4e07bd7.json
 * res/import/02/0275e94c-56a7-410f-bd1a-fc7483f7d14a.json
 * res/import/02/0275e94c-56a7-410f-bd1a-fc7483f7d14a.png
 * res/import/2a/2a7c0036-e0b3-4fe1-8998-89a54b8a2bec.json
 * res/import/2a/2a296057-247c-4a1c-bbeb-0548b6c98650.json
 * res/import/3a/3a7bb79f-32fd-422e-ada2-96f518fed422.json
 * res/import/6d/6d91e591-4ce0-465c-809f-610ec95019c6.json
 * res/import/6f/6f801092-0c37-4f30-89ef-c8d960825b36.json
 * res/import/7a/7afd064b-113f-480e-b793-8817d19f63c3.json
 * res/import/14/144c3297-af63-49e8-b8ef-1cfa29b3be28.json
 * res/import/28/2874f8dd-416c-4440-81b7-555975426e93.json
 * res/import/43/432fa09c-cf03-4cff-a186-982604408a07.json
 * res/import/46/466d4f9b-e5f4-4ea8-85d5-3c6e9a65658a.json
 * res/import/60/600301aa-3357-4a10-b086-84f011fa32ba.json
 * res/import/60/600301aa-3357-4a10-b086-84f011fa32ba.png
 * res/import/82/829a282c-b049-4019-bd38-5ace8d8a6417.json
 * res/import/c0/c0040c95-c57f-49cd-9cbc-12316b73d0d4.json
 * res/import/cf/cf7e0bb8-a81c-44a9-ad79-d28d43991032.json
 * res/import/ec/eca5d2f2-8ef6-41c2-bbe6-f9c79d09c432.json
 * 
 */


/*
如果释放到只有19个资源那就是最纯净的

*/


declare interface loadItem {
    url: string,
    assets: cc.Asset,
    cache: boolean,
    count: number,
}



import { Loader } from "./Loader";

const { ccclass, property } = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {


    @property(cc.Sprite)
    testSpr: cc.Sprite = null;

    // dump() {
    //     this.getRuntimeCacheAssetType();
    // }

    // onClickShowCache() {
    //     let node = cc.instantiate(this.showCache)
    //     this.node.addChild(node);
    // }


    // copied from cocos engine. 略有改动
    //分析依赖
    parseDepends(key, parsed) {
        const item = cc.loader['getItem'](key);
        if (item) {
            const depends = item.dependKeys;
            if (depends) {
                for (let i = 0; i < depends.length; i++) {
                    const depend = depends[i];
                    if (!parsed[depend]) {
                        parsed[depend] = true;

                        if (this.debugUrl === depend) {
                            cc.log('debug');
                        }

                        this.parseDepends(depend, parsed);
                    }
                }
            }
        }
    }


    debugUrl = '';

    visitAsset(asset, excludeMap) {
        //有些资源是没有uuid的
        if (!asset._uuid) {
            if (asset instanceof cc.SpriteFrame) {
                if (asset['_original']) { // 动态合图
                    const texture = asset['_original']._texture;
                    texture && this.visitAsset(texture, excludeMap);
                } else {
                    const texture = asset.getTexture();
                    texture && this.visitAsset(texture, excludeMap);
                }
            }
            return;
        }

        /**
         * 抄自 CCLOader.js
         * proto._getReferenceKey = function (assetOrUrlOrUuid) {
            var key;
            if (typeof assetOrUrlOrUuid === 'object') {
                key = assetOrUrlOrUuid._uuid || null;
            }
            else if (typeof assetOrUrlOrUuid === 'string') {
                key = this._getResUuid(assetOrUrlOrUuid, null, null, true) || assetOrUrlOrUuid;
            }
            if (!key) {
                cc.warnID(4800, assetOrUrlOrUuid);
                return key;
            }
            cc.AssetLibrary._getAssetInfoInRuntime(key, _info);
            return this._cache[_info.url] ? _info.url : key;
        };
         */
        const key = cc.loader['_getReferenceKey'](asset);//获取 当前资源的缓存key
        if (!excludeMap[key]) {
            excludeMap[key] = true; //当前资源正在被使用中

            if (this.debugUrl === key) {
                cc.log('debug');
            }

            this.parseDepends(key, excludeMap);
        }
    }

    visitNodePool(nodePool, excludeMap) {
        const pool = nodePool._pool as Array<cc.Node>;
        for (let j = 0; j < pool.length; j++) {
            const node = pool[j];
            this.visitNode(node, excludeMap);
        }
    }


    visitComponent(comp, excludeMap) {
        cc.warn('组件', comp)
        const props = Object.getOwnPropertyNames(comp); //获取当前组件脚本身上所有的属性字段
        cc.warn("props", props);
        for (let i = 0; i < props.length; i++) {
            const value = comp[props[i]];

            cc.warn("======>当前属性的值", value)
            if (value instanceof cc.Node) {
                continue; //如果当前属性是node，则跳过
            }

            if (typeof value === 'object' && value) {
                if (value instanceof cc.NodePool) { //如果是神明的节点池子
                    //todo
                    this.visitNodePool(value, excludeMap)
                } else if (Array.isArray(value)) {
                    for (let j = 0; j < value.length; j++) {
                        const val = value[j];
                        if (val instanceof cc.RawAsset) { //如果是定义的资源数组 如 cc.SpriteFrame[] = []
                            this.visitAsset(val, excludeMap);
                        }
                    }
                } else if (!value.constructor || value.constructor === Object) { //如果是定义资源对象object
                    const keys = Object.getOwnPropertyNames(value);
                    for (let j = 0; j < keys.length; j++) {
                        const val = value[keys[j]];
                        if (val instanceof cc.RawAsset) {
                            this.visitAsset(val, excludeMap);
                        }
                    }
                } else if (value instanceof cc.RawAsset) { //如果就是定义的普通的资源数据
                    this.visitAsset(value, excludeMap);
                }
            }
        }

    }


    //筛选一波正在呗场景上节点引用的资源
    visitNode(node, excludeMap) {
        if (!cc.isValid(node)) return;

        cc.warn("当前遍历到的节点名称", node.name);
        cc.warn(node);

        cc.warn("当前节点身上所有的组件", node._components)
        for (let i = 0; i < node._components.length; i++) {
            this.visitComponent(node._components[i], excludeMap);
        }

        //遍历当前传进来的节点下的孩子节点
        for (let i = 0; i < node._children.length; i++) {
            this.visitNode(node._children[i], excludeMap);
        }
    }


    visitItem(item, excludeMap) {
        if (excludeMap[item.url]) {
            return;
        }

        if (item.complete) {
            const asset = item.content;
            if (asset) {
                if (asset instanceof cc.RawAsset) {
                    this.visitAsset(asset, excludeMap);
                } else {
                    cc.log('asset instanceof cc.RawAsset === false');
                }
            } else {
                cc.log('item.complete === true, but item.content  is empty');
            }
            excludeMap[item.url] = true;

            if (this.debugUrl === item.url) {
                cc.log('debug');
            }
        } else {
            //如果资源还没有加载完毕
            excludeMap[item.url] = true;

            if (this.debugUrl === item.url) {
                cc.log('debug');
            }

            const deps = item.deps;
            if (deps && deps.length > 0) {
                for (let i = 0; i < deps.length; i++) {
                    const item = deps[i];
                    this.visitItem(item, excludeMap);
                }
            }
        }
    }


    onLoad() {
        //this.loadPrefab1();
        //this.getRealBuiltinDeps();


        function isPalindrome(x: number): boolean {
            // 负数和以0结尾的数（除0以外）不是回文数
            if (x < 0 || (x % 10 === 0 && x !== 0)) {
                return false;
            }

            let reversed = 0;
            let original = x; // 记录原始值

            // 反转数字的一半
            while (x > 0) {
                reversed = reversed * 10 + (x % 10); // 取最后一位并加入反转数
                x = Math.floor(x / 10); // 去掉最后一位
            }

            // 比较原始数和反转后的数
            return original === reversed;
        }


       console.warn( isPalindrome(121))
    }




    loadRes1() {
        cc.loader.loadRes('bg_100', cc.SpriteFrame, (err, spriteFrame) => {
            this.testSpr.spriteFrame = spriteFrame;
            let allRefRes = cc.loader.getDependsRecursively(spriteFrame)
            /**
             * 0: "res/import/6c/6cc72967-d388-4520-937c-a00dd65b1af2.json"
             * 1: "res/import/6c/6cc72967-d388-4520-937c-a00dd65b1af2.jpg"
             * 2: "res/import/fa/fa2b8321-3bd2-4f95-add0-1cc5cdc7b13b.json"
             */
            //cc.warn(allRefRes);
            //这种释放会有很大的隐患，如果当前资源被静态使用了，如被场景某个节点使用了， 对象池缓存了
            //如此释放就会导致渲染崩溃

            const sceneRefMap = cc.js.createMap();


            cc.warn("=====>开始排除正在被场景所引用的资源")
            const nodeList = cc.director.getScene().children;
            cc.warn("当前场景下的节点列表", nodeList)
            for (let i = 0; i < nodeList.length; i++) {
                this.visitNode(nodeList[i], sceneRefMap)
            }
            cc.warn("=====>排除场景正在引用的资源", sceneRefMap)





            cc.warn("=====>开始剔除加载中的资源");
            const loadingRefMap = cc.js.createMap();
            const runningQueues = {};
            const cache = cc.loader['_cache'];
            for (const key in cache) {
                const item = cache[key];
                const queue = cc.LoadingItems.getQueue(item);  //获取当前资源所加载进来的队列
                if (queue) { //如果有加载队列
                    const queueId = queue['_id'];
                    runningQueues[queueId] = queue;
                }
            }
            for (const queueId in runningQueues) {
                const queue: cc.LoadingItems = runningQueues[queueId];
                for (const url in queue.map) { //获取所有的加载项对象
                    const item = queue.map[url];
                    this.visitItem(item, loadingRefMap);
                }
            }
            cc.warn("=====>排除加载中的资源", loadingRefMap)

            //cc.loader.release(allRefRes);
        })

        //cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.keyListener, this);
        // Creator 提供了 cc.loader.loadRes 这个 API 来专门加载那些位于 resources 目录下的 Asset

    }

    loadPrefab1() {
        cc.loader.loadRes('1', cc.Prefab, (err, prefab) => {

            let newNode: cc.Node = cc.instantiate(prefab);
            this.node.addChild(newNode);

            //当前资源所依赖的所有资源包括内置
            let allRefRes = cc.loader.getDependsRecursively(prefab)

            const intertalRes = cc['AssetLibrary'].getBuiltinDeps();
            let interRes = Object.keys(intertalRes)



            // 使用 Set 存储 interRes 中的资源
            // const interResSet = new Set(interRes);

            // for (let i = 0; i < allRefRes.length; i++) {
            //     const item = cc.loader['getItem'](allRefRes[i]);
            //     if (!item.dependKeys) continue;

            //     for (let j = 0; j < item.dependKeys.length; j++) {
            //         const dependKey = item.dependKeys[j];
            //         if (interResSet.has(dependKey)) {
            //             interResSet.add(allRefRes[i]);
            //             break;
            //         }
            //     }
            // }

            // // 将 Set 转换回数组形式
            // interRes = Array.from(interResSet);



            //判断当前依赖中有没有内置资源的children,比如我们在上面获取的内置资源中有个PNG的资源，PNG下面对应SpriteFrmae资源是没有被统计到内置资源缓存中的，所以要特殊处理下
            // for (let i = 0; i < allRefRes.length; i++) {
            //     const item = cc.loader['getItem'](allRefRes[i])
            //     if (!item.dependKeys)
            //         continue;
            //     if (item.dependKeys.length > 0) {
            //         for (let j = 0; j < item.dependKeys.length; j++) {
            //             const dependKey = item.dependKeys[j];
            //             if (interRes.includes(dependKey)) {
            //                 if (!interRes.includes(allRefRes[i])) {
            //                     interRes.push(allRefRes[i])
            //                 }
            //             }
            //         }
            //     }
            // }

            // cc.warn("这才是真正的内置资源", interRes)






            let builtinRes = interRes.filter(e => allRefRes.includes(e));
            let filteredRefs = allRefRes.filter(e => !interRes.includes(e));

            cc.warn("当前资源依赖的所有资源(包含内置)", cc.loader.getDependsRecursively(prefab))
            //.warn('引擎内置的资源', intertalRes);
            cc.warn("当前资源引用的引擎内置资源", builtinRes)
            cc.warn("当前资源引用的非引擎的内置资源", filteredRefs)

            //cc.warn(cc.loader.getDependsRecursively(newNode)) //组件是不能通过该接口获取依赖的
            this.scheduleOnce(() => {
                /**
                 * //使用和    cc.loader.loadRes 相同的参数进行释放，说白了，就是匹配的
                 * 调用释放后，发现预制件的4个进内存的资源，只释放了一个，也就是一个预制件与之对应的的json文件被释放掉了（经过验证了 确信）其他引用的图片啥的没有被试阿芳
                 * 
                 */
                //cc.loader.releaseRes('1')


                /**
                 * 调用释放后，发现预制件的4个进内存的资源，只释放了一个，也就是一个预制件与之对应的的json文件被释放掉了（经过验证了 确信）其他引用的图片啥的没有被试阿芳
                 * 
                 */
                //cc.loader.releaseAsset(prefab) //释放加载进内存的指定资源，比如这个例子的prefab


                /**
                 * 调用释放后，发现预制件的4个进内存的资源，只释放了一个，也就是一个预制件的json描述文件被释放掉了（经过验证了 确信），其他引用的图片啥的没有被释放，这个时候
                 * 即使场景还在使用这个渲染着这个prefab，也不会报错
                 */
                //cc.loader.release(prefab)


                //放心 该接口不会把内置资源释放，只会释放当前预制件所依赖的资源包括自身

                newNode.destroy();
                cc.loader.release(allRefRes)

                // cc.loader.loadRes('1', cc.Prefab, (err, prefab) => {
                //     let newNode: cc.Node = cc.instantiate(prefab);
                //     this.node.addChild(newNode);
                // })


                /**
                 * 释放了所有资源，连当前的场景资源也被干掉了 恐怖 该接口只适用于全部释放 所以才没有报错（因为场景也被干掉了）
                 */
                //cc.loader.releaseAll()


                /**
                 * 下面这个方法真正的做到了将1预制件所依赖的资源全部释放，注意内置材质啥的不会被释放
                 * 注意如果其他地方引用了的 也会被释放，就会导致渲染黑色的 或者报错
                 */

                // newNode.destroy() //将节点销毁并不能释放资源
                // let deps = cc.loader.getDependsRecursively(prefab)
                // cc.loader.release(deps)

                //即使节点被影藏 or 节点被销毁，事件没有移除注册的话依旧能被监听触发
                // newNode.active = false;
                // this.scheduleOnce(() => {
                //     cc.systemEvent.emit("test");

                // },2)



            }, 3)

        })

    }



    // protected onDestroy(): void {
    //     cc.warn('des')
    // }

    keyListener(e) {
        switch (e.keyCode) {
            case cc.macro.KEY.l:
                this.__Load()
                break;
            case cc.macro.KEY.w:
                //this.dump();

                break;
            case cc.macro.KEY.r:
                //Loader.getInstance().releases()
                break;
            case cc.macro.KEY.p:
                //this.onFitlerClick()
                break;
        }
    }



    __Load() {



        // cc.loader.loadRes("8001", cc.Prefab, (err, prefab) => {
        //     const arr = cc.loader.getDependsRecursively(prefab);
        //     //cc.loader.release(arr)


        //     cc.warn("prefab依赖的资源", arr)
        // })

        // cc.loader.loadRes("audioSuce", cc.Prefab, function (err, data) {
        //     if (err) {
        //         cc.error("Failed to load AudioClip:", err);
        //         return;
        //     }
        //     cc.warn("--->动态加载succ")


        //     const arr = cc.loader.getDependsRecursively(data);
        //     cc.loader.release(arr)

        //     // cc.warn("prefab依赖的资源", arr)

        //     this.scheduleOnce(() => {
        //         cc.warn("释放成功")
        //         //cc.loader.releaseAsset()
        //         cc.loader.release(data)
        //     }, 5)

    }



    /**
     * 获取Texture2d纹理的内存占用大小
     * @param texture_2d 
     * @returns 
     */
    getTexture2DMomery(texture_2d: cc.Texture2D) {
        let getOpenGLESTextureWH = function (value) {
            if (value <= 2) {
                value = 2;
            } else if (value <= 4) {
                value = 4;
            } else if (value <= 8) {
                value = 8;
            } else if (value <= 16) {
                value = 16;
            } else if (value <= 64) {
                value = 64;
            } else if (value <= 128) {
                value = 128;
            } else if (value <= 256) {
                value = 256;
            } else if (value <= 512) {
                value = 512;
            } else if (value <= 1024) {
                value = 1024;
            } else if (value <= 2048) {
                value = 2048;
            } else if (value <= 4096) {
                value = 4096;
            } else if (value <= 8192) {
                value = 8192;
            }
            return value;
        }

        let value = 1;
        switch ((texture_2d as any)._format) {
            case cc.Texture2D.PixelFormat.RGBA8888:
                {
                    value = 4; //每个像素占用4字节
                }
                break;

            case cc.Texture2D.PixelFormat.RGB888:
                {
                    value = 3;
                }
                break;

            case cc.Texture2D.PixelFormat.RGBA4444:
                {
                    value = 2;
                }
                break;

            case cc.Texture2D.PixelFormat.RGBA_PVRTC_4BPPV1:
                {
                    value = 0.5;
                }
                break;

            case cc.Texture2D.PixelFormat.RGBA_ETC2:
                {
                    value = 1;
                }
                break;

            default:
                {
                    cc.warn(`unknow pixel format: ${(texture_2d as any)._format}`);
                }
                break;
        }

        const dpi = cc.view.getDevicePixelRatio(); //dpi其实应该取真实设备的dpi

        const perPixelBit = value;
        let width = texture_2d.width;
        let height = texture_2d.height;
        const realwidth = getOpenGLESTextureWH(width);
        const realheight = getOpenGLESTextureWH(height);//OpenGL 会将宽高2次幂
        let textureMemory = (realwidth * realheight * perPixelBit * dpi / (1024 * 1024));//返回的是mb

        return textureMemory;
    }

    strSize(str, charset?) {
        let total = 0;
        charset = charset ? charset.toLowerCase() : '';
        for (let i = 0; i < str.length; i++) {
            let charCode = str.charCodeAt(i);
            if (charset === 'utf-16' || charset === 'utf16') {
                total += charCode <= 0xffff ? 2 : 4;
            } else {
                if (charCode <= 0x007f) {
                    total += 1;
                } else if (charCode <= 0x07ff) {
                    total += 2;
                } else if (charCode <= 0xffff) {
                    total += 3;
                } else {
                    total += 4;
                }
            }
        }

        return total / (1024 * 1024);
    }

    /**
     * 获取cc.loader.cache缓存中的资源
     */
    getRuntimeCacheAssetType() {
        const cache = cc.loader['_cache'];
        let current_assets_infos = {};
        let count = 0;
        let continue_count1 = 0;
        let continue_count2 = 0;
        let continue_count3 = 0;
        let continue_count4 = 0;
        for (const key in cache) {
            const item = cache[key];
            if (!item.complete) {
                continue;
            }

            let content = item.content;

            if (!content) {
                if (!current_assets_infos[item.id]) {
                    current_assets_infos[item.id] = 0;
                }

                current_assets_infos[item.id]++;
                continue_count1++;
                continue;
            }

            if (item.type == "uuid") {
                // cc.warn("uuid类型被忽略了")
            }

            if (item.type == 'png' || item.type == 'jpg' || item.type == 'mp3') {
                current_assets_infos[item.type] = current_assets_infos[item.type] || {};
                current_assets_infos[item.type][item.id] = item;
                continue_count2++;
                continue;
            }

            if (typeof content === 'string') {
                current_assets_infos['js'] = current_assets_infos['js'] || {};
                current_assets_infos['js'][item.id] = item;
                continue_count3++;
                continue;
            }

            if (Array.isArray(content)) {
                current_assets_infos['scene'] = current_assets_infos['scene'] || {};
                current_assets_infos['scene'][item.id] = item;
                continue_count4++;
                continue;
            }

            let c_name = content.__proto__.__classname__;

            current_assets_infos[c_name] = current_assets_infos[c_name] || {};
            current_assets_infos[c_name][item.id] = item;

            count++;
        }

        const memoryInfo =
            `\n===>普通类型：${count}` +
            `\n===>png/jpg/mp3类型：${continue_count2}` +
            `\n===>string类型：${continue_count3}` +
            `\n===>scene：${continue_count4}` +
            `\n------------------------------` +
            `\n===>合计：${count + continue_count1 + continue_count2 + continue_count3 + continue_count4}` +
            `\n===>缓存资源数量：${Object.keys(cache).length}`


        cc.warn(memoryInfo)
        this.getMemory(current_assets_infos);
    }


    getMemory(current_assets_infos) {

        cc.warn("===>cc.loader缓存", current_assets_infos)
        let result = this.formatInfo(current_assets_infos);

        cc.warn("===>筛选缓存资源类型", result)
        if (Object.keys(result).length <= 0) {
            return;
        }

        let memory = 0;

        let memory_info: any[] = {} as any;
        for (let type in result) {
            let infos = result[type];
            switch (type) {
                case 'cc.AnimationClip':
                    {
                        // TODO cc.AnimationClip is a json?
                        for (let uuid in infos) {
                            let AnimationClip: cc.AnimationClip = infos[uuid];


                            //AnimationClip如果包含Comps组件的画，会序列化失败，因为在JS中并不是所有的东西都能被stringify的

                            // const filterComps = (obj) => {
                            //     if (obj && typeof obj === 'object') {
                            //         const result = {};
                            //         for (const key in obj) {
                            //             if (key !== 'comps') {
                            //                 result[key] = filterComps(obj[key]);
                            //             }
                            //         }
                            //         return result;
                            //     }
                            //     return obj;
                            // }

                            // AnimationClip.curveData = filterComps(AnimationClip.curveData);



                            let clip_json = JSON.stringify(AnimationClip);
                            let text = JSON.stringify(clip_json);
                            let _memory = this.strSize(text)
                            memory += _memory;
                            memory_info[uuid] = { assets_type: type, width: 0, height: 0, memory: `${_memory * 1024}kb` };
                        }
                    }
                    break;
                case 'AudioBuffer':
                    {
                        // TODO 和 mp3有关  AudioBuffer
                        for (let uuid in infos) {
                            let AudioBuffer: AudioBuffer = infos[uuid];

                            // 该方式不正确
                            // const sampleRate = AudioBuffer.sampleRate; // 采样率
                            // const duration = AudioBuffer.duration; // 音频时长，单位为秒
                            // const numberOfChannels = AudioBuffer.numberOfChannels; // 通道数
                            // const bitDepth = 32 //假设每个采样点的位深度，使用 32 位浮点数表示   32/8 刚好4个字节
                            // const sampleMus = AudioBuffer.length;//采样点数量
                            // const memoryInBytes = sampleMus * sampleRate * duration * numberOfChannels * (bitDepth / 8);
                            // let _memory = memoryInBytes / (1024 * 1024);

                            // 对于AudioBuffer的内存计算也只是估算，因为我们游戏内存占用大头其实是纹理，因为WebAPI并没有提供准确的计算AudioBuffer内存大小的方法，所以如果你能提供
                            //音频文件的采样率、通道数、位深度，那就能估算的更准确，不过由于音频的释放并没有纹理要求的那么苛刻，所以可以采用估算的方法

                            let _memory = AudioBuffer.length / (1024 * 1024);
                            memory += _memory;
                            memory_info[uuid] = { assets_type: type, width: 0, height: 0, memory: `${_memory * 1024}kb` };
                        }
                    }
                    break;
                case 'cc.Texture2D':
                    {
                        for (let uuid in infos) {
                            let texture_2d: cc.Texture2D = infos[uuid];
                            let textureMemory = this.getTexture2DMomery(texture_2d);
                            memory += textureMemory;
                            memory_info[uuid] = { assets_type: type, width: texture_2d.width, height: texture_2d.height, memory: `${textureMemory * 1024}kb` };
                        }
                    }
                    break;
                case 'json':
                    {
                        for (let uuid in infos) {
                            let JsonAsset: cc.JsonAsset = infos[uuid];
                            let json = JsonAsset.json;
                            let text = JSON.stringify(json);
                            let _memory = this.strSize(text)
                            memory += _memory;
                            memory_info[uuid] = { assets_type: type, width: 0, height: 0, memory: `${_memory * 1024}kb` };
                        }
                    }
                    break;
                case 'cc.TextAsset':
                    {
                        for (let uuid in infos) {
                            let textasset: cc.TextAsset = infos[uuid];
                            let text = textasset.text;
                            let _memory = this.strSize(text);
                            memory += _memory;
                            memory_info[uuid] = { assets_type: type, width: 0, height: 0, memory: `${_memory * 1024}kb` };
                        }
                    }
                    break;

                case 'cc.TTFFont':
                    //不需要计算内存
                    break;

            }
        }

        let memory_str = memory.toFixed(2);


        cc.warn("===>各资源内存", memory_info)
        cc.warn(`===>当前总内存：${memory_str}MB`);



    }


    formatInfo(current_assets_infos) {
        let result = {};
        for (let type in current_assets_infos) {
            let infos = current_assets_infos[type];
            switch (type) {
                case 'cc.AnimationClip':
                    {

                        for (let key in infos) {
                            let AnimationClip: cc.AnimationClip = infos[key].content;
                            let uuid = (AnimationClip as any)._uuid;
                            if (!uuid || uuid.length <= 0) {
                                continue;
                            }
                            result['cc.AnimationClip'] = result['cc.AnimationClip'] || {};
                            result['cc.AnimationClip'][uuid] = infos[key].content;
                        }
                    }
                    break;
                case 'cc.AudioClip':
                    {
                        // TODO 和 mp3有关  AudioBuffer
                        for (let key in infos) {
                            let AudioClip: cc.AudioClip = infos[key].content;
                            let AudioBuffer: AudioBuffer = (AudioClip as any)._audio;
                            let uuid = (AudioClip as any)._uuid;
                            if (!uuid || uuid.length <= 0) {
                                continue;
                            }
                            result['AudioBuffer'] = result['AudioBuffer'] || {};
                            result['AudioBuffer'][uuid] = AudioBuffer;
                        }
                    }
                    break;
                case 'cc.BitmapFont':
                    {
                        // 图片
                        for (let key in infos) {
                            let BitmapFont: cc.BitmapFont = infos[key].content;
                            let spriteFrame = (BitmapFont as any).spriteFrame;
                            let texture_2d: cc.Texture2D = (spriteFrame as any)._texture;
                            let uuid = (texture_2d as any)._uuid;
                            if (!uuid || uuid.length <= 0) {
                                continue;
                            }
                            result['cc.Texture2D'] = result['cc.Texture2D'] || {};
                            result['cc.Texture2D'][uuid] = texture_2d;
                        }

                        // 材质,字体等
                    }
                    break;
                case 'cc.EffectAsset':
                    {
                        // 不需要
                    }
                    break;
                case 'cc.JsonAsset': //json配置
                    {
                        for (let key in infos) {
                            let JsonAsset: cc.JsonAsset = infos[key].content;
                            let uuid = (JsonAsset as any)._uuid;
                            if (!uuid || uuid.length <= 0) {
                                continue;
                            }
                            result['json'] = result['json'] || {};
                            result['json'][uuid] = JsonAsset;
                        }
                    }
                    break;
                case 'cc.LabelAtlas':
                    {

                        // 图片
                        for (let key in infos) {
                            let LabelAtlas: cc.LabelAtlas = infos[key].content;
                            let spriteFrame = (LabelAtlas as any).spriteFrame;
                            let texture_2d: cc.Texture2D = (spriteFrame as any)._texture;
                            let uuid = (texture_2d as any)._uuid;
                            if (!uuid || uuid.length <= 0) {
                                continue;
                            }
                            result['cc.Texture2D'] = result['cc.Texture2D'] || {};
                            result['cc.Texture2D'][uuid] = texture_2d;
                        }

                        // 材质,字体等
                    }
                    break;
                case 'cc.Material':
                    {
                        // 不需要
                    }
                    break;
                case 'cc.Prefab':
                    {
                        // 不需要
                    }
                    break;
                case 'cc.SpriteAtlas':
                    {
                        for (let key in infos) {
                            let SpriteAtlas: cc.SpriteAtlas = infos[key].content;
                            let _spriteFrames = (SpriteAtlas as any)._spriteFrames;
                            for (let skey in _spriteFrames) {
                                let sprite_frame: cc.SpriteFrame = _spriteFrames[skey];
                                let texture_2d: cc.Texture2D = (sprite_frame as any)._texture;
                                let uuid = (texture_2d as any)._uuid;
                                if (!uuid || uuid.length <= 0) {
                                    continue;
                                }
                                result['cc.Texture2D'] = result['cc.Texture2D'] || {};
                                result['cc.Texture2D'][uuid] = texture_2d;
                            }
                        }
                    }
                    break;
                case 'cc.SpriteFrame':
                    {
                        for (let key in infos) {
                            let sprite_frame: cc.SpriteFrame = infos[key].content;
                            let texture_2d: cc.Texture2D = (sprite_frame as any)._texture;
                            let uuid = (texture_2d as any)._uuid;
                            if (!uuid || uuid.length <= 0) {
                                continue;
                            }
                            result['cc.Texture2D'] = result['cc.Texture2D'] || {};
                            result['cc.Texture2D'][uuid] = texture_2d;
                        }
                    }
                    break;
                case 'cc.TTFFont':
                    {
                        // TODO
                    }
                    break;
                case 'cc.TextAsset':
                    {
                        for (let key in infos) {
                            let textasset: cc.TextAsset = infos[key].content;
                            let uuid = (textasset as any)._uuid;
                            if (!uuid || uuid.length <= 0) {
                                continue;
                            }
                            result['cc.TextAsset'] = result['cc.TextAsset'] || {};
                            result['cc.TextAsset'][uuid] = textasset;
                        }
                    }
                    break;
                case 'cc.Texture2D':
                    {
                        for (let key in infos) {
                            let texture_2d: cc.Texture2D = infos[key].content;
                            let uuid = (texture_2d as any)._uuid;
                            if (!uuid || uuid.length <= 0) {
                                continue;
                            }
                            result['cc.Texture2D'] = result['cc.Texture2D'] || {};
                            result['cc.Texture2D'][uuid] = texture_2d;
                        }
                    }
                    break;
                case 'sp.SkeletonData':
                    {
                        //如果是龙骨动销的画，其实也是获取PNG的资源内存
                        for (let key in infos) {
                            let skeletondata: sp.SkeletonData = infos[key].content;
                            let textures: cc.Texture2D[] = skeletondata.textures;  //可能有多个TEX
                            for (let key in textures) {
                                let texture_2d: cc.Texture2D = textures[key];
                                let uuid = (texture_2d as any)._uuid;
                                if (!uuid || uuid.length <= 0) {
                                    continue;
                                }
                                result['cc.Texture2D'] = result['cc.Texture2D'] || {};
                                result['cc.Texture2D'][uuid] = texture_2d;
                            }
                        }

                        // 骨骼信息等TODO
                    }
                    break;
                case 'jpg':
                    {
                        // 不需要
                    }
                    break;
                case 'js':
                    {
                        // 不需要
                    }
                    break;
                case 'mp3':
                    {
                        for (let key in infos) {
                            let AudioClip: cc.AudioClip = infos[key]._owner;
                            let AudioBuffer: AudioBuffer = infos[key].content;
                            let uuid = (AudioClip as any)._uuid;
                            if (!uuid || uuid.length <= 0) {
                                continue;
                            }
                            result['AudioBuffer'] = result['AudioBuffer'] || {};
                            result['AudioBuffer'][uuid] = AudioBuffer;
                        }
                    }
                    break;
                case 'png':
                    {
                        // 不需要
                    }
                    break;
                case 'scene':
                    {
                        // 不需要
                    }
                    break;
                default:
                    {

                    }
                    break;
            }
        }

        return result;
    }


    getLevel(memory: number): number {
        let level = [1900, 1700, 1500];
        let result = -1;
        for (let i = 0; i < level.length; i++) {
            if (memory >= level[i]) {
                result = i + 1;
                break;
            }
        }

        return result;
    }










}
