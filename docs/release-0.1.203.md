# AID 0.1.203

连续剧在进入制作前自动检查台词时长。统一编剧与 H3 的对白计时，修复旧稿遗漏超时检查的问题。无法在15秒内说完的普通台词仅做局部压缩，保留说话人、镜头数与剧情动作；候选通过时长校验及独立原意复核后才保存。复核失败有限重试并保留原稿，已有任务、视频及交付物不自动覆盖。

同时将此前网站已上线的 Wan 3.0、Story Fish 音色查询和参考素材传递修复同步至 Companion。网站要求制作执行器提供 `seriesDialogueTimingRepair` 能力，避免继续用旧版执行器。

- [台词超时处理及边界](series-dialogue-timing-repair.md)
- [Wan 3.0 与 Story 音色参考](wan3-and-story-voice-references.md)

此前相关回归243项与最终受影响9项、生产构建通过。发布现场验证记录保存在 `out/releases/v0.1.203/`。跨平台下载由 `companion-v0.1.203` 标签触发构建。

## 网站与本机安装验收

- 业务提交`3d9c062854967a860782c4a41c3872dde2122cfd`，标签`companion-v0.1.203`。
- Netlify生产部署`6a9ea312c3d4681d04a9a803`；正式域名Series页面12个脚本逐字节匹配构建，含新版能力门槛；相关接口缺参返回预期JSON400。
- 143项正式发布测试、网站/Companion构建及macOS签名验证通过。本机`/Applications/AID Companion.app`运行0.1.203，`seriesDialogueTimingRepair=true`，正式域名CORS通过。
- 更新时有一项运行、一项排队。确认图像任务号已落盘后，通过项目暂停接口保存断点；待两项均paused再关闭应用。系统退出请求未识别运行实例，确认两个任务已暂停后终止核验过的主程序及服务器进程。备份旧版至`out/releases/v0.1.203/AID Companion-0.1.202-installed.app`，完整复制新应用并验证签名。安装替换期间项目、草稿、视频导出文件全量哈希一致。
- 新版启动核验后恢复原项目队列，没有改动任务设置或清除上游任务号。恢复后原排队任务已进入编剧，原运行任务保留为等待恢复。
- 数据、部署与启动回执均位于`out/releases/v0.1.203/`。安装期间的数据一致性结论不包括随后恢复制作产生的正常更新。

## 跨平台发布完成

GitHub Actions `34117955407` 的 Apple Silicon、Intel、Windows 与 Release 全部success。`companion-v0.1.203` 已公开发布；latest三个平台下载链接均HEAD 200。最终回执 `out/releases/v0.1.203/release-verification.json`。
