
export class Loader  {

    static singleInstance: Loader = null;
    static getInstance(): Loader {
        if (Loader.singleInstance == null) {
            Loader.singleInstance = new Loader();
        }
        return Loader.singleInstance;
    }


    cache: cc.Asset[] = [];

    releaser: cc.RawAsset[] = [];

    // LIFE-CYCLE CALLBACKS:
    load(url: string, assetType: typeof cc.Asset, assetName: string, component: cc.Component | cc.SpriteAtlas | cc.Node, componentAssetType?: typeof cc.Component | cc.Asset | sp.SkeletonData | any, callback?: Function): void {
        let asset = this.cache[url];
        (cc as any).m.view.addLockReleaseCount();
        if (asset == null || !asset.isValid || !(asset instanceof assetType)) {
            cc.loader.loadRes(url, assetType, function (error, asset) {
                (cc as any).m.view.subLockReleaseCount();
                if (!error) {
                    // cc.log(asset);
                    this.cache[url] = asset;
                    this.complete(asset, assetName, component, componentAssetType, callback);
                }
            }.bind(this));
        } else {
            (cc as any).m.view.subLockReleaseCount();
            this.complete(asset, assetName, component, componentAssetType, callback);
        }
    }

    private complete(asset: cc.Asset, assetName: string, component: cc.Component | cc.SpriteAtlas | cc.Node, componentType?: typeof cc.Component | cc.Asset | sp.SkeletonData | any, callback?: Function): void {
        if (component && component.isValid) {
            if (asset instanceof cc.SpriteAtlas) {
                for (let key in asset['_spriteFrames']) {
                    let item = asset['_spriteFrames'][key];
                    let filename = item['_textureFilename'];
                    this.releaser[filename] = filename;
                    break;
                }
                let atlas: cc.SpriteAtlas = asset;
                if (componentType === cc.RichText) {
                    (component as cc.RichText).imageAtlas = atlas;
                } else {
                    let spriteFrame = atlas.getSpriteFrame(assetName);
                    (component as cc.Sprite).spriteFrame = spriteFrame;
                }
            } else if (asset instanceof sp.SkeletonData) {
                for (let key in asset['textures']) {
                    let texture: cc.Texture2D = asset['textures'][key] as cc.Texture2D;
                    this.releaser[texture.url] = texture.url;
                }
                (component as sp.Skeleton).skeletonData = asset;
            } else if (asset instanceof cc.SpriteFrame) {
                let filename = asset['_textureFilename'];
                this.releaser[filename] = filename;
                if (componentType === sp.Skeleton) {
                    let skeleton: sp.Skeleton = component as sp.Skeleton;
                    let slot = skeleton.findSlot(assetName)
                    let frame = (asset as cc.SpriteFrame);

                    let attachment = slot.getAttachment()
                    let texture = frame.getTexture()
                    texture.setPremultiplyAlpha(true);

                    let tex = new (sp as any).SkeletonTexture({ width: texture.width, height: texture.height })
                    tex.setRealTexture(texture)
                    attachment.region.texture = tex

                    slot.setAttachment(attachment)
                } else {
                    (component as cc.Sprite).spriteFrame = (asset as cc.SpriteFrame);
                }
            }

            if (callback) {
                callback(component, asset);
            }
        }
    }

