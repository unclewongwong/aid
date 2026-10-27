# 可编程综艺包装 · Variety Kit

这是 AIDP 的独立本地代码模块。只在用户明确要求本片包装/对应组件，且选择这套视觉、需要原库不支持的任务卡/比分牌/角标或定制参数时使用。用户仅说更新包装能力，不等于给当前影片添加包装。这里的新闻红色系是本模块预设，不改变其他新闻片头或近期默认。

## 按自然语言需求定制

十套代码风格是起点；Agent 根据文案、影片内容与品牌要求配置，不把用户限制在固定模板，也不要求用户手改 JSON。常规调整参数，特殊排版与动效修改项目副本中的 Python，保留原模块与可恢复工程。能用现有参数解决时不重写引擎。

- 参数层：主副文案、标签、全片/单组件配色、本地字体别名、9 个位置、归一化中心、缩放、旋转、透明度、层级、开始/结束/退场时间、花字语气与强调程度、任务条目、两队比分变化。
- 代码层：改字形布局、描边、缓存精灵、缓动、逐字动画；用统一组件函数新增风格。新增组件需注册并实渲染，不能因为 Python 可扩展就宣称任意效果已经支持。
- 七组件：`lower-third/chapter/pop/title/task/score/corner`。score 是用户给定数据的动画展示，不联网取实时比分；corner 不自动声称 LIVE 或编造时间。
- 十风格：soda 汽水、guochao 国潮、neon 霓虹、zine 手账、flash 闪切、newsroom 新闻、explorer 纪实、cinema 电影、mono 极简、acid 酸性。新闻使用深红/红黑/白/暖灰；地球线、底板、数字框、辅助色均协调。其他风格色板保持其设计，不全改红。

## 先确认实际能力

当前仅本机 macOS 验证。检查 `~/.aid-partner/motion-kit/variety-kit/render.py` 和模块 `README.md`，以及具备 Pillow/NumPy 的 Python、FFmpeg/ffprobe、本地字体。知识更新不安装这些资源；缺模块时说明具体缺项，不下载执行网络脚本、不修改模型路线。当前会话有本地代码执行能力才能使用；其他宿主不能凭这页声称已安装。

本模块与 P01–P10 的原 `aid_packaging_render/preview` spec 分开，不把新 ID、task/score/corner、palette/fonts/scale 等塞进原spec。新版候选已接入[App包装页与动效接口](app-motion-library.md)：实际暴露 `aid_motion_catalog/aid_motion_render` 时优先读取同页保存的默认并通过任务制作；这不是任意代码执行接口。工具缺失但独立模块可用时，按下面CLI导出后导入素材。原库参数仍按[本地综艺包装](local-variety-packaging-kit.md)。

## 制作与交付

选字体先按[字体商用许可](font-commercial-licensing.md)核验实际文件及授权。此模块混用开放、免费商用与专有字体，默认配置不是开源白名单；`fonts` 覆盖须包含实际使用的西文别名与 CJK 配对，缺文件退到系统黑体也不能跳过核验。`--check` 只验证参数和文件等技术条件，不验证商业授权。

1. 沿用用户已授权的原片/内容，生成最少必要事件。文案、人物身份、比分与时间均有来源；演示须标明，不能沿用上游样例虚构人物。
2. 在项目目录保存时间线，先读模块 README；`--list` 返回当前安装的风格与实际色板键，避免猜参数。主色板与事件 `palette` 用已有键和 `#RRGGBB`。`fonts` 是别名到本地绝对字体路径及 index 的映射，中文还需对应 CJK 别名。
3. 用 `--check` 验证，`--sheet` 出真实联系表，必要时补落版与退场定点。阅读/同槽位提示只是启发式，渲染不会自动避开人脸、字幕、关键物件或防止所有裁边；实际看图修正。
4. MP4 使用 `--source` 和 `--out`；省略尺寸/帧率/时长跟随原片。跨比例默认拒绝，只有本次允许改画幅时选择 contain/cover，不偷偷裁切。独立透明 ProRes 4444 MOV 用 `--overlay`，不同时带原片；无原片 MP4 是演示灰底，正式独立片头需设计背景。
5. **音效默认关闭**。原片音轨内容保留并重编码；只有本片明确要求额外音效才用 `--sfx`。花字语气 `tone:sfx` 只是视觉类型，不授权声音。没有额外配乐、旁白、字幕或变速。
6. 取新文件路径，完整解码并核对时长/尺寸/音轨/透明度，再按当前 `aid_import_asset` 导入、用 `aid_asset_path` 交付。透明层不能当普通片段顺序拼接替代叠加。接口导入大小限制照实执行；超限不伪造导入成功。

以下是 Agent 使用的调用示意，实际使用真实项目路径，用户无需操作终端：

```bash
python3 "$HOME/.aid-partner/motion-kit/variety-kit/render.py" /absolute/project/timeline.json --sheet /absolute/project/preview-v1.png
python3 "$HOME/.aid-partner/motion-kit/variety-kit/render.py" /absolute/project/timeline.json --source /absolute/project/master.mp4 --out /absolute/project/packaged-v1.mp4
```

输出已存在会拒绝；失败不留残缺交付文件、不用灰帧顶替原片。修改用新版本文件名，保留母版。当前适配入口支持 0.1–120 秒、1–64 事件、最高 4K 像素、1–60fps；输入为普通 SDR、无旋转元数据、方形像素、常规固定帧率、最多单原音轨，复杂来源先准备母版。技术上限不等于可读性、全部画幅/字体或性能均验收。

## 扩展与分发边界

新增 `styles/<id>.py` 定义 NAME/PALETTE/OUT 和 `fn(canvas,event,local_time,out_progress,ctx)`；模块自动发现合法 ID，JSON 不能导入任意代码路径。公共变换与定位复用同一层，保持各风格原生动画；组件自身复杂时序仍在代码中编排。相同 t 应确定性重现，字体/新样式/中英文/画幅在实际项目验证。

用户提供的源代码可按本次要求本地使用；没有上游公开许可，不称已开源，不随纯知识包公开脚本、字体或示例影片。源码与已安装模块是独立资源；更新知识指南不代表桌面包装页已升级，也不代表 Windows/Intel/所有 Mac 已实测。
