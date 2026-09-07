# Wan 3.0 输入音色链接失效与花少 ComfyUI 重跑

用户报告 APIMart「An input media URL could not be fetched (404/410)」。花少第1集16张现有分镜PNG均HEAD200；大姐、小晴、小井、小阳的音色仍在dgprzvbak，源站HEAD401并明确`cloud_name dgprzvbak is disabled`。阿宁、小爽在现用存储正常。APIMart汇总错误未指名具体URL，源站失效证据与输入音色映射已定位，不将它误归为Wan画质或分镜丢失。

暂停原制作防止坏URL继续重试，从本机voice-reference-cache的4份原始base64音频重新上传至有效存储，保存同一voiceId与原字节；全部新URL返回音频200。更新4份本机缓存、项目角色和production中8处引用，不重新合成Fish，不重生分镜。证据outputs/wan3-media-recovery-20260907/diagnosis.json、replacements.json、project-before.json。

新增API提交前受管音色链接恢复：仅探测Cloudinary音频，失效时复用本机原音频/已恢复缓存，合并并发恢复；网络暂时失败或缺原音频明确停止，未调用视频生成。再次确认API裁切派生音频可读。外部自定义URL保留原供应商处理路径，不用服务器代读任意地址。单元与Wan请求回归11项、TypeScript通过。通用源码未发布，当前数据恢复已生效。

用户随后明确要求改用ComfyUI完整跑一遍花少。两集已从v2进入v3，原Wan第1集16个任务及素材保存到visualHistory和project-before-comfy.json；视频重置专用函数保留16张首帧。第2集已有16镜稿但无production，按现有GPT-Image-2/GPT-5.6-Luna配置补齐所需分镜。两条原produce任务封存ComfyUI/minimax-h3、dasiwa4，正常resume恢复队列。SSH/Comfy连接通过，已收到第1集前2条真实comfyui任务编号。此处为启动记录，整集完成后另记结果，不做画面质检或评分。
