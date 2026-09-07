# AID 0.1.207

本次合并近期已完成修改，网页和三平台 Companion 同步发布。当前状态：网站、本机完整运行版和三平台公开安装包均已发布并核验。

- 连续剧在定稿后、视频生成前按实际镜数逐镜独立生成1K参考图，不再新建四宫格或为生图凑16张。复用现有图片与已提交任务，旧付费母图仍可恢复。GPT Image 2和Nano Banana2传递1K，其余模型遵守原生支持档位。
- 自动补镜后保留完整镜头，再局部修正道具标注与画面文字关系或对白问题；可恢复旧失败补镜缓存，保留一次补镜限制，避免重写已完成剧本。
- Story和连续剧前台选择成片模型，按项目保存；API/ComfyUI/fal执行提交快照，修复连续剧强制覆盖成ComfyUI。
- 新浏览器设置未加载或未明确保存生图/编剧模型时提示设置，不把初始默认值当作制作配置；已保存设置和隔离生产任务快照继续使用。
- 完成的视频缺任务编号不再阻止导出；完善API任务编号与缓存恢复。
- 合成时补齐音视频尾部到剪辑计划终点，修复多段累计截短导致的合并失败，自动恢复旧短转码缓存。
- 导出终态失败正常返回，修复网络重试吞掉错误、页面长时间停在合并阶段的问题。网站本机导出要求Companion0.1.207，避免继续使用旧合成逻辑。

保留此前Seedance2.0 Mini、Wan3.0、Fish音色查询、API并发、超长台词局部压缩及集数由项目设置决定等功能。本次不更改DaSiWa模型、采样或引入视频画面质检。

侯府六段已使用修复后的源码恢复导出并交付，81.07秒、55,992,155字节；未重新购买生成。详见docs/video-export-recovery-20260907.md。该恢复与正式版本发布分别核验。

## 发布验收

业务提交b8fa7a593748ccd1acc3e6267fc8503fd5d85b86，标签v0.1.207与companion-v0.1.207。29组564项测试、完整Companion生产构建和两页隔离浏览器模型选择/空设置测试通过。Actions34136801647三平台及release全部success，GitHub latest指向companion-v0.1.207，Apple Silicon、Intel、Windows三个下载均HEAD200。

本机3018完整0.1.207提供seriesSingleShotImages、seriesVideoModelSelection及既有能力；正式域名CORS通过，安装包与已安装构建一致。替换期间series、pipeline-drafts、series-drafts、video-exports全部内容哈希不变。此前另一任务临时安装的局部0.1.207保存在out/releases/v0.1.207/AID Companion-0.1.207-partial-installed.app；如需回退至0.1.206，其备份路径见docs/settings-origin-recovery-20260907.md。

网站初次部署6a9ed3ac559c85dac6d25c96。用户随后追加Story步骤条与模型选择框居中对齐，网页提交7c19da3、最终部署6a9ed4d5b2c903e152b8081e；这是纯网页样式更新，未重复制作Companion包。正式域名Series13个与Story17个脚本逐字节匹配最终构建；1924px视口下两个控件中心线差为0px。回执out/releases/v0.1.207/release-verification.json、toolbar-alignment.json与截图。
