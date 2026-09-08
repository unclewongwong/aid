# API 多图参考与连续剧切换视频模型

日期：2026-09-08。状态：源码完成，尚未发布；生产版本仍为 0.1.209。

## 图生视频

独立图生视频页面按所选模型提供多图参考或首尾帧入口。数量包含第一张图片：Seedance Mini、MiniMax H3、HappyHorse 最多 9 张，Wan3 最多 10 张，Grok Imagine 最多 7 张，Veo3.1 Fast 最多 3 张，Omni Flash Ext 接受 1 或 3 张。其他模型保留各自首帧/首尾帧模式。ComfyUI 仍沿用原工作流及 5 张参考图限制。

上传顺序原样传递；切换模型或模式不会截断图片。超限或当前模式不使用的素材需明确移除，页面会显示原因。API 图片通过已有上传器先上传，再提交 URL 数组，避免多张 base64 图片使网站请求体过大。后端在改写提示词和提交供应商前再次验证数量。

单张 HappyHorse 参考图使用参考接口字段；Seedance 首尾帧使用明确角色；Veo/Omni 传递图片用途；Veo3.1 固定 8 秒。音色与参考视频的现有传递保留。

“开始生成视频”禁用时显示具体原因，包括缺少图片/提示词、图片模式冲突和旧任务待查询。旧任务待查询时提供就近的“继续查询已有任务”入口，不重复提交生成请求。用户截图仅展示按钮，无法据此确认其浏览器的具体阻塞状态。

## 连续剧

点击“制作选中 N 集”时显式比较所选模型与各集上次生产模型。模型变化后创建新视频版本，复用已定稿剧本、分镜图片、角色及音色，归档旧视频状态并保留旧成片；同模型重复点击不重复创建任务。运行中的冲突任务需先暂停并保存断点。

新版本生产 ID 避免恢复旧视频缓存；旧暂停/失败任务标为已被替代，不能再次重试覆盖新版本。旧记录优先从原任务封存设置恢复模型；缺失模型但已有视频的旧集在明确选择后重做一次，再记录模型，后续点击不重复重做。

该功能由 Companion 执行，新增 `seriesVideoModelRerun` 能力标记。网站与 Companion 必须配套更新；独立图生视频 API 多图入口本身无需更新 Companion。无需更新云端 ComfyUI。

## 验证与证据

- 发布工作流的 28 组测试、共 571 项通过，生产构建通过。
- API 路由测试覆盖完整数组、字段语义及提交前拒绝超限。
- 连续剧路由及 runner 测试覆盖选择范围、保存旧交付、重复点击、运行冲突、旧任务防恢复及复用定稿剧本/图片。
- 隔离浏览器使用模拟上传和生成接口验证页面交互，不产生付费生成或修改真实项目。记录位于 `out/verification/api-multi-reference/`。

模型规则核验于 2026-09-08，来源为 APIMart 官方文档：

- [Seedance 2.0](https://docs.apimart.ai/cn/api-reference/videos/seedance-2-0/generation)
- [Wan3.0](https://docs.apimart.ai/cn/api-reference/videos/wan3.0-video/generation)
- [MiniMax H3](https://docs.apimart.ai/cn/api-reference/videos/minimax-h3/generation)
- [HappyHorse](https://docs.apimart.ai/cn/api-reference/videos/happyhorse-1.0/generation)
- [Grok Imagine](https://docs.apimart.ai/cn/api-reference/videos/grok-imagine/generation)
- [Omni Flash Ext](https://docs.apimart.ai/cn/api-reference/videos/omni-flash-ext/generation)
- [Veo3](https://docs.apimart.ai/cn/api-reference/videos/veo3/generation)
- [Wan2.7](https://docs.apimart.ai/cn/api-reference/videos/wan2.7/generation)
