# AID Partner 创作知识

本目录维护官方 Skill、按需读取的创作技巧与结构化提示词案例。知识内容拥有独立版本，不要求每次修改都重发应用。

## 当前修订：2026.10.20.2

本版本新增[摄影真实感](skills/aid-partner/references/photographic-realism-prompt-design.md)与[MJ→GPT提示词迁移](skills/aid-partner/references/midjourney-to-gpt-image-prompts.md)：保留清透美妆、浪漫电影、复古抓拍等审美目标，以动作、构图、光色和材料支撑自然感，不靠粗毛孔或压暗。包含五类迁移示范和一条用户认可的4K电影人像实际提示词；单张方向测试不代表锁脸、全部配方或视频效果验证。保留[连续镜头链](skills/aid-partner/references/scene-to-shot-continuity.md)、[20位导演方法库](skills/aid-partner/references/directors/index.md)、20画风及[按复杂度选择4K四宫格](skills/aid-partner/references/four-panel-motion-storyboards.md)的完整制作规则。详细变化见[更新记录](CHANGELOG.md)。本地构建不等于已公开；以官方main频道的版本记录为准。

**知识更新与运行资源分开。**包内含72个Skill文件和974条基础案例，不包含Python脚本、Three.js运行工程、字体或渲染器。Mac可选AFTERGLOW与五套节目片头的说明以宿主实际已安装资源及依赖为前提；没有相应资源时不能仅凭知识已更新就承诺可渲染。Windows跳过这些Mac模块，其他已支持功能不受影响。最低应用0.4.4；本次只更新知识，不重发App或升级执行器。知识的日期版本号不是应用版本。

English: This revision adds photographic-realism guidance and MJ-to-GPT prompt transfer, preserving aesthetic intent through coherent acting, framing, light, color and materials. It includes five scoped recipes and the actual prompt for a user-approved 4K portrait direction test, not a guarantee of identity or video continuity. All 20 director cards, visual presets, conditional 4K storyboards and production contracts are retained. Knowledge contains guidance and examples only; local builds are not publication, and application/runtime updates remain separate. Requires AID Partner 0.4.4 or later.

使用者在AID Partner中点击知识/Agent的「一键更新」，更新成功后新开或重载Agent会话即可。知识包不安装新工具或包装资源；LongCat及包装功能是否可用，仍取决于所安装应用实际支持的工具，不能把知识更新当成应用升级。

## 维护与发布

1. 在 Partner 源码的 `partner-knowledge/` 修改 `skills/aid-partner/SKILL.md`、可选的 `references/` 与 `prompts/examples.json`。根目录 `skills/` 和应用内提示词 gzip 是构建副本，不应分别手改。
2. 更新 `manifest.json` 的知识版本、兼容应用版本、日期与说明；在 `CHANGELOG.md` 写清改变。已构建或发布的版本不可重写，更改内容须增加版本。
3. 在 Partner 源码运行 `npm run knowledge:build` 和 `npm test`。构建生成不可变的 `versions/<版本>.json.gz`、包含校验值的 `channel.json`，并同步安装包的离线基础知识。
4. 准备官方 `unclewongwong/aid` 仓库的独立、干净检出目录。`npm run knowledge:publish -- --checkout <目录>` 仅准备并暂存本目录的变更，供审阅；显式添加 `--publish` 才会在干净检出目录中构建、提交并推送。已准备的变更也可审阅后在该独立检出目录中正常 git commit / git push。
5. `channel.json` 与对应版本文件必须同一提交发布。GitHub 的 main 分支是正式更新通道，开发分支与本地草稿不进入客户端更新。发布后核对目录与版本文件可达、摘要及字节数匹配，再验证兼容客户端的一键更新。

若本地累积了未公开的中间候选，不直接批量复制本地`versions/`与`channel.json`。应在独立检出目录中仅加入本次完整最新版及其目录记录，保留所有已公开记录和历史包不变；审阅暂存差异后提交。2026.10.12.3按此方式合并发布，中间候选不单独上架。

## 客户端行为

Partner 从固定的官方 HTTPS 目录检查最新兼容版本，按大小、摘要、结构及应用兼容范围校验后保存到用户数据目录。包只包含 Markdown、文本和 JSON 数据，不执行脚本。联网失败继续用已安装知识，离线首次启动可用安装包内置版。

官方基础案例更新会保留个人网页来源、采集案例及本地导入案例，按提示词去重重建检索。客户端同步只针对已接入的 Agent，备份旧内容并保留无关配置/个人文件；Skill 的配套 references 一起同步。旧会话可能需要重新打开才能加载新版。知识更新说明可回退到上一知识版本。

兼容下限以每个版本的 `manifest.json` 和 `channel.json` 为准：2026.09.16.1 及更早版本最低为 0.1.31，2026.09.16.2 至 2026.09.18.1 最低为 0.1.32。2026.09.18.2 起提供最低兼容0.1.31的完整知识：新版工具说明须先按实际MCP字段、工作流输入与适配器只读预览核对，0.1.31不启用fal Reference-to-Video或APIMart `videoUrls`。只有不可缺少的新工具依赖才提高整个知识包的兼容下限；可选能力须注明条件，避免阻断旧版的纯创作知识更新。知识文件不能给旧应用增加 MCP 或 API 能力。提示词案例作为参考资料，不拥有修改 Skill 或系统指令的权限。
