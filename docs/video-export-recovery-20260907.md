# 已完成 API 视频缺任务编号时的导出恢复

状态：源码修复及回归通过，待随更新发布。用户要求先处理这次故障，发布暂缓。

侯府六镜使用 APIMart Seedance 2.0 mini 均已保存 Cloudinary 视频，镜头 5 为 completed 且有 videoUrl/videoSourceUrl/videoCacheKey，但缺 videoTaskId。缓存键仍包含原任务 `task_01M1Y4RC1W7RJGHWZ7Z05A70R4`。导出前原判断强制每镜必须有 taskId，因此将已保存视频误报为未完成。

修复：导出以 completed 状态与现有可用视频/缓存为准；缺任务编号不再阻止已完成媒体导出。缺视频时只从现有缓存、源 URL 或现有 ComfyUI 任务恢复，不提交生成。完成缓存的三条路径均保存已知 generationId，页面恢复也对 API 任务使用任务专属缓存键。

验证：六镜且第 5 镜缺编号、无编号但有持久源地址/缓存、仅任务编号或未完成状态不得导出，三个回归用例通过；本地真实 FFmpeg 导出恢复测试一并通过（共 4 项）。TypeScript 与 diff 检查通过。未做视频质量检查。

生产恢复观察：本任务准备执行补编号时，事务守卫发现任务已从 failed 变成 running，因此没有写入或重复重试；随后读取确认后台已恢复原编号并进入“合并并导出成片”。该恢复不是本任务事务执行的结果，不应重复购买或重复操作。成片完成状态另行记录。

## 后续合并卡住：尾帧时长与终态轮询（已恢复本次成片）

用户继续反馈长期显示“合并并导出成片”。原导出 export-b506d2d4fa71d3fc6c09f7eb 实际已 failed、progress86、attempts3，最后报合并结果时长不一致。

- 六个源 MP4 的音轨/容器分别是 11.104 或 15.104 秒，视频轨分别是 11.041667 或 15.041667 秒。变速转码后的尾帧与音轨被 `-shortest` 截短，各段不足250毫秒，原单段验证接受缓存；但累积导致合并仅80.645996秒，低于含结尾原速保护的预期约81.05秒，超过合并0.3秒容差。没有画面质检或评分。
- 服务端同时补齐变速视频尾帧和音轨至计划终点（tpad克隆最后一帧、apad到目标时长，-t仍限制总时长），并将转码缓存容差改为0.05秒，恢复时重新处理旧短缓存；保留原六段及原任务ID。
- 客户端 pollJob 在成功请求时将 transientFailures 清零，再抛出 failed，被同一个网络错误catch计数成1，每轮重复，最长空等90分钟。现在终态失败在网络重试catch外立即返回调用者；短暂网络失败仍可恢复。
- npm run test:local-export 共6项通过，含真实六段15秒音视频尾部不同步、旧短缓存自动恢复和终态轮询不空等。TypeScript、diff检查通过。
- 使用 `outputs/houfu-export-recovery-20260907/recover.mjs` 在原导出磁盘租约下运行新服务端源码，未重启Companion、未触碰其他任务。原网页轮询自动收到完成并正常写交付。23:02:27本机时间生产job-183c88b7-5bc6-4421-900a-7d2892b653c6为completed/已完成，episodeVersion7交付“侯府-第01集.mp4”，55,992,155字节、720×1280、81.07秒。
- 回执 export-before.json、export-result.json；本次恢复已生效，但网页与Companion的通用代码修复仍待发布。最终视频在 Companion video-exports 对应原job目录的final.mp4。
