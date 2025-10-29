
import SVGAProto from './svga-proto';
import pako = require("./libs/svga-pako");
import Base64 = require('./libs/svga-base64')

const Uint8ToString = function (u8a) {
    var CHUNK_SZ = 0x8000;
    var c = [];
    for (var i = 0; i < u8a.length; i += CHUNK_SZ) {
        c.push(String.fromCharCode.apply(null, u8a.subarray(i, i + CHUNK_SZ)));
    }
    return c.join("");
}

export default class SVGAMockWorker {
    private static _instance: SVGAMockWorker = null;

    public static getInstance() {
        if (!this._instance) {
            this._instance = new SVGAMockWorker();
        }
        return this._instance;
    }

    loadAssets(arraybuffer: Uint8Array, cb: Function, failure: Function) {
        try {
            if (typeof globalThis !== 'undefined' && typeof globalThis.JSZipUtils === "object" && typeof globalThis.JSZip === "function") {
                globalThis.JSZipUtils.getBinaryContent(arraybuffer, function (err, data) {
                    if (err) {
                        failure && failure(err);
                        console.error(err);
                        throw err;
                    }
                    else {
                        const dataHeader = new Uint8Array(data, 0, 4)
                        if (dataHeader[0] == 80 && dataHeader[1] == 75 && dataHeader[2] == 3 && dataHeader[3] == 4) {
                            globalThis.JSZip.loadAsync(data).then(function (zip) {
                                this._decodeAssets(zip, cb);
                            });
                        }
                        else {
                            this._loadViaProto(data, cb, failure);
                        }
                    }
                });
            }
            else {
                this._loadViaProto(arraybuffer, cb, failure);
            }
        } catch (e) {
            console.error("SVGA功能中的globalThis为空 ", e);
        }
    }

    private _loadViaProto(arraybuffer, cb, failure) {
        try {
            const inflatedData = pako.inflate(arraybuffer);
            const movieData = SVGAProto.getInstance().getProtoMovieEntity().decode(inflatedData);
            let images = {};
            this._loadImages(images, movieData, function () {
                movieData.ver = "2.0";
                cb({
                    movie: movieData,
                    images,
                })
            })
        } catch (err) {
            // Do not log to console or throw, if failure() exists
            if (failure) {
                failure(err);
                return;
            }
            console.error(err);
            throw err;
        }
    }

    private _loadImages(images, movieData, imagesLoadedBlock) {
        if (typeof movieData === "object" && movieData.$type == SVGAProto.getInstance().getProtoMovieEntity()) {
            var finished = true;
            for (const key in movieData.images) {
                if (movieData.images.hasOwnProperty(key)) {
                    const element = movieData.images[key];
                    let value;
                    try {
                        value = Uint8ToString(element);
                    } catch (e) {
                        // fix windows xp chrome 下首次执行 String.fromCharCode.apply报错问题
                        value = Uint8ToString(element);
                    }
                    images[key] = Base64.btoa(value);
                }
            }
            finished && imagesLoadedBlock.call(this)
        }
    }

    private _base64ToArrayBuffer(base64) {
        var binary_string = Base64.atob(base64);
        var len = binary_string.length;
        var bytes = new Uint8Array(len);
        for (var i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes.buffer;
    }

    private _readBlobAsArrayBuffer(blob, callback) {
        var reader = new FileReader();
        reader.onload = function (e) { callback(e.target.result); };
        reader.readAsArrayBuffer(blob);
    }
}