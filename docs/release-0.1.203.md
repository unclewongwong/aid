# AID 0.1.203

连续剧在进入制作前自动检查台词时长。统一编剧与 H3 的对白计时，修复旧稿遗漏超时检查的问题。无法在15秒内说完的普通台词仅做局部压缩，保留说话人、镜头数与剧情动作；候选通过时长校验及独立原意复核后才保存。复核失败有限重试并保留原稿，已有任务、视频及交付物不自动覆盖。

同时将此前网站已上线的 Wan 3.0、Story Fish 音色查询和参考素材传递修复同步至 Companion。网站要求制作执行器提供 `seriesDialogueTimingRepair` 能力，避免继续用旧版执行器。

- [台词超时处理及边界](series-dialogue-timing-repair.md)
- [Wan 3.0 与 Story 音色参考](wan3-and-story-voice-references.md)

此前相关回归243项与最终受影响9项、生产构建通过。发布现场验证记录保存在 `out/releases/v0.1.203/`。跨平台下载由 `companion-v0.1.203` 标签触发构建。
