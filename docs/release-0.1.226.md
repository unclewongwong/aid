# AID 0.1.226

Story和连续剧的H3视频在新生成前，将导演稿与当前实际分镜图对齐一次，明确人物位置、已完成动作阶段、手与道具的衔接及一致的摄影任务。同图已对齐就复用，图片改变才需重新细化。保留复杂中文提示词与逐字对白；删除与导演稿竞争的默认构图句，避免平视/俯拍同时出现。

网页与Companion同步，增加storyFrameAlignedDirection能力及226最低版本校验。继续使用Hybrid pruned+匹配四步LoRA；云卡不用更新，不重跑已有视频，也不添加生成后的视觉质检。详情见frame-aware-video-direction.md；回执out/releases/v0.1.226。

发布前接口验收发现：无图床环境变量的安装版未识别生产 R2 素材地址，可能跳过首帧对齐。现在明确支持生产公开素材域名，并验证无存储配置时的对齐与复用；仍拒绝仿冒域名及非 HTTPS 地址。225 未推广网页生产，最终使用226。

正式站：https://pandais.beauty；Netlify部署6aa0ffb3a06d42a097afcd7b（候选验证后原部署提升）。应用提交51f0f1172b0ee845daaf41d4b6b6dbddec933edf；本机已安装226，155个服务端JavaScript文件与发布包一致，四类持久数据内容未变。31组653项检查通过（受影响组复跑、无关组沿用225成功结果），额外生成入口1项通过；CI另在三平台完整执行检查。网页四页10/13/15/19个脚本与构建逐字节匹配；本机、草稿、正式接口均通过实际图标记复用/过期阻断/无默认机位冲突验收。发布回执在out/releases/v0.1.226。

GitHub Actions 34320210634的Windows x64、macOS Apple Silicon、macOS Intel及release任务全部成功；三个公开安装包HEAD均200，下载页：https://github.com/unclewongwong/aid/releases/tag/companion-v0.1.226。225中间发布已标记预发布并说明由226替代。回退：网站原部署6aa0ddcbec9b695446451f87；224完整安装包备份out/releases/v0.1.225/AID Companion-0.1.224-installed.app。回执release-verification.json。
