
/**
 * v2.3 版本引擎 EmptyProject项目运行时缓存的内部资源
 * preview-scene.json
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

const { ccclass, property } = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {

    /**
     * 要进缓存的Json资源
     */
    @property(cc.JsonAsset)
    json3: cc.JsonAsset = null;



    /**
     * 要紧缓存的音效资源
     */
    @property({
        type: cc.AudioClip
    })
    audo: cc.AudioClip = null;


    /**
     * 倒计时刷新间隔
     */
    @property({ visible: false })
    __duration: number = 4;

    /**
     * 当前的时间
     */
    @property({ visible: false })
    __elapsed: number = 0;

    _is_regis_enent: boolean = false;

    /**
     * -1 默认
     * 1 战斗开始
     * 2 战斗未释放内存前
     * 3 战斗释放内存后
     * 4 巅峰战轮次战斗结束释放内存前
     * 5 巅峰战轮次战斗结束释放内存后
     * 6 巅峰战下轮战斗开始
     */
    _memory_tag: number = -1;



    beforeMemory;

    afterMemory;


    dump() {

        this.getRuntimeCacheAssetType();

    }





    onLoad() {
        this._is_regis_enent = false;

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.keyListener, this);

        // this.beforeMemory = cc.sys.os === cc.sys.OS_ANDROID ? jsb.Profiler.getNativeAllocatedMemory() : performance.memory.usedJSHeapSize;

        //cc.warn("---->loadBeforeMemoryUsage", this.beforeMemory)

    }

    keyListener(e) {
        switch (e.keyCode) {
            case cc.macro.KEY.l:
                this.__Load()
                break;
            case cc.macro.KEY.w:
                this.dump();

                break;
        }
    }



    __Load() {



        cc.loader.loadRes("audioSuce", cc.Prefab, function (err, data) {
            if (err) {
                cc.error("Failed to load AudioClip:", err);
                return;
            }
            cc.warn("--->动态加载succ")


            const arr = cc.loader.getDependsRecursively(data);
            cc.loader.release(arr)

            // cc.warn("prefab依赖的资源", arr)

            this.scheduleOnce(() => {
                cc.warn("释放成功")
                //cc.loader.releaseAsset()
                cc.loader.release(data)
            }, 5)




            // this.afterMemory = cc.sys.os === cc.sys.OS_ANDROID ? jsb.Profiler.getNativeAllocatedMemory() : performance.memory.usedJSHeapSize;
            // cc.warn("---->loadAfterMemoryUsage", this.afterMemory)
            // const memoryUsage = this.afterMemory - this.beforeMemory;
            // cc.warn("Memory Usage:", memoryUsage);
        }.bind(this));//bind一下this

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
