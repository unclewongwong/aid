# aid R2 媒体迁移

2026-09-08：用户要求将 aid 图床改成 R2 以降低成本。代码基线 0.1.210；本轮适配未发布、未切换线上配置，已安装 Companion 仍是旧版。

## 实施范围

- 现有 `cloudinaryUpload.ts` 作为兼容入口，服务器配置 `MEDIA_STORAGE_PROVIDER=r2` 后统一把图片、音频和视频存到 R2。旧 Cloudinary URL 保持可读兼容，未批量改写历史项目。
- 网页和 Companion 通过网站取得 15 分钟、单对象、禁止覆盖的 R2 PUT 签名。密钥仅留在网站服务端；客户端验证上传地址和协议，直接上传原始字节并使用独立公开交付 URL，不保存过期签名 URL。
- 服务端直接上传采用内容哈希路径，重复保存相同字节得到同一地址。浏览器签名使用随机对象路径以避免覆盖其他资产。
- R2 图片原图上限 50 MB，不再套用 Cloudinary 的 9.5 MB 压缩门槛；Cloudinary 回退流程仍保留原限制。音视频缓冲上传上限 512 MB。
- R2 四/九格通过 Sharp 生成真实 WebP 文件：按行排序、短边 4.5% 裁边、最长边 1600、无放大、质量 95。母图原件单独保留。旧 Cloudinary 四格路径保留。
- 分镜读取和角色核验只增加配置指定的 R2 素材域名，未放开所有 R2 或任意公网域名。远程转存的 HTTPS 下载禁止内网地址、DNS 重绑定和重定向。

## 当前配置（2026-09-08）

用户确认继续后已完成 Cloudflare 账户 `7965e02b2b76860791cba6597fb022ad` 下 `aid-media` 的配置：Asia-Pacific (APAC)、Standard；公开域名 `https://aid-media.searchpanda.vip` 已 Active/Enabled。

CORS：GET/HEAD 允许所有来源；PUT 仅允许 pandais.beauty、www.pandais.beauty、localhost:3018 和 127.0.0.1:3018；上传允许 Content-Type、Cache-Control、If-None-Match。JSON 在 `out/verification/r2-storage-20260908/cors.json`。

桶级令牌 `aid-media-production` 已创建，Object Read & Write、仅 `aid-media`、Forever。R2 凭据已保存为 Netlify 服务端的秘密环境变量（production/deploy-preview/branch-deploy），公开素材域名也已设置到 GitHub 仓库变量供跨平台 Companion 构建。安装包已扫描确认不含 R2 凭据。

Cloudflare 响应头规则 `AID media cross-origin resource policy`（ID `2cf5562c44ab4da1b0cd039c9596de31`）只匹配此素材域名，设置 `Cross-Origin-Resource-Policy: cross-origin` 和 `Access-Control-Allow-Origin: *`。前者兼容 aid 的 COEP require-corp，后者使普通图片与跨域 canvas 共用缓存时仍可读取。浏览器实测图片/画布/音视频通过，crossOriginIsolated 保持 true。

18项真实上传验收已通过（原始字节、13MB图片、签名PUT/CORS/禁止覆盖、四/九格、WAV和MP4），见 `out/verification/r2-storage-20260908/live-result.json`。本机 Companion 已更新0.1.211，持久化数据哈希一致；网站发布验证进行中，原制作队列已可恢复暂停，正式切换后恢复。

## 开通后配置与验收

1. 创建独立 `aid-media` 标准存储桶，确定正式公开素材域名。生产交付优先自定义域名，不能把 R2 S3 API 地址当成图片公开地址。
2. 创建只限此桶的对象读写凭据。只配置到 Netlify 的服务端环境，不输出到日志、记忆、源码、安装包或前端。
3. 配置 `MEDIA_STORAGE_PROVIDER`、`R2_ACCOUNT_ID`、`R2_ACCESS_KEY_ID`、`R2_SECRET_ACCESS_KEY`、`R2_BUCKET`、`R2_PUBLIC_BASE_URL`。网站与 Companion 构建同时提供相同 `NEXT_PUBLIC_R2_PUBLIC_BASE_URL`（非秘密）。
4. CORS：公开 GET/HEAD 供显示、canvas 和模型拉取；PUT 仅允许正式网站 `https://pandais.beauty`、`https://www.pandais.beauty` 和本机 `http://127.0.0.1:3018`、`http://localhost:3018`。允许 Content-Type、Cache-Control、If-None-Match 请求头，暴露 ETag、Content-Length、Content-Type。公开访问只开启在专用媒体桶上。
5. 在 R2 验证小图原始字节、超过 10 MB 原图、网页跨域 PUT/GET、Companion 托管签名、四/九格与音视频 Content-Type。实际上传验证不提交新生图/视频生成。
6. 网站和 Companion 同步发布与更新本机安装版。旧 Companion 不识别 R2 票据，不能只切网站签名后宣称桌面端已完成。
7. 复用已保留的生成任务补存失败素材。历史 Cloudinary 下载失败文件需要本地备份或仍有效的供应商结果，不能仅替换域名。

## 本地验证入口

`tests/r2-storage.test.mjs` 覆盖签名作用域、文件类型和原图、网页 PUT、Companion 无密钥上传、错误恢复、域名边界、内网拒绝及四/九格顺序和尺寸。关联旧用例包括 image-upload、story-image-request、generated-image-persistence、grid-preprocess、grid-recovery、series-image-cast、api-voice-reference-recovery。

本地验证：7 项 R2 专项测试、12 项 Story 请求测试通过；其余 37 项关联旧流程测试通过。类型检查和生产构建通过，回执 `out/verification/r2-storage-20260908/result.json`。未进行真实 R2 上传或上线验收。当前配置为空时保留 Cloudinary 路径，正式切换需要以上真实验收。
