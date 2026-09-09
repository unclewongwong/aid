# AID 0.1.223

加强Story和连续剧视频对分镜原图的保留：保持人物脸部、衣饰、道具结构材质、光线色温和场景布局；允许剧本规定的动作、表情、口型、运镜与状态变化。复杂导演稿和逐字台词保留，已有导演稿在提交时同样补齐保真要求，覆盖API、ComfyUI与fal。

不增加图像识别、视觉质检或自动重生，不更改独立图生视频入口、H3采样及导出节奏。具体实现及验证见docs/story-image-fidelity.md；发布回执out/releases/v0.1.223。

2026-09-09正式发布：应用ea6c057，Netlify6aa0bd03b91cc4340eed2901，Actions34301090958三平台及release成功、三包HEAD200。31组649项检查通过，网站四页面脚本匹配；正式/本机提示词接口复用已有导演稿实际返回原图保真规则，无模型调用。完整本机223已安装、43文件匹配，四类持久数据hash一致；旧222备份out/releases/v0.1.223/AID Companion-0.1.222-installed.app。回执release-verification.json。
