namespace lzw {
    /**
     * 实现lzw 解码算法
     * @param code 
     * @param buffer 
     * @returns 
     */
    export function decode(arr: number[], min: number): number[] {
        let clearCode = 1 << min;
        let eofCode = clearCode + 1;
        let size = min + 1;
        let dict: number[][] = [];
        let pos = 0;

        function clear() {
            dict = [];
            size = min + 1;
            for (let i = 0; i < clearCode; i++) {
                dict[i] = [i];
            }
            dict[clearCode] = [];
            dict[eofCode] = null;
        }

        function read(size: number) {
            let code = 0;
            for (let i = 0; i < size; i++) {
                if (arr[pos >> 3] & (1 << (pos & 7))) {
                    code |= 1 << i;
                }
                pos++;
            }
            return code;
        }

        function decode() {
            let out: number[] = [];
            let code: number | undefined;
            let last: number | undefined;
            while (true) {
                last = code;
                code = read(size);
                if (code === clearCode) {
                    clear();
                    continue;
                }
                if (code === eofCode) {
                    break;
                }
                if (code < dict.length) {
                    if (last !== clearCode) {
                        dict.push(dict[last!].concat(dict[code!][0]));
                    }
                } else {
                    if (code !== dict.length) {
                        throw new Error('LZW解析出错');
                    }
                    dict.push(dict[last!].concat(dict[last!][0]));
                }
                out.push(...dict[code!]);
                if (dict.length === (1 << size) && size < 12) {
                    size++;
                }
            }
            return out;
        }

        return decode();
    }

    export function deinterlace(pixels: number[], width: number) {
        const newPixels: number[] = [];
        newPixels.length = pixels.length;

        const rows = pixels.length / width;
        const offsets = [0, 4, 2, 1];
        const steps = [8, 8, 4, 2];

        let fromRow = 0;
        for (let pass = 0; pass < 4; pass++) {
            for (let toRow = offsets[pass]; toRow < rows; toRow += steps[pass]) {
                newPixels.splice(
                    toRow * width,
                    0,
                    ...pixels.slice(fromRow * width, (fromRow + 1) * width)
                );
                fromRow++;
            }
        }

        return newPixels;
    }
}

export default lzw;