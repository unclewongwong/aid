# H3 默认生产工作流：Hybrid pruned＋匹配四步 LoRA

用户比较《为自己》第1镜两条同输入样片后，确认四步观感更好，要求将其设为生产工作流。0.1.224以完整模型配对替代0.1.209–223的8Turbo生成默认。

- 底模：DasiwaMinimaxH3_dasiwaREF2VAHybridV1.safetensors。
- 专用适配器：minimax_h3_turbo_4step_dasiwa_ref2va_hybrid_v1_T8.safetensors，Bypass loader、强度1。
- 4步，video/audio shift 12/3，dual_clock_euler/simple。Director保留其Euler接口，由现有云端兼容补丁执行四步采样。
- 权重与适配器SHA256固定在lib/h3GenerationProfile.ts，2026-09-09 A/B时已实际核验匹配；不是早期官方FL2VA底模误配DaSiWa LoRA。

公共提交编译器覆盖独立图生视频、批量、Story、连续剧的单图/多图/首尾帧输入；Motion Context与Director引用同一生产配置。旧dasiwa8/balanced8/legacy设置归一为dasiwa4，旧无LoRA图补齐适配器，有旧LoRA图替换完整配对；不改参考图、音色、对白、复杂提示词、随机种子与其他输出参数。

页面显示Hybrid pruned四步；新增h3DasiwaHybridPruned4能力位及Companion224门槛，避免网页显示四步却交给旧八步运行版。旧h3Dasiwa8Turbo能力位置false。独立的历史V2V字幕编辑构建器仍保留8Turbo配置，不启用自动质检或额外重生。

本次A/B原件、history与回执位于outputs/weiziji-h3-ab-20260909。4步200.665秒，8Turbo320.475秒，均736×1280/24fps/11.541667秒，时间包含加载与缓存影响。用户的本次选择不等于四步对所有镜头均更优；本次切换不重跑已完成任务。

发布证据位于out/releases/v0.1.224。
