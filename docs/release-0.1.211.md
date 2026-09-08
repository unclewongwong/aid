# AID 0.1.211

媒体存储迁移至 Cloudflare R2：图片、音色和视频使用专用素材域名，网站与 Companion 通过短时签名直接上传。保留已有 Cloudinary 链接兼容；新上传原图不再套用 Cloudinary 的 10 MB 限制。四/九格保存为实际图片文件，保留原裁边比例和 1600 像素长边上限。

网站与 Companion 配套更新，新增 r2MediaStorage 能力。旧客户端会提示更新后继续补存已有任务，不自动重新生成。云端 ComfyUI 无需更新。

R2 真实验证18项通过：原图字节与13 MB原图、签名PUT/CORS/禁止覆盖、四/九格、WAV和MP4；隔离浏览器的图片、canvas与音视频通过。发布回归29组578项通过，Netlify与Companion构建通过。

2026-09-08 已发布：业务提交9b05f69、Netlify跨平台Sharp构建修正6b1aee7；正式部署6a9fee64cf0241b56d36fad4。正式网站上传、签名直传、四格与旧客户端426提示通过；图生视频/Series/Story页面11/13/17个脚本与构建一致。本机0.1.211通过正式网站获取签名并上传R2，原图字节一致，安装期间项目/草稿/视频数据哈希不变。旧完整0.1.210应用备份位于out/releases/v0.1.211/。

GitHub Actions34218272355三个平台与release成功；companion-v0.1.211的Apple Silicon、Intel、Windows安装包均已发布，下载HEAD200。安装包不含R2凭据，临时本地验证凭据已移除。

队列状态在安装后发生了新变化：原准备任务已完成，原重做任务因DMXAPI读取既有图片返回401而失败，项目目前暂停。保留最新状态，未用升级前的快照强行恢复或重提交。历史Cloudinary文件未批量迁移，失效旧链接不能仅靠更换域名修复。

完整回执：out/releases/v0.1.211/release-verification.json。
