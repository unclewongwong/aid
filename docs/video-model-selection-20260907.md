# 成片视频模型选择（0.1.206）

状态：2026-09-07 已构建并安装本机 Companion；未发布网站和公开安装包。

连续剧原来在提交设置和后台执行时强制覆盖为 ComfyUI H3，导致 Settings 中选择 API 仍发错通道。现在保留任务提交的通道和模型，在连续剧分集工具栏、顶部成片操作区，以及 Story 成片操作区提供项目独立的视频模型选择。Settings 继续提供凭据、连接配置和初始默认值。

选择按项目在浏览器持久化，不会改写其他项目和全局 Settings；连续剧的实际选择随加密任务配置保存，并在队列中以不含凭据的字段显示。隔离的 Story 后台页面只接受任务快照。API 模型与 ComfyUI 云卡明确区分，旧 Companion 无能力标记时阻止新版界面提交，避免静默覆盖。

暂停继续、失败重试、点击暂停剧集成片时携带当前选择，保留已提交任务号与已有视频；如需替换整个已生成版本，使用明确的一键重做。后台依据原任务号续查，避免仅因换模型而丢弃付费任务。

验证：49 项相关自动测试通过；隔离浏览器验证工具栏提交的请求、刷新恢复、旧 Companion 拦截、Story 与 Series/Settings 隔离，未调用真实生成供应商。Companion 生产构建及签名通过，安装前后 series、pipeline-drafts、series-drafts、video-exports 哈希一致。截图和回执在 out/verification/video-model-selection/。

本次独立构建工作树 /tmp/aid-video-model-selection（codex/video-model-selection），只包含本次模型路由与界面修改，不含同目录其他任务的修稿更改。回退包位于该目录 out/releases/v0.1.206/AID Companion-0.1.205-installed.app；安装前目录另保留于 /Applications/AID Companion-0.1.205-backup.app。当前源码版本同步为 0.1.206，公开版本仍 0.1.205。

侯府原任务 job-183c88b7-5bc6-4421-900a-7d2892b653c6 已按用户网页 Settings 中实际保存的 APIMart / seedance-2.0-mini 恢复。恢复后已进入四宫格生图，视频提交另看 outputs/houfu-video-rerun-20260907/ 回执；没有把排队或生图称为视频生成完成。

统一发布状态更新：上述通用源码修改已随完整0.1.207发布网站及三平台Companion，并已安装完整本机版本；早先未发布/临时包描述为历史阶段。最终验收见 [release-0.1.207.md](release-0.1.207.md)。
