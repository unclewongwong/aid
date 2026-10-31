# Pika H3 Flex：多参考连续动作的分层提示词

用于已实际接入 Pika H3 Flex、需要多个画面状态共同引导连续动作的任务。以当前用户提供的 Pika Rewrite 写法和一次九图试片为启发：人物/摄影/动作写成同一时间线，环境动作声与非叙事音乐分层；实际创作必须重新写本片内容，不能复制案例的角色、道具、九张数量或固定时长。用户明确锁定逐字提示词、语言、配乐或对白时以用户要求为准。

## 先确认输入职责

- 调用当前 `aid_status`、路线与所选模型的只读请求预览确认实际可用；知识更新不会安装 Pika 适配器或使任何客户端自动获得新字段。逐项记录真实参考素材及顺序，图像、视频和声音各是什么用途；编号必须与预览实际输入一致。无参考就不要虚构图号。
- Pika 的 reference-to-video 与 image-to-video 的输入模式分别核对。前者的普通参考可引导身份或故事状态，但不能只因为“图1”排第一就声称锁定实际首帧或精确时刻；后者若真实支持首尾帧，可约束起点/终点，但不把普通多参考与首尾帧默认为可混用。所需精确时序、构图或跨任务续接应按能力另行设计，不能靠文字许诺。
- 同一连续镜头的多张图描述同一行动逐步改变的状态，不自动等于多个镜头。按当前剧情选择必要图片数量，用户指定九张就实际绑定九张；涉及九宫格先按目标状态生成、审视并裁出独立图片，不把整板当第一帧，也不把参考图称作已验证的精确关键帧。相邻图的站位、景别、轴线、动作方向、持物与光线应能通过所写过程到达；若图片本身跳位，先修参考或安排真实切镜，不能只写“平滑、不切镜”。

## 本次验证过的写作组织

Pika H3 Flex 多参考连续动作的执行稿，用户未另指定语言时采用本次用户认可的**英文画面及声景说明**；中文或其他语言的逐字对白、歌词和画面文字保持原文。用户明确要求中文、逐字同稿或其他格式时服从用户要求；其他模型/模式按其实际约定。英文只是这个案例的制作选择，不能声称英语必然比中文效果好。

把以下标题和完整文字放在所选接口的**同一个 prompt 字符串**里；不要把标题当作 Partner 顶层 API 字段，也不要假装调用了独立的 Rewrite 功能：

```text
integrated_multimodal_description: [Shot 1] [medium and framing; subject ID and concrete appearance; setting and light; camera position, axis and motivated path; actual references and what each contributes; continuing prop/identity states].

From 00:00.000 to 00:02.000, reference image 1 → image 2: [specific trigger, physical actions and camera/scene responses, ending state].
From 00:02.000 to 00:04.000, image 2 → image 3: [continue from that state; visible contact or changed object state; reaction].
[Continue for every relevant interval, covering the requested duration and the actual image order. Add a new Shot only for a genuinely planned cut.]

overall_soundscape: [continuous ambience; physical sound sources and their timing; exact dialogue only in its intended dialogue notation; speech/music constraints consistent with the scene].

non_diegetic_music: [the requested music and role, or None when the project requires none].
```

上面是组织方式而非可直接提交的空模板：实际编译必须填满所有相关状态与相邻过渡。一个时间段可包含多个借势、先后或合理并行的动作；脚步、重心、手、武器、触点、对方反应和镜头方向连成一条路，不能把秒界变成停顿。音效与动作触发对齐；没有配乐只在项目要求时写 None，不因格式推断用户要配乐或无配乐。人物对白按真实路线写入画面时序、指明唯一说话人并逐字保留；声景不重复台词文字，避免额外声音。

每图至少交代该图代表的实际状态和对应片段；N张连续状态需要有N−1段具体变化。参考图仅用于身份、环境或风格时应写清职责，而非假冒某一时刻。完整故事、人物与素材职责按项目取舍，不要求每条镜头都长成九张参考或一镜到底。明确禁止字幕、无意的多画面等仅在本片需要时写入；参考图中的边框、编号不能进入画面。

## 提交前核对

1. 对照实际上传的每张图核对编号和职责；角色卡不被当成剧情帧，图片中的人数、手、姿势、道具、光线与文字指令不冲突。
2. 从首个可见状态检查每个动作的前因与末态：已经拿起的物件不能下一段重新凭空拿起，刀还握着不等于必须始终高举；后续动作从真实位置与握持继续。
3. 核对时长覆盖、剧情因果、真实剪辑点、镜头视轴与相机路径；所需焦点、关键接触和对手反应在景别内可见。对白原文、音色/素材职责与静音/配乐要求不因改写丢失或互相矛盾。
4. 有意使用服务端 rewrite 时，按实际工具选择并记录；若 Agent 已按此格式编写且本次要保留原稿，对应参数按所选适配器预览确认。rewrite 是否开启、场景语言、素材和时间参数都属于请求的一部分，不能不说明就改变。

## 实例与证据边界

2026-10-31，用户认为一次 Pika 九参考英文分层样片比此前流畅很多，要求吸收其写法。两次使用同九张图、同模型、时长、画幅、分辨率与 rewrite=false，但语言、结构和文字细节一起改变，seed 均未显式设定，且各仅一次；这是用户对具体成片的积极评价，不证明英语或某个字段单独造成改善。第二版仍出现机位/构图跳变，靴底接触与对手退后也未清楚显示。用户经验和具体观察可以指导下一次写稿，不能宣称所有场景有效或模型保证按九图、时间码逐帧执行。
