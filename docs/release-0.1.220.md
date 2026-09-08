# AID 0.1.220

以 LLaDA-Image-Turbo 替换 Z-Image 生图入口。历史设置自动迁移，新模型使用4步采样，支持文生图或1张源图编辑；超出参考图数量和提示词容量时明确提示。旧Companion需升级后才能提交新模型，历史生成任务仍可查询。

云端使用独立Python环境，保留H3现有依赖。1024方图文生图及单图编辑已实际完成，云端执行约95秒和76秒；编辑可能改动未指定细节。修复社区量化加载器遗漏的位置编码初始化。

网页、本机Companion与三平台安装包同步发布后移除Z专属模型链接及工作流。旧权重为平台只读共享挂载，删除入口不释放其名义20GB系统盘空间，不删除共享VAE或平台挂载目标。

验证及发布回执位于 out/releases/v0.1.220；模型验证位于 outputs/llada-migration-20260908。

发布提交 df7315a4d01e4af95dda1f6f55a183327c453946，正式网站部署6aa02e7ee8b745d021c1ffbc。30组635项发布检查通过；图生图/图生视频/Series/Story的10/12/14/18个脚本逐字节匹配，网站与本机API均拒绝超量参考图。

本机完整0.1.220已安装，lladaImageTurbo=true、CORS及签名通过，43个安装文件与打包产物一致，四类持久化数据哈希不变。旧完整219备份于out/releases/v0.1.220/AID Companion-0.1.219-installed.app。既有制作任务在保存断点后暂停、安装后恢复，仍使用原任务，未重做已完成片段。

Z专属transformer/Qwen编码器链接和旧工作流已移除，ComfyUI列表不再包含Z模型；平台共享挂载目标和ae VAE保留。恢复清单和小型工作流备份位于/root/aid-llada/retired-z-image。

GitHub Actions 34246994691三个平台和release全部成功，公开companion-v0.1.220的Apple Silicon、Intel、Windows安装包均HEAD 200。网站、本机和公开安装包同步发布完成。
