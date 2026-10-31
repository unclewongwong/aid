# AID Partner 创作知识

2026.10.31.4：根据用户纠正，“电影级制片”的基础分镜与九宫格可按云卡情况选择 Qwen 电影感 LoRA V1 或 Pika GPT Image 2.5，九图裁切和 Pika 多参考成段不变。新组合尚未成片验证。

2026.10.31.3：用户明确触发“电影级制片”时，按 Qwen 电影感 LoRA V1 场景基础分镜、九宫格、裁切核验与 Pika H3 Flex 九图多参考执行；保留故事、动作和段间连续性，完整新流程尚未成片验证。


2026.10.31.2：新增[Pika H3 Flex 多参考分层提示词](skills/aid-partner/references/pika-h3-flex-structured-prompt.md)：按真实素材顺序编译连续动作，画面时间线、声景、配乐分层，约束物件状态与摄影机衔接。用户认可一次九图英文改写的流畅度，但仍有跳变；参考图不是精确关键帧，不能据此保证模型表现。


2026.10.31.1：在[高强度动作与技能演出](skills/aid-partner/references/high-intensity-action-and-vfx.md)补充一秒内多个关联动作和连续招式：按重心、剑路、先后接触、借势及相机跟随编排；“一个主动作”指主要观看任务，不限制连续动作数量。根据用户对废土与武打样片的反馈提炼，实际模型执行仍有接触和光效局限。

本目录维护官方 Skill、按需读取的创作技巧与结构化提示词案例。知识内容拥有独立版本，不要求每次修改都重发应用。

2026.10.28.4：在现有运镜决策、技法速查和提示词编译上，新增[Melies目录映射与转译示范](skills/aid-partner/references/camera-movement-melies-map.md)。按观看任务选择，分清机身移动、光学变焦、随载体固定、产品自转和动态滚转；目录含86个标签与重叠命名，不是新增模型控件。部分子页未访问成功，新写法尚未生成验证。

2026.10.28.3：参考用户认可的单次对照，为胶片摄影或过锐的实拍图补充自然锐度、影调和肤质写法；颗粒与局部光晕按场景选用，保留清晰阅读重点，单次样图不保证普遍效果。

2026.10.28.2：写实照片的实际提示词须明确实拍摄影外观并避免CG渲染感；具体光线和材质因场景而定，幻想内容可保留，明确指定的3A、CG、动画或插画不套用此约束。生成效果仍需查看。

## 当前修订：2026.10.28.1

本版本按用户提供的电影感实拍提示词讨论，补充[摄影真实感](skills/aid-partner/references/photographic-realism-prompt-design.md)：以媒介、主体瞬间、空间、可解释光源和镜头景深为核心，按需细化皮肤材质、色彩与少量负向约束；补可选焦段/光圈视觉参照、原创完整示例及局部塑料感的针对性诊断。原案例中的焦段与限制不是所有题材的固定规则，镜头术语不证明真实器材或模型精确光学；不同人物的好结果不证明旧问题图修复。本轮未重生图，效果待验证。

