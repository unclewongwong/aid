# Wan 3.0 与 Story 音色参考

2026-09-07，网站前后端已发布至 https://pandais.beauty。业务提交 `4787120`；生产部署 `6a9e9ee3773814050befe58e`。

## 入口与行为

- 设置 → 视频模型：`wan3.0-video`。图生视频可选参考图/首尾帧模式、2–30 秒、480P/720P/1080P；Wan 默认720P。底层支持 `duration: -1` 自动时长。
- Story 第3步 → 全片音色选角 →「从 Fish 搜索 / 试听音色」。复用现有 Fish 公共库、授权库、工作区查询，支持语言、关键词、分页、样本试听。选定后保存 voiceId/名称；更换音色清除旧参考，迟到的旧音色生成结果不能覆盖新选择。
- 设置、图生视频、Story 第3/5步显示模型音色能力。不支持音色参考的模型明确提示“声音将由模型自动生成，无法指定音色”，Story 不再要求先生成 Fish 参考。

## 核查结果

| 通道/模型 | 图像传递 | 音色传递 | 约束 |
| --- | --- | --- | --- |
| ComfyUI H3 | 素材本地化后送入 ComfyUI 对应图片节点 | 按说话角色顺序传参考音频与名字；最多3个 | 现有 Hybrid 工作流可同时使用首尾帧与音色；本地处理参考音频长度 |
| API H3 | `image_urls` 为参考图；`image_with_roles` 或首尾帧字段控制帧 | `audio_urls`，最多3个 | 首尾帧与参考素材互斥；音频须搭配图或视频 |
| API Seedance Mini | 参考图与显式首尾帧分别提交 | `audio_urls`，最多3个；`generate_audio` 独立开启声音 | 首尾帧与参考音视频互斥 |
| API Wan 3.0 | `generation_type` 明确 frame/reference，保留图像角色 | `audio_urls`，最多5个；声音开关是 `audio` | 首尾帧各1张或最多10参考图；最多5视频；首尾帧与参考素材互斥 |
| API Wan 2.6/2.7 | 保留现有模型图片参数 | `audio_url` 是驱动音轨/配乐，不是独立音色参考 | Story 不再把 Fish 试音误作为成片对白音轨 |
| fal H3 Max、Sora、Veo、Grok、Omni、HappyHorse | 各自模型适配 | 本项目当前接口不支持 Fish 音色参考 | 前台说明无法指定音色；不提交 Fish 试音 |

两条通道复用角色、图片和音色来源，但参数、素材传输及组合限制不通用。API 需要供应商可读取的媒体地址；ComfyUI 接收本地化文件，不能把本机路径直接作为 API 公网参考。音色参考表达相似度约束，不保证输出声纹完全一致。

## 修复

- H3 API 无音频时漏传图片；有音频时错误混入首帧字段。现在保留参考图并阻止互斥字段混用。
- Story API 未自动补齐角色音色；Mini 带音色时关闭声音。现在按能力补齐、按说话角色顺序绑定，并开启原生声音。
- 超额说话角色不再静默截取前三名。首尾帧也不再静默丢掉音频。
- API 多角色 Fish 校准样本使用 Cloudinary 时长衍生地址共享14.7秒预算，保留原始文件，避免多份长试音超过15秒。外部非 Cloudinary 音频仍由调用方保证时长。
- Omni 不支持的两张参考图从静默漏传改为明确报错。

数量、模式、分辨率及 Wan 提示词长度在付费 POST 前校验。上传音频前端检查单段与合计时长。供应商仍负责验证远程素材编码、可访问性、尺寸和真实时长；Wan 参考视频总长≤15秒，参考视频总长加输出时长≤30秒。未用真实付费生成验证画面/声音质量。

## 验证与发布范围

- `tests/wan3-video-references.test.mjs`：模拟HTTP提交验证 Wan 请求、H3模式、Story声图传递、音色顺序、超额/缺失拒绝与试音时长衍生地址。
- 相关测试70/70；Next.js生产构建通过。
- 浏览器验收回执与截图：`out/verification/wan3/`，使用隔离浏览器和模拟音色库，不操作真实项目或付费生成。
- 本次功能入口与 APIMart 提交/Fish 查询在网站前后端。网站用户无需更新 Companion 即可使用 Wan/Fish 搜索；新增 ComfyUI 服务端完整性校验位于共享路由，旧 Companion 的现有素材工作流仍兼容，新校验需后续 Companion 发布才会进入安装包。本轮已发布网站，未发布或重启 Companion。

## 官方资料（2026-09-07核对）

- [Wan 3.0](https://docs.apimart.ai/cn/api-reference/videos/wan3.0-video/generation)
- [MiniMax H3](https://docs.apimart.ai/cn/api-reference/videos/minimax-h3/generation)
- [Seedance](https://docs.apimart.ai/cn/api-reference/videos/seedance-2-0/generation)
- [Wan 2.7](https://docs.apimart.ai/cn/api-reference/videos/wan2.7/generation)
- [Fish 查询音色](https://docs.fish.audio/api-reference/endpoint/model/list-models)
- [Cloudinary 音视频时长裁切](https://cloudinary.com/documentation/video_trimming)

### 生产发布验收

用户明确授权“发布更新吧”。Netlify 生产构建、部署成功；正式域名 `/story` 的16个脚本、`/image-to-video` 的9个脚本逐字节匹配本次构建，包含 Wan 模型及 Story Fish 入口。三个接口 `/api/image-to-video`、`/api/generate-video`、`/api/series/voice-catalog` 缺参校验均返回预期JSON 400。没有提交付费生成或修改用户生产项目。

回执：`out/releases/wan3-20260907/verification.json`；部署日志 `out/releases/wan3-20260907/deploy.log`。本次仅网站更新，Companion 仍为0.1.202。
