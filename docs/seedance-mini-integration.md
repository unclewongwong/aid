# Seedance 2.0 Mini 接入

2026-09-07，本地实现，未发布；未调用付费生成。

来源：[APIMart 官方接口](https://docs.apimart.ai/cn/api-reference/videos/seedance-2-0/generation)，当日核对。

AID 的 Seedance 模型选择仅保留 `seedance-2.0-mini`，默认值同步切换。旧标准版、Fast、旧默认 1.5 Pro 的已保存设置在读取/保存时迁移；后端创建视频前也归一化，覆盖旧客户端请求。其他模型选择不变。现有任务仍按原 task ID 查询，不重新生成；连续剧原有 ComfyUI H3 固定通道不变。

通过现有 `/v1/videos/generations` 提交、`/v1/tasks/{id}` 查询。Mini 显式传 size、resolution、duration、generate_audio；4–15 整数秒，480p/720p，后端默认 720p，独立图生视频可选择两种分辨率。保留完整提示词、声音参考和音频开关。

提交前检查最多 9 张图片、3 个音频、3 个视频；首尾帧和参考音视频互斥，音频需要参考图片或视频。参考媒体实际时长/尺寸仍由供应商校验，本次没有加入媒体探测。独立图生视频选择尾帧并上传参考音视频时明确报错，不静默丢素材。

验证：`npm run test:seedance-mini` 8/8；video-segments、video-direction、fal-video、series-video-provider-change 共 72/72；`npm run build` 通过（包括类型检查）。测试拦截网络提交，验证模型迁移、payload、任务查询、非法组合不创建付费任务，不代表真实生成质量或账户可用性已验收。

未更新线上、运行中的 Companion 或安装包。

发布范围核对：APIMart 的独立图生视频与 Story 视频提交/查询均走网站同源 API，只有 ComfyUI 视频请求切换到 Companion。因此此次仅需部署网站前后端，无需更新 Companion 安装包。
