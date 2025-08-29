@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: 获取当前分支名
for /f "delims=" %%i in ('git rev-parse --abbrev-ref HEAD') do set branch=%%i

:: 获取改动文件列表
set count=0
echo 检测到以下文件有改动：
for /f "tokens=*" %%i in ('git status --short') do (
    set /a count+=1
    set "file!count!=%%i"
    echo !count!. %%i
)

:: 如果没有改动文件，退出
if !count! EQU 0 (
    echo 没有需要提交的文件，退出。
    timeout /t 2 >nul
    exit /b
)

:: 用户选择文件
echo.
echo 请输入要提交的文件序号（如：1 2 3，回车默认全部，或输入 all 全选）:
set /p select=选择:

:: 判断输入
if "%select%"=="" (
    set add_cmd=.
) else if /i "%select%"=="all" (
    set add_cmd=.
) else (
    set add_cmd=
    for %%n in (%select%) do (
        set "line=!file%%n!"
        for /f "tokens=2*" %%a in ("!line!") do (
            if "!add_cmd!"=="" (
                set add_cmd="%%b"
            ) else (
                set add_cmd=!add_cmd! "%%b"
            )
        )
    )
)

:: 输入提交日志
echo.
set /p message=请输入提交日志（如：提交版本内容）:

:: 拼接提交信息
set commit_msg=fix:[%branch%] %message%

:: 拉取最新代码
git pull

:: 添加选中的文件
git add !add_cmd!

:: 检查是否有暂存文件
git diff --cached --quiet && (
    echo 未选择任何文件或没有暂存内容，退出。
    timeout /t 2 >nul
    exit /b
)

:: 提交并推送
git commit -m "%commit_msg%" --no-verify
git push

echo 提交完成！
timeout /t 2 >nul
exit
