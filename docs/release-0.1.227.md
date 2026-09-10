# AID 0.1.227

MiniMax H3 多图生成使用首帧锚定 Hybrid：第一张图接入 `first_frame`，其余 1–4 张接入 `ref_images`。独立图生视频、Story 与连续剧共用该编译路径；非结构化提示词明确各图片职责，避免辅助图成为候选开场构图。

继续使用 DaSiWa Hybrid pruned、匹配四步 LoRA、强度 1、4 步、shift 12/3、dual_clock_euler/simple 与 SageAttention。云端 ComfyUI 节点、模型和权重无需更新；已有图片、视频、任务与项目不会自动重做。

网页与 Companion 同步发布，并增加 `h3HybridMultiReference` 能力及 v0.1.227 最低版本检查。

正式发布已完成：应用提交 `1b89006421ec642c7e5a0a84478b8b8f74eae1f3`，标签 `v0.1.227` / `companion-v0.1.227`；Netlify 正式部署 `6aa2e209ab2cd8bb708d0f67`；GitHub Actions `34505373646` 的 Apple Silicon、Intel、Windows x64 与 release job 全部成功，三份公开安装包均可下载。

本机 `/Applications/AID Companion.app` 已更新到 0.1.227，运行状态返回 `h3HybridMultiReference=true` 与 `h3DasiwaHybridPruned4=true`。本地构建和已安装应用的 2479 个文件完全一致，安装前后 Series、草稿与导出数据内容哈希一致。31 组共 655 项检查、TypeScript、网站构建、Companion 构建与打包通过；正式页面脚本与本地发布构建逐字节一致。本次没有触发付费生成、自动视觉质检或云端模型/权重更新。完整回执见 `out/releases/v0.1.227/release-verification.json`。
