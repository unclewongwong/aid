# AID 0.1.209

- 保留详细 H3 创作提示词。ComfyUI H3 单图、多参考、首尾帧、接续与 Director 统一使用 DaSiWa Hybrid 8Turbo、8 步，不叠加四步加速 LoRA；旧配置在新提交时自动迁移。
- Story、连续剧及角色设计可选电影胶片、iPhone 拍摄、综艺节目、CG动画（国漫）、3D Q版卡通、纪录片、商业广告。风格进入实际图片生成请求，保留人物身份、剧本动作和场景时间。
- Story 风格立即保存并联动拍摄方式；连续剧无需上传参考图也可保存风格，归档旧视觉素材并保留剧本、声音和历史成片。
- 压缩重复的图片身份和风格说明，避免旧四宫格请求因新增说明超出容量；不精简 H3 视频创作提示词。

APIMart/fal H3 API 入口保留，仍使用供应商模型，不标称为 8Turbo。Seedance、Wan 等其他模型保持原路由。未新增画面质检或自动重生成。

验证：上一阶段 120 项功能回归及隔离浏览器验证通过；发布前完整 27 组、563 项测试通过。网站、Companion、云端兼容补丁与三平台安装包的最终发布结果记录在 `out/releases/v0.1.209/`，构建中不能视为发布完成。


运行版核验：发布提交 `974bc013f9b15db70f318210150b4faa07baaa25`，标签 `v0.1.209` / `companion-v0.1.209`。Netlify 部署 `6a9f6b50fdcb39d1d085a8e6` 已上线，正式域名 Series 14 个、Story 18 个、角色设计 11 个脚本与本地构建逐字节一致。线上隔离浏览器验证风格选择、联动、保存和刷新通过，API 使用模拟项目，不修改真实生产数据。

本机 `/Applications/AID Companion.app` 已安装并运行 0.1.209，新能力与正式域名 CORS 正常。234 个运行文件与打包文件哈希相同；安装期间四类项目、草稿与视频数据哈希不变。旧完整 0.1.208 备份于 `out/releases/v0.1.209/AID Companion-0.1.208-installed.app`。

云端队列空闲时已安装 Director 4/8 步兼容补丁并重启 ComfyUI；T8、Director、8Turbo 权重接口可见，重启成功。补丁 SHA256 为 `8ba66a7d94585e2d109cb40a27251a42ef3864c2e0e32710f1710bc10cd396ba`，原文件备份 `/root/ComfyUI/user/aid-releases/v0.1.209/core_sampling.before.py`。未升级其他节点、未重做已有视频。

三平台公开发布完成：GitHub Actions `34178305592` 的 Mac Apple Silicon、Mac Intel、Windows x64 与 release job 全部成功。公开版本 `companion-v0.1.209`；最终下载检查与发布回执见 `out/releases/v0.1.209/`。
