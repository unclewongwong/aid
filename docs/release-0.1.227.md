# AID 0.1.227

MiniMax H3 多图生成使用首帧锚定 Hybrid：第一张图接入 `first_frame`，其余 1–4 张接入 `ref_images`。独立图生视频、Story 与连续剧共用该编译路径；非结构化提示词明确各图片职责，避免辅助图成为候选开场构图。

继续使用 DaSiWa Hybrid pruned、匹配四步 LoRA、强度 1、4 步、shift 12/3、dual_clock_euler/simple 与 SageAttention。云端 ComfyUI 节点、模型和权重无需更新；已有图片、视频、任务与项目不会自动重做。

网页与 Companion 同步发布，并增加 `h3HybridMultiReference` 能力及 v0.1.227 最低版本检查。正式部署、三平台安装包、本机安装和最终回执在发布完成后补记。
