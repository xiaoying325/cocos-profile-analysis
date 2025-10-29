import { SVGAVideoEntity } from './svga-videoEntity'
import SVGAMockWorker from './svga-mockWorker'

export class SVGAParser {

    /**
     * arraybuffer: 资源data
     * success(VideoEntity videoItem)
     */
    public static load(arraybuffer: Uint8Array, success: Function, failure: Function) {
        SVGAMockWorker.getInstance().loadAssets(arraybuffer, (data) => {
            let movie = data.movie;
            movie["version"] = data.ver;
            let images = data.images;
            let videoItem = new SVGAVideoEntity(movie, images);
            success(videoItem);
        }, failure);
    }
}