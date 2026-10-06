# 音频参考与固定原声

适用于 AID Partner 0.3.4 的已实现契约。知识包兼容旧应用，但不会给旧工具增加参数：先查当前 MCP 字段、`aid_workflows` 的实际输入和 `aid_preview_api_request`，再编译请求。生成仍须有具体用户授权与稳定 `idempotencyKey`。

| 路线 | 音频入口 | 实际作用与限制 |
| --- | --- | --- |
| APIMart Seedance 2.0 / fast / mini、MiniMax-H3 | 顶层 `audioUrls`；`referenceAudioUrls` 为别名，两者只传一个 | 映射 `audio_urls`，最多3段，须配普通参考图片或视频 |
| APIMart Seedance 2.5 | 顶层 `audioUrls` | 最多10段，可仅用音频参考 |
| fal `minimax/h3-max/reference-to-video` | `assets.reference_audio_1` 至连续编号的本地素材，或 `referenceAudioUrls` | 声音/节奏参考；每段2–15秒，音频合计最多15秒；图片/视频/音频合计最多12个 |
| fal `minimax/h3-max/image-to-video` | `assets.target_audio` 或顶层 `targetAudioUrl`，只传一个 | 固定原始声轨；按视频时长截取或补静音。与声音参考不同；本地音轨至少2秒、最多15MB，视频至少2秒 |
| 已识别的 ComfyUI H3 | `assets.reference_audio_1` 至 `reference_audio_3`；`reference_audio` 是首段别名 | 只在工作流声明相应输入时使用；每段2–15秒、合计最多15秒；连续编号且不重复传首段别名 |

APIMart 音频须使用无需登录的 HTTPS 地址或供应商 `asset://` 地址；本地音频不能经过图片上传接口，也不能未经用户授权自动发布到第三方存储。APIMart 当前适配器不接受音频与 `first_frame` / `last_frame` 混用；保留用户需求并说明该契约限制，不能静默丢弃首尾帧。

fal 本地录音先用 `aid_import_asset` 导入再传素材ID，不能把文件路径塞入 `inputs`。Reference-to-Video 的本地素材排在同类 HTTPS 地址之前，按实际预览列表编写 `Audio 1` 等引用。固定原声要保留原音轨；若用户只要求音色/节奏参考，应选择已支持的参考模式。

ComfyUI 必须查实际工作流输入；自定义图可能已经有自己的音频映射，不假定所有 H3 图都支持相同键。未提供参考音频时保持工作流原有行为。T8 的首帧与录音组合由适配器处理，不把节点参数当作顶层 MCP 字段。

参考音频、`generateAudio` 开关和独立语音生成是三种用途。参考录音输入不等于保证逐字保留、克隆音色或准确口型。提示词明确声音来自谁、画内/画外位置、逐字对白、发生时序及参考目的；真实成片效果须以实际结果判断。预览和模拟接口测试不证明供应商额度或样片效果。
