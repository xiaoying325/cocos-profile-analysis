#!/usr/bin/env node
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// 获取暂存区文件
const stagedFiles = execSync("git diff --cached --name-only", { encoding: "utf-8" })
  .split("\n")
  .filter(Boolean);

// 筛选图片
const imageFiles = stagedFiles.filter(file =>
  [".png", ".jpg", ".jpeg"].includes(path.extname(file).toLowerCase())
);

if (imageFiles.length === 0) {
  console.log("✅ 没有需要压缩的图片，直接提交");
  process.exit(0);
}

try {
  console.log("🔧 检测到图片文件，开始压缩...");

  // 执行压缩脚本
  execSync(`node tools/compress-textures/main.js ${imageFiles.map(f => `"${f}"`).join(" ")}`, {
    stdio: "inherit",
  });

  // 重新 add 压缩后的图片
  execSync(`git add ${imageFiles.join(" ")}`);

  // 同步 add 对应的 .meta 文件（如果存在）
  const metaFiles = imageFiles
    .map(f => `${f}.meta`)
    .filter(f => fs.existsSync(f));

  if (metaFiles.length > 0) {
    execSync(`git add ${metaFiles.join(" ")}`);
    console.log(`🪶 同步更新了 ${metaFiles.length} 个 meta 文件`);
  }

  console.log("🎉 压缩完成，文件及 meta 已更新至暂存区");
} catch (err) {
  console.error("❌ 压缩失败，终止提交");
  process.exit(1);
}