保留27.7在[视觉风格预设](skills/aid-partner/references/visual-style-presets.md#可选氛围组合柔光薄雾与粉紫杏色)中增加可选氛围组合：柔散射光、冷银轮廓光、清楚的整体明暗与柔和局部过渡、薄雾柔晕、选择性柔焦和细颗粒；粉紫杏色板另选，半厚涂、油画笔触及人偶肤感按媒介单独选择。20种既有预设与编号保持，3A虚幻引擎可借用光线成像并保留PBR材质；特殊效果逐镜选择，不迁移示例人物/情节或堆叠技术名称。新组合尚未生成样片验证。

保留27.6按用户提供的质感词组补强[20号3A UE／虚幻引擎风格](skills/aid-partner/references/visual-style-presets.md#20-3a-ue-虚幻引擎写实三维游戏过场)：斑驳侧逆光、面部与衣料受光、暗背景疏落散景、轻颗粒与朦胧空气、可读浅景深，以及条件式丝绸缎面光泽和珍珠柔亮珠光。保留英文词组与中文可取用段，按真实主体/光源/材质适配；其他19种风格与编号不变。UE5、PBR和8K是画面目标词，不冒充引擎设置或输出规格；未生成验证。

保留27.5的[整片视觉简报与分镜板协同](skills/aid-partner/references/whole-film-visual-brief-and-storyboard.md)：以共同主体/产品、光色、环境和场景用途贯穿生图与视频，简单展示保留自然发挥，关键交互/状态仍写足。区分逐字同稿测试与共享简报分别适配，按实际输入选择整板或单格，不强制所有影片拼图。补齐顺序、收口、开合/接触状态检查，并接入既有生图、九宫格、广告、H3和提交预检。来自一次真实整板→全屏多镜头测试：视觉基本统一但镜头重复和带盖饮用失败；修订约束尚未重生成验证，不宣称通用保证。新增原创陶杯结构示意，不复制第三方提示词或品牌素材。

保留27.4的[观看任务与可读尺度](skills/aid-partner/references/camera-movement-story-decisions.md#观看任务与可读尺度)：先定观众要看清什么，再安排景别、机位、焦点、移动/停留和可见表演。摄影与表演共用时间，保护关键接触与结果的阅读机会；固定镜头仍有效，同一首帧不自动锁定全程机位。实际提交正文须检查这些内容是否匹配，而不只检查是否写了运镜和微表情。补原创局部写法与固定构图的替代方案；未新增自动检查器或重生成影片，效果仍待实拍验证。

保留27.3的[完整模型稿与覆盖核对](skills/aid-partner/references/ai-shot-design-and-prompt-engineering.md#6-完整模型稿与覆盖核对)：镜头概述和实际生成执行稿分开，动作阶段、情绪触发与转变、对白前中后、听者反应及声画交接完整进入正文。需要千字级展开时写足，不用百字默认截短，也不以字数代替覆盖检查；仅去重恒定设定。补充既有端到端示例的微表演与持物承接，识别旧检索可能只返回420字符开头的限制。本次为Agent写稿规则，不增加App自动语义拦截或修复检索代码，未重生成影片。

保留27.2的[四个字体别名的思源替换](skills/aid-partner/references/font-commercial-licensing.md)：本机 Variety Kit `0.1.1-source-han` 已将独立 Helvetica Neue LT Std 的四个用途改为随模块附带的思源黑体 Heavy/Bold/ExtraLight/Light，中英文保持字重，缺文件报错；其余字体仍逐项核验。此知识包只同步说明，不给其他机器安装字体、代码或预览。

保留27.1的[字体商用许可](skills/aid-partner/references/font-commercial-licensing.md)约束：字幕、标题及包装的实际字体、字重、中西文配对与回退都须具备覆盖本次用途的许可，优先采用已核验的OFL字体。记录来源与适用范围，区分成片像素与字体文件分发；包装现状为开放字体与专有字体混用，知识更新不替换渲染器默认或历史视频。

保留26.2融合的[H3 Continuum 连续生成与续写](skills/aid-partner/references/h3-continuum-long-form.md)：身体/摄影机/声音状态接力，Chunk与Shot分层、Timeline完整覆盖、V3.9参考槽位及音频职责，保留已接受旧段再追加或局部重做。接入已有H3编译和成段生成，中文默认与既有制作约定保持；运行节点、缓存复用与GPU效果须按实际工作流核验，知识更新不安装Continuum。来源与MIT声明见[许可说明](skills/aid-partner/references/h3-continuum-notices.md)。

保留25.2的[本地后期与交付](skills/aid-partner/references/local-media-postproduction.md)：对已有素材按真实规格选择无损或必要重编码、裁切、拼接、画幅/声音处理及最终验证。融合ffmpeg-skill的方法与代码决策，来源及MIT声明见[许可说明](skills/aid-partner/references/local-media-postproduction-notices.md)。不安装上游42个工具、MCP或平台模板；字幕、包装、变速与音轨仍依本片要求，沿用原有技术/内容放行边界。

保留25.1的[高强度动作与技能演出](skills/aid-partner/references/high-intensity-action-and-vfx.md)，提炼用户认可的动作提示词组织方法：阶段改变战局、招式前后状态承接、摄影与命中反馈共用事件，人物/武器实体与能量余迹分层。H3试片获用户认可但残影严重；减轻残影的改写仍待验证，不复制第三方整段提示词、不保证精确招式与帧级效果。

保留22.3的[运镜技法与提示词编译](skills/aid-partner/references/camera-movement-prompt-craft.md)和[技法速查](skills/aid-partner/references/camera-movement-vocabulary.md)，融合 Camera Movement AI Prompts 的组织方法，接入已有运镜决策与H3正文。分开主体/相机、位移/旋转/变焦及时间效果，写清触发、路径、速度、构图和落点。按镜头实际复杂度选择单图、首尾帧或四状态，不增加服务、模型参数或自动生成；说明与示范原创编写，未收录网站示例影片。

保留22.2的[MG 动态设计](skills/aid-partner/references/mg-motion-design.md)与[15种方法卡](skills/aid-partner/references/mg-style-catalog.md)，用于明确要求的动态图形、解释动画、动态文字、品牌动效或已授权片头；普通剧情片不会自动加包装。融合内容承接、风格专属运动语法、关键画面设计、可复现逐帧制作和授权范围内的声音事件锚点。液态仅作为参考，保留既有排除。上游来源及 MIT 声明见[许可说明](skills/aid-partner/references/mg-styles-notices.md)，未导入案例影片、字体、采样或可执行程序。

保留22.1[摄影真实感](skills/aid-partner/references/photographic-realism-prompt-design.md)的条件式光学质感、[MJ→GPT迁移](skills/aid-partner/references/midjourney-to-gpt-image-prompts.md)、[连续镜头链](skills/aid-partner/references/scene-to-shot-continuity.md)、[20位导演方法库](skills/aid-partner/references/directors/index.md)、20画风及[按复杂度选择4K四宫格](skills/aid-partner/references/four-panel-motion-storyboards.md)。详细变化见[更新记录](CHANGELOG.md)。本地构建不等于已公开；以官方main频道的版本记录为准。

**知识更新与运行资源分开。**包内含85个Skill文件和974条基础案例，不包含Python脚本、Three.js运行工程、字体或渲染器。MG方法卡不是新增15个App按钮或已验收成片，运镜文字也不是模型效果保证。Mac可选AFTERGLOW与五套节目片头的说明以宿主实际已安装资源及依赖为前提；没有相应资源时不能仅凭知识已更新就承诺可渲染。Windows跳过这些Mac模块，其他已支持功能不受影响。最低应用0.4.4；本次只更新知识，不重发App或升级执行器。知识的日期版本号不是应用版本。

English: Matches performance to readable framing, focus and camera timing before expanding shot detail. Checks that decisive actions and reactions can actually be seen in the submitted prompt. Preserves static shots and user-locked framing; sharing a first frame does not automatically lock the camera throughout. Adds an original partial writing example, without runtime validation or generated-quality claims. Retains the following guidance: Separates shot summaries from complete generation prompts. Preserves action phases, emotional transitions, dialogue performance, listener responses and audiovisual handoffs; checks coverage in the actual submitted text without fixed word counts. Expands an original worked example and explains truncated retrieval excerpts. No runtime retrieval changes or generated-quality claim. Documents the four Source Han Sans replacements in the separately installed Variety Kit 0.1.1-source-han, including bundled OFL licensing and missing-file behavior; knowledge alone does not install these resources. Requires appropriate commercial font licenses for subtitles, titles and packaging, including actual files, weights and fallback glyphs; prefers verified OFL fonts and distinguishes rendered output from font redistribution. Documents mixed licensing in existing packaging without replacing runtime defaults. Retains H3 Continuum authoring guidance for chunk routing, physical-state handoffs, references, audio roles, append-only extension and Take reuse boundaries; no runtime installation or GPU quality claim. Retains scoped local media postproduction decisions and delivery verification without installing a new runtime. Retains high-intensity action and VFX guidance, with user-reviewed H3 observations and explicitly unverified ghosting mitigations. Retains scoped camera-movement vocabulary and prompt compilation with original examples and source attribution. Connects camera geometry and readable endpoints to existing continuity, reference selection and H3 prompts. Retains the MG module, optical realism, MJ-to-GPT, director, visual-style and conditional 4K storyboard guidance. It does not install runtime assets, add API controls, switch services or claim generated validation. Local builds are not publication or installation. Requires AID Partner 0.4.4 or later.

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
