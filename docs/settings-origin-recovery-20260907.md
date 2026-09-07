# 本机与网站 Settings 隔离导致模型默认值进入任务

2026-09-07：本机 Companion 0.1.207 已构建；安装与最终检查见回执。网站及公开安装包未发布此版本。

用户指出花少生图走 Seedream，而线上 Settings 选择 GPT-Image-2。核对加密任务快照：两集均为 seedream-5-0-pro / gpt-4o / Wan3.0；只读检查 Chrome 的 pandais.beauty appSettings，实际为 gpt-image-2 / gpt-5.6-luna / Seedance2Mini。浏览器 localStorage 按 origin 和浏览器档案隔离，网站、Chrome 本机页面与 Codex 内置浏览器不会自动共享配置。上一轮只核对/保留了视频模型，未核对生图与编剧设置，是本次操作遗漏。没有证据表明图片供应商把 GPT 请求自动降级成 Seedream。

两条花少任务在本轮检查时已暂停。已在锁内把生图与编剧恢复为用户线上设置，保留 Wan3.0、凭据、全部剧本、已生成图片与已提交任务号；未恢复队列、未重新购买图片。已提交的 Seedream 图不会因改配置自动变成 GPT 图，现有结果保留供后续重做决定。证据 out/verification/huashao-settings-recovery/corrected.json。

新增设置加载/已配置状态与校验。Series 提交、恢复、重试和重做，以及 Story 成片/手动生图生视频入口，在当前浏览器没有保存明确的生图和编剧模型时阻止以默认值开工并打开设置。空或损坏存储不能通过迁移被自动写成“已配置”；连续剧隔离 worker 仍使用已封存的任务设置。这是默认值误用保护，不是跨浏览器 Settings 自动同步。

验证：13 项相关单元/任务 API/运行器测试通过；隔离浏览器验证有效配置仍可提交，Series 与 Story 空设置均被拦截，没有付费请求。生产构建含类型检查通过。独立工作树 /tmp/aid-video-model-selection 仅包含模型选择和本次保护，不包含主目录其他任务的逐镜1K/补镜修复等未发布改动。

统一发布状态更新：上述通用源码修改已随完整0.1.207发布网站及三平台Companion，并已安装完整本机版本；早先未发布/临时包描述为历史阶段。最终验收见 [release-0.1.207.md](release-0.1.207.md)。
