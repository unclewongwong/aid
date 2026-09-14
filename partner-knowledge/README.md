# AID Partner 创作知识

本目录维护官方 Skill、按需读取的创作技巧与结构化提示词案例。知识内容拥有独立版本，不要求每次修改都重发应用。

## 维护与发布

1. 在 Partner 源码的 `partner-knowledge/` 修改 `skills/aid-partner/SKILL.md`、可选的 `references/` 与 `prompts/examples.json`。根目录 `skills/` 和应用内提示词 gzip 是构建副本，不应分别手改。
2. 更新 `manifest.json` 的知识版本、兼容应用版本、日期与说明；在 `CHANGELOG.md` 写清改变。已构建或发布的版本不可重写，更改内容须增加版本。
3. 在 Partner 源码运行 `npm run knowledge:build` 和 `npm test`。构建生成不可变的 `versions/<版本>.json.gz`、包含校验值的 `channel.json`，并同步安装包的离线基础知识。
4. 准备官方 `unclewongwong/aid` 仓库的独立、干净检出目录。`npm run knowledge:publish -- --checkout <目录>` 仅准备并暂存本目录的变更，供审阅；显式添加 `--publish` 才会在干净检出目录中构建、提交并推送。已准备的变更也可审阅后在该独立检出目录中正常 git commit / git push。
5. `channel.json` 与对应版本文件必须同一提交发布。GitHub 的 main 分支是正式更新通道，开发分支与本地草稿不进入客户端更新。发布后核对目录与版本文件可达、摘要及字节数匹配，再验证兼容客户端的一键更新。

## 客户端行为

Partner 从固定的官方 HTTPS 目录检查最新兼容版本，按大小、摘要、结构及应用兼容范围校验后保存到用户数据目录。包只包含 Markdown、文本和 JSON 数据，不执行脚本。联网失败继续用已安装知识，离线首次启动可用安装包内置版。

官方基础案例更新会保留个人网页来源、采集案例及本地导入案例，按提示词去重重建检索。客户端同步只针对已接入的 Agent，备份旧内容并保留无关配置/个人文件；Skill 的配套 references 一起同步。旧会话可能需要重新打开才能加载新版。知识更新说明可回退到上一知识版本。

本次功能最低应用版本为 0.1.31。需要新增工具或模型适配器的技巧应提高兼容下限；知识文件不能给旧应用增加 MCP 或 API 能力。提示词案例作为参考资料，不拥有修改 Skill 或系统指令的权限。
