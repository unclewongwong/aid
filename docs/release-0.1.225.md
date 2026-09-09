# AID 0.1.225

Story和连续剧的H3视频在新生成前，将导演稿与当前实际分镜图对齐一次，明确人物位置、已完成动作阶段、手与道具的衔接及一致的摄影任务。同图已对齐就复用，图片改变才需重新细化。保留复杂中文提示词与逐字对白；删除与导演稿竞争的默认构图句，避免平视/俯拍同时出现。

网页与Companion同步，增加storyFrameAlignedDirection能力及225最低版本校验。继续使用Hybrid pruned+匹配四步LoRA；云卡不用更新，不重跑已有视频，也不添加生成后的视觉质检。详情见frame-aware-video-direction.md；回执out/releases/v0.1.225。
