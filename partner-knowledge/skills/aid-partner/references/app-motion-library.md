# App「包装」页：预览、默认片头与默认包装

用户确认设置入口统一留在 App 的「包装」页，并要求每个效果有实际预览。该页面分为完整片头、综艺包装、经典包装：6 套完整片头视频；10 套代码包装各 7 类组件，共70条视频；经典P01–P10保留原动态预览及编辑。代码组件预览适当放大便于看清，实际片中位置、大小、文案仍按内容配置。

**先核对当前会话真实能力。**新版本地候选提供 `aid_motion_catalog`、`aid_motion_render`、`aid_set_default_intro`；旧 App 或未重载的 Agent 不会因读到指南就新增工具。知识更新不会安装 Python、字体或这些代码模块。缺工具时仍可按已验证的[独立模块入口](programmable-variety-kit.md)制作，但不能声称已读取 App 的新默认设置。

## 默认设置共用同一份状态

- 默认片头与默认包装分别保存、分别清除。片头用 `INTRO:afterglow/minimal/cinematic/documentary/acid/news`；新包装用 `VK:soda/guochao/neon/zine/flash/newsroom/explorer/cinema/mono/acid`；经典包装仍是P01–P10。
- 默认包装是同一个选择：选新的代码风格会替代近期经典默认，选择经典风格也会替代近期代码默认；不暗藏两套互相竞争的默认。项目已有明确经典绑定仍优先于近期默认；本次明确选择优先。
- 仅在用户要求设置默认时调用对应设置工具。默认片头用 `aid_set_default_intro`，默认包装用支持VK编号的 `aid_set_default_packaging`，先核对当前schema。
- 保存默认只决定用哪套，不授权每条视频都加。只要求片头就只做片头；只要求人物条不扩成全片字幕/片头/音乐。一次用户要求同时含片头和包装时，分别按真实内容生成并合成。

## 自动制作

1. 用户明确要求片头或包装后，查 `aid_motion_catalog`，核对 defaultIntro/defaultPackaging、style.available、版本、组件；不要用缩略图存在代替运行资源可用。
2. 片头：`aid_motion_render` 传 `kind:"intro"`、真实 `config.title`，副标题等仅按已确认内容传。省略styleId沿用默认片头；本次指定则传明确ID。opus五套固定5秒1080p30/16:9，AFTERGLOW参数范围以模块指南为准。新闻片头默认采用已确认红黑配色；本次明确改色再覆盖。
3. 代码包装：`kind:"packaging"`，`config` 为实际时间线，支持7组件及已验证定制参数。已有原片先导入、传sourceAssetId；省略尺寸/时长/帧率跟随源片。没有保存代码默认且没有明确styleId时，不默选新闻或P01。
4. 任务返回真实ID，`aid_task`等completed后用`aid_asset_path`交付；此接口会自动纳入本地素材，不重复手动导入。未知提交结果复用原idempotencyKey查询，不换编号盲重提。源片/代码版本改变会停止，暂停从原任务重渲染，不调用模型。
5. 片头与正文合成由Agent按请求完成。只需沿用默认包装和四种经典兼容事件时，支持新默认的`aid_finalize_video`可直接沿用VK选择；task/score/corner、配色/字体等详细定制走`aid_motion_render`。旧`aid_packaging_render/preview`的P01–P10 spec契约不扩展，不把新字段硬塞进去。
6. 默认不添加声音。请求`audio:true`只用于用户明确要合成音效时；原片音轨内容会保留并重编码。透明MOV仅代码包装支持且不带原片；独立片头是MP4。

示例只示意契约，正式项目替换真实文案和素材：

```json
{"name":"节目片头","idempotencyKey":"episode-intro-v1","kind":"intro","config":{"title":"已确认片名"}}
```

```json
{"name":"任务卡","idempotencyKey":"episode-task-v1","kind":"packaging","styleId":"VK:newsroom","sourceAssetId":"真实素材ID","config":{"events":[{"type":"task","start":2,"end":8,"text":"今日任务","items":["已确认任务一","已确认任务二"]}]}}
```

## 真实范围

代码执行目前仅macOS；预览视频不代表其他平台可制作。App会显示缺失资源并禁用相应默认选择，不自动联网安装。代码模块与76个预览资源属于App/本机资源，纯Skill知识只传说明；当前是否已发布/安装须看实际客户端，不能把开发预览当全量上线。用户给定的源脚本与字体没有随本知识公开。

## 0.3.6 安装版

macOS 0.3.6 随安装包提供上述三组代码执行资源与76条预览；本机已有自定义模块优先保留。实际渲染还需可用的 Python 3、NumPy、Pillow 和系统字体，App 检查后报告可用性，不自动安装依赖。FFmpeg/FFprobe沿用安装包内置版本。Windows可浏览预览，但跳过这些Mac代码模块，使用原有可用制作功能。纯知识更新仍不会替旧App安装工具、执行资源或Python。