    memory() {
        function getOpenGLESTextureWH(value) {
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

        let memoryDescription = "文件名\t图片尺寸\t图片像素内存大小\t渲染纹理尺寸\t渲染纹理内存大小\t参考DPI\n";

        let dpi = 2;
        let bitsPerPixel = 4;
        for (let key in (cc.loader as any)._cache) {
            let item = (cc.loader as any)._cache[key];
            if (item._owner && item._owner instanceof cc.Texture2D) {
                let width = item._owner.width;
                let height = item._owner.height;
                let pictureMemory = (width * height * bitsPerPixel * dpi / (1024 * 1024)).toFixed(2);
                let owidth = getOpenGLESTextureWH(width);
                let oheight = getOpenGLESTextureWH(height);
                let textureMemory = (owidth * oheight * bitsPerPixel * dpi / (1024 * 1024)).toFixed(2);
                let itemDescription = key + "\t" + (height + "x" + width) + "\t" + pictureMemory + "\t" + (oheight + "x" + owidth) + "\t" + textureMemory + "\t" + 240 + "\n";
                memoryDescription += itemDescription;

                if (null != item._owner._texture) {
                    item._owner._texture.destroy();
                    item._owner._texture.loaded = false;
                    item._owner._texture = null;
                }
            }

            if (cc.sys.isNative) {
                if (item._ownerProp == "_textureSetter") {
                    var width = item._owner._texture.width;
                    var height = item._owner._texture.height;
                    var pictureMemory = (width * height * bitsPerPixel * dpi / 1048576).toFixed(2);
                    var owidth = getOpenGLESTextureWH(width);
                    var oheight = getOpenGLESTextureWH(height);
                    var textureMemory = (owidth * oheight * bitsPerPixel * dpi / 1048576).toFixed(2);
                    var itemDescription = key + "\t" + height + "x" + width + "\t" + pictureMemory + "\t" + oheight + "x" + owidth + "\t" + textureMemory + "\t240\n";
                    memoryDescription += itemDescription;
                }
            }



        }
        cc.log(memoryDescription);
        return memoryDescription;
    }

    releases() {
        // // cc.log('释放前:', (<any>cc).m.utils.count((cc.loader as any)._cache));
        // // cc.loader.releaseResDir('effect');
        // // cc.loader.releaseResDir('sprite');
        // let cache = (cc.loader as any)._cache;
        // for (let key in cache) {
        //     let asset: cc.Asset = cache[key];
        //     // cc.log(asset);
        //     let deps = cc.loader.getDependsRecursively((<any>asset)._owner);
        //     if (!deps || deps.length == 0) {
        //         cc.log(asset.url);
        //         cc.loader.release(asset);
        //     }
        // }
        // // cc.log('释放后:', (<any>cc).m.utils.count((cc.loader as any)._cache));

        //if ((cc as any).m.releases && (cc as any).m.isIos) {
        this.releaseByCanvas();
        //}
        // let assets: cc.RawAsset[] = [];
        // let groups = (cc as any).m.view.groups;
        // for (let gkey in groups) {
        //     let group = groups[gkey];
        //     for (let key in group) {
        //         let c = group[key];
        //         // cc.log(c.__cclass_name);
        //         this.parser(c.node, assets);
        //     }
        // }

        // for (let key in this.releaser) {
        //     let asset = assets[key];
        //     if (!asset) {
        //         // cc.loader.release(asset);
        //         cc.loader.release(key);
        //         // cc.log('release', key);
        //     }
        // }
    }

    parser(node: cc.Node, assets: cc.RawAsset[]) {
        if (!node || !node.isValid) {
            return;
        }
        // cc.log('begin', node.name);
        assets = assets || this.releaser;
        if ((node as any)._components) {
            let sprite = node.getComponent(cc.Sprite);
            if (sprite && sprite.spriteFrame) {
                let url = sprite.spriteFrame['_textureFilename'];
                assets[url] = url;
                // cc.log(node.name, url);
            }
        } else {
            cc.log('_components', node.name);
        }

        let children = node.children;
        if (children) {
            children.forEach((child) => {
                this.parser(child, assets);
            });
        } else {
            cc.log('children', node.name);
        }
        // cc.log('end', node.name);
    }


    // 资源加载到内存不会进行引用计数管理
    loadRes(url: string, type: typeof cc.Asset, callback): void {
        if (!url || !type || !callback) {
            cc.log("参数错误");
            return;
        }

        cc.loader.loadRes(url, type, (err, asset) => {
            if (err) {
                cc.log(`[资源加载] 错误 ${err}`);
                return;
            }
            callback(asset);
        });
    }

    loadResArr(paths: Array<string>, callfun: Function) {
        cc.loader.loadResArray(paths, function (err, assets) {
            if (err) {
                cc.log(err);
                return;
            }
            callfun(assets);
        }.bind(this));
    }


    loadStaticRes(url: string, type: typeof cc.Asset, tag: string, callback) {
        if (!url || !type || !callback) {
            cc.log("参数错误");
            return;
        }
        cc.loader.loadRes(url, type, (err, asset) => {
            callback(asset);
            this._parseStaticRes(asset, tag);
        });
    }

    loadStaticResArr(paths: Array<string>, tag: string, callfun: Function) {
        if (!paths || !tag || !callfun) {
            cc.log("参数错误");
            return;
        }

        cc.loader.loadResArray(paths, function (err, assets) {
            if (err) {
                cc.log(err);
                return;
            }
            callfun(assets);
            assets.forEach((asset) => {
                this._parseStaticRes(asset, tag);
            });
        }.bind(this));
    }



    loadAudioClip(path: string, callfun) {
        cc.loader.loadRes(path, cc.AudioClip, (err, audioclip) => {
            if (err) {
                cc.log(err);
                return;
            }
            callfun(audioclip);
        });
    }

    loadSpriteFrame(path: string, callfun: Function, retainRes: boolean = false) {
        cc.loader.loadRes(path, cc.SpriteFrame, (err, spriteFrame) => {
            if (err) {
                cc.log(err);
                return;
            }
            if (retainRes) {
                this.retatinRes(spriteFrame._textureFilename);
            }
            callfun(spriteFrame);
        });
    }


    loadSpriteFrames(paths: Array<string>, callfun: Function, retainRes: boolean = false) {
        cc.loader.loadResArray(paths, cc.SpriteFrame, function (err, spriteFrames) {
            if (err) {
                cc.log(err);
                return;
            }
            if (retainRes) {
                spriteFrames.forEach((spriteFrame) => {
                    this.retatinRes(spriteFrame._textureFilename);
                });

            }
            callfun(spriteFrames);
        }.bind(this));
    }


    releaseMusicRes(res: string): void {
        this.releaseRes(res);
        this.gc();
    }



    releaseStaticRes(tag: string): void {
        var texturesInCache = cc.loader["_cache"];
        var release_key = [];
        for (var asset in texturesInCache) {
            if (tag && texturesInCache[asset].uTag !== tag) {
                continue;
            }

            if (texturesInCache[asset].bk_count > 0 && texturesInCache[asset].uStatic) {
                // 移除 Static 标识, 
                texturesInCache[asset].uStatic == null;
                delete texturesInCache[asset].uStatic;
                continue;
            }

            if (texturesInCache[asset].bk_count <= 0) {
                release_key.push(texturesInCache[asset].url);
                cc.log(`释放资源:${texturesInCache[asset].url}`);
                cc.loader.release(texturesInCache[asset].url);
            }
        }

        if (release_key.length > 0) {
            this._depthGC(release_key);
        }
    }




    getCacheCount() {
        return Object.keys(cc.loader["_cache"]).length;
    }



    retatinRes(res: string) {
        if (!cc.loader["_cache"][res]) {
            return;
        }

        if (!cc.loader["_cache"][res].bk_count) {
            cc.loader["_cache"][res].bk_count = 0;
        }
        cc.loader["_cache"][res].bk_count += 1;
    }

    retainArrayRes(res: string[]) {
        res.forEach((item) => {
            this.retatinRes(item);
        });
    }

    retainNodeRes(node: cc.Node) {
        this._parserNodeRes(node, 1);
    }

    releaseNodeRes(node: cc.Node) {
        this._parserNodeRes(node, -1);
    }

    releaseRes(res: string) {
        if (!cc.loader["_cache"][res]) {
            return;
        }

        if (!cc.loader["_cache"][res].bk_count) {
            cc.loader["_cache"][res].bk_count = 0;
        }
        cc.loader["_cache"][res].bk_count -= 1;
    }

    releaseArrayRes(res: string[]) {
        res.forEach((item) => {
            this.releaseRes(item);
        });
    }




    gc() {
        var texturesInCache = cc.loader["_cache"];
        var release_key = [];
        for (var asset in texturesInCache) {
            if (texturesInCache[asset].uStatic) {
                continue;
            }
            if (texturesInCache[asset].bk_count <= 0) {
                release_key.push(texturesInCache[asset].url);
                cc.log(`释放资源:${texturesInCache[asset].url}`);
                cc.loader.release(texturesInCache[asset].url);
            }
        }

        if (release_key.length > 0) {
            this._depthGC(release_key);
        }
    }


    updateSpriteTexture(target: cc.Node, spriteFrame: cc.SpriteFrame) {
        if (!target || !spriteFrame || !target.getComponent(cc.Sprite)) {
            return;
        }
        let sprite = target.getComponent(cc.Sprite);
        this._replaceTagetTexture(sprite, "spriteFrame", spriteFrame);
        this.gc();
    }

    updateButtonTexture(target: cc.Node, normalSprite?: cc.SpriteFrame, pressedSprite?: cc.SpriteFrame, hoverSprite?: cc.SpriteFrame, disabledSprite?: cc.SpriteFrame) {
        if (!target || !normalSprite) {
            cc.log("参数错误")
            return;
        }

        if (!target.getComponent(cc.Button)) {
            cc.log("目标节点没有Button组件");
            return;
        }

        let button = target.getComponent(cc.Button);
        if (normalSprite) {
            this._replaceTagetTexture(button, "normalSprite", normalSprite);
        }

        if (pressedSprite) {
            this._replaceTagetTexture(button, "pressedSprite", pressedSprite);
        }

        if (hoverSprite) {
            this._replaceTagetTexture(button, "hoverSprite", hoverSprite);
        }

        if (disabledSprite) {
            this._replaceTagetTexture(button, "disabledSprite", disabledSprite);
        }
        this.gc();
    }

    _depthGC(strs: Array<string>) {
        var texturesInCache = cc.loader["_cache"];
        var release_json = [];
        for (var asset in texturesInCache) {
            if (texturesInCache[asset].dependKeys && texturesInCache[asset].dependKeys.length > 0) {
                var is_release = false;
                for (var i = 0; i < texturesInCache[asset].dependKeys.length; i++) {
                    if (strs.indexOf(texturesInCache[asset].dependKeys[i]) !== -1) {
                        is_release = true;
                    }
                }
                if (is_release /*&& texturesInCache[asset].bk_count <= 0*/) {
                    release_json.push(texturesInCache[asset].url);
                    cc.log(`释放资源:${texturesInCache[asset].url}`);
                    cc.loader.release(texturesInCache[asset].url);
                }
            }
        }

        if (release_json.length > 0) {
            this._depthGC(release_json);
        }
    }


    _parseStaticRes(item: typeof cc.Asset, tag: string) {
        if (item instanceof cc.Texture2D) {
            cc.loader["_cache"][item.url].uStatic = true;
            cc.loader["_cache"][item.url].uTag = tag;
        } else if (item instanceof cc.SpriteFrame) {
            cc.loader["_cache"][item["_textureFilename"]].uStatic = true;
            cc.loader["_cache"][item["_textureFilename"]].uTag = tag;
        } else if (item instanceof cc.Prefab) {
            this._parseStaticPrefab(item, tag);
        } else if (item instanceof cc.BitmapFont) {
            cc.loader["_cache"][item["spriteFrame"]._textureFilename].uStatic = true;
            cc.loader["_cache"][item["spriteFrame"]._textureFilename].uTag = tag;
        } else if (item instanceof cc.SpriteAtlas) {
            var keys = Object.keys(item["_spriteFrames"])
            keys.forEach((key) => {
                cc.loader["_cache"][item["_spriteFrames"][key]._textureFilename].uStatic = true;
                cc.loader["_cache"][item["_spriteFrames"][key]._textureFilename].uTag = tag;
            });
        } else if (item instanceof cc.AnimationClip) {
            cc.log('AnimationClip 资源加载未做处理');
        } else if (item instanceof Object && item["name"]) {
            cc.log('Object 资源加载未做处理');
        }
    }

    _parseStaticPrefab(node, tag: string) {
        var prefab = node;
        if (node.data) {
            prefab = node.data;
        }

        if (!(prefab instanceof cc.Scene)) {
            this._parseStaticNode(prefab, tag);
        }
        let children = prefab._children;
        children.forEach((child) => {
            this._parseStaticNode(child, tag);
            this._parseStaticPrefab(child, tag);
        });
    }

    _retatinStaticRes(res: string, tag: string) {
        if (!cc.loader["_cache"][res]) {
            return;
        }

        if (!cc.loader["_cache"][res].bk_count) {
            cc.loader["_cache"][res].bk_count = 0;
        }
        cc.loader["_cache"][res].uStatic = true;
        cc.loader["_cache"][res].uTag = tag;
    }

    _parseStaticNode(node: cc.Node, tag: string) {
        // sprite 组件
        let sprite = node.getComponent(cc.Sprite);
        if (sprite && sprite.spriteFrame) {
            this._retatinStaticRes(sprite.spriteFrame["_textureFilename"], tag);
        }

        // button 组件
        let button = node.getComponent(cc.Button);
        if (button && button.normalSprite) {
            this._retatinStaticRes(button.normalSprite["_textureFilename"], tag);
        }
        if (button && button.pressedSprite) {
            this._retatinStaticRes(button.pressedSprite["_textureFilename"], tag);
        }
        if (button && button.hoverSprite) {
            this._retatinStaticRes(button.hoverSprite["_textureFilename"], tag);
        }
        if (button && button.disabledSprite) {
            this._retatinStaticRes(button.disabledSprite["_textureFilename"], tag);
        }

        // label 组件
        let label = node.getComponent(cc.Label);
        if (label && label.font && label.font instanceof cc.BitmapFont && label.font["spriteFrame"]) {
            this._retatinStaticRes(label.font["spriteFrame"]._textureFilename, tag);
        }

        // richText 组件
        let richText = node.getComponent(cc.RichText);
        if (richText && richText.imageAtlas) {
            let keys = Object.keys(richText.imageAtlas["_spriteFrames"]);
            if (keys.length > 0) {
                this._retatinStaticRes(richText.imageAtlas["_spriteFrames"][keys[0]]._textureFilename, tag);
            }
        }

        // particleSystem 组件
        let particleSystem = node.getComponent(cc.ParticleSystem);
        if (particleSystem && particleSystem["_texture"]) {
            this._retatinStaticRes(particleSystem["_texture"], tag);
        }

        // pageViewIndicator 组件
        let pageViewIndicator = node.getComponent(cc.PageViewIndicator);
        if (pageViewIndicator && pageViewIndicator.spriteFrame) {
            this._retatinStaticRes(pageViewIndicator.spriteFrame["_textureFilename"], tag);
        }

        // editBox 组件
        let editBox = node.getComponent(cc.EditBox);
        if (editBox && editBox.backgroundImage) {
            this._retatinStaticRes(editBox.backgroundImage["_textureFilename"], tag);
        }

        // Mask
        let mask = node.getComponent(cc.Mask);
        if (mask && mask.spriteFrame) {
            this._retatinStaticRes(mask.spriteFrame["_textureFilename"], tag);
        }
    }



    _replaceTagetTexture(target: any, attrName: string, newNormalSprite: cc.SpriteFrame) {
        if (target[attrName] === newNormalSprite) {
            return;
        }
        if (target[attrName]) {
            this.releaseRes(target[attrName]._textureFilename);
        }
        this.retatinRes(newNormalSprite["_textureFilename"]);
        target[attrName] = newNormalSprite;
    }

    _parserNodeRes(node: cc.Node, number: number) {
        let children = node.children;
        this._parserNodeComponentRes(node, number);
        children.forEach((child) => {
            this._parserNodeRes(child, number);
        });
    }

    _parserNodeComponentRes(node: cc.Node, num: number) {
        this._parserComponentSprite(node, num);
        this._parserComponentButton(node, num);
        this._parserComponentLabel(node, num);
        this._parserComponentRichText(node, num);
        this._parserComponentParticleSystem(node, num);
        this._parserComponentPageViewIndicator(node, num);
        this._parserComponentEditBox(node, num);
        this._parserComponentMask(node, num);

        // TODO 释放其他组件附带的资源
    }

    _parserComponentSprite(node: cc.Node, num: number) {
        let sprite = node.getComponent(cc.Sprite);
        if (!sprite) {
            return;
        }
        if (num > 0) {
            this.retatinRes(sprite.spriteFrame["_textureFilename"]);
            return;
        }
        this.releaseRes(sprite.spriteFrame["_textureFilename"]);
    }

    _parserComponentButton(node: cc.Node, num: number) {
        let button = node.getComponent(cc.Button);
        if (!button) {
            return;
        }

        if (button.normalSprite) {
            if (num > 0) {
                this.retatinRes(button.normalSprite["_textureFilename"]);
            } else {
                this.releaseRes(button.normalSprite["_textureFilename"]);
            }
        }

        if (button.pressedSprite) {
            if (num > 0) {
                this.retatinRes(button.pressedSprite["_textureFilename"]);
            } else {
                this.releaseRes(button.pressedSprite["_textureFilename"]);
            }

        }

        if (button.hoverSprite) {
            if (num > 0) {
                this.retatinRes(button.hoverSprite["_textureFilename"]);
            } else {
                this.releaseRes(button.hoverSprite["_textureFilename"]);
            }
        }

        if (button.disabledSprite) {
            if (num > 0) {
                this.retatinRes(button.disabledSprite["_textureFilename"]);
            } else {
                this.releaseRes(button.disabledSprite["_textureFilename"]);
            }
        }
    }

    _parserComponentLabel(node: cc.Node, num: number) {
        let label = node.getComponent(cc.Label);
        if (!label || !label.font || !(label.font instanceof cc.BitmapFont) || !label.font["spriteFrame"]) {
            return;
        }

        if (num > 0) {
            this.retatinRes(label.font["spriteFrame"]["_textureFilename"]);
            return;
        }
        this.releaseRes(label.font["spriteFrame"]["_textureFilename"]);
    }

    _parserComponentRichText(node: cc.Node, num: number) {
        let richText = node.getComponent(cc.RichText);
        if (!richText || !richText.imageAtlas) {
            return;
        }

        let keys = Object.keys(richText.imageAtlas["_spriteFrames"]);
        if (keys.length <= 0) {
            return;
        }

        if (num > 0) {
            this.retatinRes(richText.imageAtlas["_spriteFrames"][keys[0]]["_textureFilename"]);
            return;
        }
        this.releaseRes(richText.imageAtlas["_spriteFrames"][keys[0]]["_textureFilename"]);
    }

    _parserComponentParticleSystem(node: cc.Node, num: number) {
        let particleSystem = node.getComponent(cc.ParticleSystem);
        if (!particleSystem || !particleSystem["_texture"]) {
            return;
        }

        if (num > 0) {
            this.retatinRes(particleSystem["_texture"]);
            return;
        }
        this.releaseRes(particleSystem["_texture"]);
    }

    _parserComponentPageViewIndicator(node: cc.Node, num: number) {
        let pageViewIndicator = node.getComponent(cc.PageViewIndicator);
        if (!pageViewIndicator || !pageViewIndicator.spriteFrame) {
            return;
        }

        if (num > 0) {
            this.retatinRes(pageViewIndicator.spriteFrame["_textureFilename"]);
            return;
        }
        this.releaseRes(pageViewIndicator.spriteFrame["_textureFilename"]);
    }

    _parserComponentEditBox(node: cc.Node, num: number) {
        let editBox = node.getComponent(cc.EditBox);
        if (!editBox || !editBox.backgroundImage) {
            return;
        }

        if (num > 0) {
            this.retatinRes(editBox.backgroundImage["_textureFilename"]);
            return;
        }
        this.releaseRes(editBox.backgroundImage["_textureFilename"]);
    }

    _parserComponentMask(node: cc.Node, num: number) {
        let mask = node.getComponent(cc.Mask);
        if (!mask || !mask.spriteFrame) {
            return;
        }

        if (num > 0) {
            this.retatinRes(mask.spriteFrame["_textureFilename"]);
            return;
        }
        this.releaseRes(mask.spriteFrame["_textureFilename"]);

    }

    // onLoad () {}

    start() {

    }

    // update (dt) {}

    getSpriteFrameAssets(spriteFrame: cc.SpriteFrame, urls: string[]) {
        if (spriteFrame) {
            let deps = cc.loader.getDependsRecursively(spriteFrame);
            let pngUrl = spriteFrame["_textureFilename"];
            if (pngUrl) {
                deps.push(pngUrl);
            }
            Array.prototype.push.apply(urls, deps);
        }
    }

    getSkeletonDataAssets(skeletonData: sp.SkeletonData, urls: string[]) {
        if (skeletonData) {
            let deps = cc.loader.getDependsRecursively(skeletonData);
            Array.prototype.push.apply(urls, deps);
        }
    }

    getResAssets(res: cc.Asset, urls: string[]) {
        if (res) {
            if (res instanceof cc.SpriteFrame) {
                this.getSpriteFrameAssets(res, urls);
            } else if (res instanceof sp.SkeletonData) {
                this.getSkeletonDataAssets(res, urls);
            }
        }
    }

    getSpriteAssets(sprite: cc.Sprite, urls: string[]) {
        if (sprite) {
            this.getSpriteFrameAssets(sprite.spriteFrame, urls);
        }
    }

    getComponentAssets(component: cc.Component, urls: string[]) {
        if (component instanceof sp.Skeleton) {
            let skeleton: sp.Skeleton = component as sp.Skeleton;
            if (skeleton.skeletonData) {
                let deps = cc.loader.getDependsRecursively(skeleton.skeletonData);
                Array.prototype.push.apply(urls, deps);
            }
            return true;
        } else if (component instanceof cc.Sprite) {
            this.getSpriteAssets(component as cc.Sprite, urls);
            return true;
        } else if (component instanceof cc.Button) {
            let button: cc.Button = component as cc.Button;
            // cc.log(button, (button as any)._N$normalSprite)
            this.getSpriteFrameAssets((button as any)._N$normalSprite, urls);
            this.getSpriteFrameAssets((button as any)._N$pressedSprite, urls);
            this.getSpriteFrameAssets((button as any)._N$hoverSprite, urls);
            this.getSpriteFrameAssets((button as any)._N$disabledSprite, urls);
            return true;
        } else if (component instanceof cc.SpriteFrame) {
            this.getSpriteFrameAssets(component as cc.SpriteFrame, urls);
            return true;
        } else if (component instanceof cc.SpriteAtlas) {
            let deps = cc.loader.getDependsRecursively(component);
            Array.prototype.push.apply(urls, deps);
            return true;
        } else if (component instanceof cc.Prefab) {
            let deps = cc.loader.getDependsRecursively(component);
            Array.prototype.push.apply(urls, deps);
            return true;
        } else if (component instanceof cc.Animation) {
            let deps = cc.loader.getDependsRecursively(component);
            Array.prototype.push.apply(urls, deps);
            return true;
        }
        return false;
    }

    getInfoAssets(component: cc.Component, urls: string[]) {
        for (const key in component) {
            try {
                if (component[key] instanceof Array) {
                    for (const comkey in component[key]) {
                        this.getComponentAssets(component[key][comkey] as cc.Component, urls);
                    }
                } else {
                    this.getComponentAssets(component[key] as cc.Component, urls);
                }
            } catch (error) {
                // cc.log(error);
            }
        }
    }


    getComponentsAssets(components: cc.Component[], urls: string[]) {
        if (components) {
            components.forEach((component: cc.Component) => {
                if (!this.getComponentAssets(component, urls)) {
                    this.getInfoAssets(component, urls);
                }
            });
        }
    }

    getNodeComponentsAssets(node: cc.Node, urls: string[]) {
        let components: cc.Component[] = (node as any)._components;
        this.getComponentsAssets(components, urls);
    }

    getNodeAssets(node: cc.Node, urls: string[]) {
        // cc.log(node.name, node.active, node.isValid, node.children, (node as any)._components);
        if ((node as any).__prefab) {
            let deps = cc.loader.getDependsRecursively((node as any).__prefab);
            Array.prototype.push.apply(urls, deps);
        }

        this.getNodeComponentsAssets(node, urls);
        if (node && node.children && node.childrenCount > 0) {
            node.children.forEach((child: cc.Node, index: number, array: cc.Node[]) => {
                this.getNodeAssets(child, urls);
            })
        }
    }

    getCacheAssets(cache, urls: string[]) {
        for (let key in cache) {
            let asset = cache[key];
            if (asset.content instanceof cc.Prefab) {
                let deps = cc.loader.getDependsRecursively(asset.content);
                Array.prototype.push.apply(urls, deps);
                // cc.log("Prefab=====================>>>")
            }

            if (asset.content instanceof cc.SpriteAtlas) {
                let deps = cc.loader.getDependsRecursively(asset.content);
                Array.prototype.push.apply(urls, deps);
                // cc.log("SpriteAtlas=====================>>>", asset)
            }

            if (asset.content instanceof cc.AudioClip) {
                let deps = cc.loader.getDependsRecursively(asset.content);
                Array.prototype.push.apply(urls, deps);
                // cc.log("AudioClip=====================>>>")
            }

            if (asset instanceof cc.Prefab) {
                let deps = cc.loader.getDependsRecursively(asset);
                Array.prototype.push.apply(urls, deps);
                // cc.log("Prefab2=====================>>>")
            }

            if (asset instanceof cc.SpriteAtlas) {
                let deps = cc.loader.getDependsRecursively(asset);
                Array.prototype.push.apply(urls, deps);
                // cc.log("SpriteAtlas2=====================>>>")
            }

            if (asset instanceof cc.AudioClip) {
                let deps = cc.loader.getDependsRecursively(asset);
                Array.prototype.push.apply(urls, deps);
                // cc.log("AudioClip2=====================>>>")
            }

        }
    }

    getViewsAssets(urls: string[]) {
        let views = (cc as any).m.view.views;
        for (let key in views) {
            let view = views[key];
            if (view.isValid && view.node && view.node.isValid) {
                let deps = cc.loader.getDependsRecursively(view.__prefab);
                Array.prototype.push.apply(urls, deps);
            }
        }
    }

    releasesByUrls(urls: string[]) {
        let refs: Map<string, string> = new Map<string, string>();
        urls.forEach((url: string) => {
            refs[url] = url;
        });

        let assets = [];

        let cache = (cc.loader as any)._cache;
        for (let key in cache) {
            let asset = cache[key];
            if (null == refs[key] && asset.complete) {
                assets.push(key);
            }
        }

        cc.log("_cache.length = ", Object.keys((<any>cc.loader)._cache).length);

        cc.loader.release(assets);
        cc.sys.garbageCollect();

        cc.log("_cache.length = ", Object.keys((<any>cc.loader)._cache).length);
    }

    releaseByCanvas() {
        // let urls: string[] = [];

        // // (cc as any).m.canvas.runAction(cc.sequence(cc.delayTime(1), cc.callFunc(() => {
        // this.getNodeAssets((cc as any).m.canvas, urls);
        // this.getCacheAssets((cc.loader as any)._cache, urls);
        // // this.getViewsAssets(urls);
        // this.releasesByUrls(urls);
        // // })))

        this.clean();
    }


    debugUrl = '';
    _whiteList = {};

    /**
     *
     * @param url 被保护的资源
     */
    set whiteList(urlList: string[]) {
        this._whiteList = {};
        for (let i = 0; i < urlList.length; i++) {
            const url = urlList[i];
            this._whiteList[url] = true;
        }
    }

    /**
     * 纹理的显存占用
     */
    getTexGPUMemory() {
        let textureMem = 0;

        const cache = cc.loader['_cache'];
        for (const key in cache) {
            const item = cache[key];
            const asset = item.content;
            if (asset && asset instanceof cc.Texture2D) {
                // 显存估计量
                const bytes = asset.getPixelFormat() == cc.Texture2D.PixelFormat.RGBA8888 ? 4 : 3;
                textureMem += (asset.width * asset.height * bytes);
            }
        }
        return textureMem / (1024 * 1024);
    }

    // copied from cocos engine. 略有改动
    parseDepends(key, parsed) {
        const item = cc.loader['getItem'](key);
        if (item) {
            const depends = item.dependKeys; //获取依赖
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

    visitAsset(asset, excludeMap) {
        // assets generated programmatically or by user (e.g. label texture)
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
        const key = cc.loader['_getReferenceKey'](asset);
        if (!excludeMap[key]) {
            excludeMap[key] = true;

            if (this.debugUrl === key) {
                cc.log('debug');
            }

            this.parseDepends(key, excludeMap); //解析资源的依赖
        }
    }

    visitComponent(comp, excludeMap) {
        cc.warn(`--------------->开始遍历component}`, comp)

        const props = Object.getOwnPropertyNames(comp);
        for (let i = 0; i < props.length; i++) {
            const value = comp[props[i]];
            if (value instanceof cc.Node) {
                continue;
            }

            if (typeof value === 'object' && value) {
                if (value instanceof cc.NodePool) { //如果是节点对象池
                    this.visitNodePool(value, excludeMap);
                } else if (Array.isArray(value)) {
                    for (let j = 0; j < value.length; j++) {
                        const val = value[j];
                        if (val instanceof cc.RawAsset) {
                            this.visitAsset(val, excludeMap);
                        }
                    }
                } else if (!value.constructor || value.constructor === Object) {
                    const keys = Object.getOwnPropertyNames(value);
                    for (let j = 0; j < keys.length; j++) {
                        const val = value[keys[j]];
                        if (val instanceof cc.RawAsset) {
                            this.visitAsset(val, excludeMap);
                        }
                    }
                } else if (value instanceof cc.RawAsset) {
                    this.visitAsset(value, excludeMap);
                }
            }
        }
    }

    visitNode(node, excludeMap) {

        cc.warn(`--------------->开始遍历场景中的node,名称为：${node.name}`)
        if (!node.isValid) {
            return;
        }

        for (let i = 0; i < node._components.length; i++) {
            this.visitComponent(node._components[i], excludeMap);
        }

        // for (let i = 0; i < node._children.length; i++) {
        //     cc.warn(`--------------->开始遍历场景中的node,名称为：${node.name}`)
        //     this.visitNode(node._children[i], excludeMap);
        // }
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

    visitNodePool(nodePool, excludeMap) {
        const pool = nodePool._pool as Array<cc.Node>;
        for (let j = 0; j < pool.length; j++) {
            const node = pool[j];
            this.visitNode(node, excludeMap);
        }
    }

    // 资源清理
    clean() {
        cc.log('--->assets release start');
        const start = Date.now();
        const excludeMap = cc.js.createMap(); //高效创建map
        const cache = cc.loader['_cache'];

        // 排除内置资源 引擎内置资源有19个
        const builtinDeps = cc['AssetLibrary'].getBuiltinDeps();

        //cc.warn(`内置资源个数：${Object.keys(builtinDeps).length}`)
        for (const key in builtinDeps) {
            excludeMap[key] = true; //内置资源是不释放的，即使不这么做，引擎也不会将内置资源进行释放的
        }

        cc.warn(`免释放，内置资源剔除完毕`, excludeMap)


        // 白名单 受我们保护的资源
        for (const url in this._whiteList) {
            const asset = cc.loader.getRes(url) as cc.RawAsset;
            if (asset) {
                this.visitAsset(asset, excludeMap);
            }
        }

        cc.warn(`免释放，白名单中的资源释放完毕`, excludeMap)



        // 排除场景中每个节点可能存在的引用资源
        const nodeList = cc.director.getScene().children;
        for (let i = 0; i < nodeList.length; i++) {
            this.visitNode(nodeList[i], excludeMap);
        }

        cc.warn(`免释放，场景可能引用的资源剔除完毕`, excludeMap)

        /*

        // 剔除加载中的资源
        const runningQueues = {};
        for (const key in cache) {
            const item = cache[key];
            const queue = cc.LoadingItems.getQueue(item);
            if (queue) {
                const queueId = queue['_id'];
                runningQueues[queueId] = queue;
            }
        }
        for (const queueId in runningQueues) {
            const queue: cc.LoadingItems = runningQueues[queueId];
            for (const url in queue.map) {
                const item = queue.map[url];
                this.visitItem(item, excludeMap);
            }
        }

        cc.warn(`免释放，正在加载中的资源剔除完毕`, excludeMap)

        */


        // 遍历资源缓存，逐个资源判断是否被场景引用，若未被场景上的节点引用则释放。
        let textureMem = 0;
        const releaseList = [];
        for (const key in cache) {
            const item = cache[key];

            if (!excludeMap[key]) {
                if (!item.complete) {
                    cc.log('item is no complete', item.id);
                    continue;
                }
                releaseList.push(key);

                const asset = item.content;
                if (asset && asset instanceof cc.Texture2D) {
                    textureMem += (asset.width * asset.height * 4); // 看看能释放多少显存，这只是一个预估的量
                }
            }
        }

        cc.warn(`要释放的资源清单：`, releaseList)
        for (let i = 0; i < releaseList.length; i++) {
            const key = releaseList[i];
            const item = cache[key];
            if (!item) {
                continue;
            }

            let name = '';
            if (item.content && item.content.name) {
                name = item.content.name;
            }
            // cc.log('资源释放', key)

            // cc.log(`资源释放, uuid : ${key}, name : ${name}`);
            cc.loader.release(key);
        }

        cc.sys.garbageCollect();

        const timeSpan = Date.now() - start;
        cc.log(`<-----资源释放结束。耗时：${timeSpan}ms, 释放资源数量：${releaseList.length}，释放显存：${textureMem / (1024 * 1024)}MB`);
    }
}
