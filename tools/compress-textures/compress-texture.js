const fs = require("fs");
const path = require("path");
const tinify = require("tinify");

tinify.key = "nK7SWqRjVtGjp1l8FSgz5R8Dpv7T6gQL";

// 支持的图片格式
const imageExts = [".png", ".jpg", ".jpeg"];

// 接收命令行传入的文件列表
const files = process.argv.slice(2);

if (files.length === 0) {
    console.log("没有传入需要压缩的图片文件");
    process.exit(0);
}

let count = 0;

function compressFile(filePath) {
    return new Promise((resolve, reject) => {
        const outputPath = filePath; // 覆盖原文件
        console.log("开始压缩:", filePath);

        tinify.fromFile(filePath).toFile(outputPath, (err) => {
            if (err) {
                console.error("压缩失败:", filePath, err.message);
                reject(err);
            } else {
                count++;
                resolve();
            }
        });
    });
}

async function compressAll(files) {
    for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (imageExts.includes(ext) && fs.existsSync(file)) {
            await compressFile(file);
        }
    }
    console.log(`压缩完成，总计压缩 ${count} 张图片`);
}

compressAll(files).catch(() => process.exit(1));
