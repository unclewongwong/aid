# AID 0.1.222

修复Seedance 2 Mini参考音频总时长超限导致的大量HTTP400失败。Story/连续剧及独立图生视频在共同提交入口实际解码参考音频，按每次请求合计不超过10秒分配并上传WAV副本；最多3个角色，保持声音顺序和对应关系，不改原音频、逐字台词或视频时长。

R2与Cloudinary统一处理，读取或处理失败在付费生成提交前停止。并发请求复用音色副本，处理失败不缓存。网页服务单独打包Linux FFmpeg，本机Companion保留自己的解码程序；其他模型及ComfyUI/H3路线不变。

实际R2验证12秒+17秒参考音频转换为5秒+5秒，重新下载解码确认10秒。详细验证见docs/seedance-audio-budget.md，发布回执out/releases/v0.1.222。

此版本替代未正式发布的221候选。部署实测发现NETLIFY环境标记在运行时不可靠，改为按Linux平台和打包文件存在性选择解码器；Windows交叉构建测试使用运行器原生FFmpeg，安装包仍携带Windows程序。221候选网站未提升正式，公开安装包未发布。

发布代码0846d88527f436ea57ef0b58daec95408f2810e8；后续87977e1只修正CI测试环境安装FFmpeg，不改变应用代码。Windows交叉构建运行器不预装FFmpeg，不能只读取command -v的空结果。公开包以workflow_dispatch从87977e1构建，仍发布companion-v0.1.222，应用代码与版本标签一致。

正式Netlify部署6aa04041791d4d8ad216390b，四页面10/12/14/18脚本与构建匹配。本机完整222已安装，旧221完整备份位于out/releases/v0.1.222/AID Companion-0.1.221-installed.app；220备份保留于out/releases/v0.1.221。更新前保存原生产任务断点，完成后恢复原任务，没有重生已完成片段；不把该任务恢复运行写成整集完成。
