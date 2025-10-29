

const { ccclass, property } = cc._decorator;

@ccclass
export default class res extends cc.Component {

    start() {

        cc.assetManager.loadAny('configs/gifconf', { __requestType__: "path", type: null, bundle: 'resources', __outputAsArray__: Array.isArray("configs/gifconf") }, (err, asset) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log(asset);
        })

    }

    // update (dt) {}
}
