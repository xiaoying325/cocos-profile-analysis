#!/usr/bin/env node
const { execSync } = require("child_process");
const path = require("path");

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
  execSync(`node tools/compress-textures/main.js ${imageFiles.join(" ")}`, { stdio: "inherit" });

  // 压缩完成后重新 add
  execSync(`git add ${imageFiles.join(" ")}`);
  console.log("🎉 压缩完成，文件已更新至暂存区");
} catch (err) {
  console.error("❌ 压缩失败，终止提交");
  process.exit(1);
}
