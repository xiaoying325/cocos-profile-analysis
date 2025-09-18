export default class loader {
    private static _instance: loader = null;
    public static get instance(): loader {
        if (this._instance == null) {
            this._instance = new loader();
        }
        return this._instance;
    }
}