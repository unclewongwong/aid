# 从 MJ 佳作提示词迁移到 GPT 图像：保留审美，组织画面

在用户提供 Midjourney 提示词/样片，要求迁移到 GPT，或反馈 GPT 画面虽然细致却仍僵硬、不自然时使用。与[静态图编写](gpt-image-still-prompt-design.md)、[摄影真实感](photographic-realism-prompt-design.md)配合；不更换供应商、模型或业务流程，不自动提交生成。

来源：2026-10-20用户提供的一份含24条英文提示词的MD及随后3条追加，涵盖美妆、古风、电影、抓拍、幻想、商品、建筑和版面留白；用户表示这些提示词在MJ表现良好。这里整理的是可迁移方法与改写示范，不代表27条均已在GPT验证，也不是微调模型。原文和用户图片保留在授权工作资料中，不随Skill整批分发。用户确认此前质感图来自MJ；不能把图像外观写成实拍来源或真实EXIF。

## 1. 先保留“想让人看到怎样的作品”

这些源提示词大多已是自然语言，不是需要破解的MJ语法。先保留审美方向与关键关系，再处理重复、歧义和冲突；不要把它们全部重写成冷硬的技术清单。

- **审美方向**：清透美妆、浪漫电影一瞬、复古生活抓拍、克制古典舞、奢华幻想时装、清晰建筑摄影等，先选与当前任务一致的一种。`beautiful`、`dreamy`、`editorial`不是禁词；随后说明美感来自哪里，例如柔和面部体积、轻盈表情、衣料节奏或安静留白。
- **可见状态**：把“优雅、权威、青春、亲密”落到眼神、嘴角、重心、手与物的关系。描述镜头刚好捕获的瞬间，不强行给每个人加笑容、回眸、风或雀斑。
- **整体先于微观**：先让人物占比、姿态、光块、色板和材质主次成立，再加少量肌肤或织纹细节。脸要有柔和体积，不靠放大毛孔证明真实。自然也不等于变老、变脏、压暗或取消美感。
- **忠实于用途**：美妆广告可以干净精致，幻想可以华丽，街拍可以失焦，建筑需要空间可读。不能把所有作品强行做成低饱和纪录片。保留用户指定年龄、身份、文化与衣装，不从质感参考继承另一张脸。

先形成一句意图，例如：“一张明快的非性化古装少女肖像，重点是鲜活眼神与一瞬微笑，不是成人时装硬照。”随后才编译细节。

## 2. 拆分来源，再做五个选择

将来源分成：必须保留的内容、审美目标、画面关系、成像修饰、平台参数。没有被当前用户选中的人物、品牌、剧情和民族外观，不从案例搬入新作品。

1. **一个阅读重心**：人脸、握住的手、鞋面、倒影、衣料或空间结构。不是所有图片都对焦眼睛。人数、取景边界、留白等硬约束放在正文前部。
2. **一个可见瞬间**：谁在做什么、看向何处，身体与其他人的距离怎样。静态中的动态写成发丝方向、褶皱惯性、局部拖影；“镜头随后推进、门再打开”等时序留给视频。
3. **一种相容的摄影组织**：机位、距离、景别、焦点、背景可读程度。近景也能留白，全身也能浅景深，但不能同时要求极近脸部裁切和双脚完整。
4. **主次清楚的光色与材质**：暖主光与冷轮廓光各自落在不同区域；肤色、服装、环境分离。让丝绸、羊毛、皮肤和金属保留不同反应，而不是统一涂亮。
5. **少量成像特征**：选当前审美确实需要的颗粒、光晕、色彩、运动柔化。相机/胶片名称可保留为创作参照，但配上可见结果；不许承诺精确复制其物理响应。

成稿是几段有主次的自然语言，不必填满所有槽位，也不规定统一字数。保留有效的原句；只有冲突、歧义、重复和当前作品不需要的内容才删改。最后加少数有针对性的限制，不附一页通用反向词。

## 3. 常见迁移冲突怎么处理

| 来源写法/意图 | GPT改写决策 |
| --- | --- |
| `8K, ultra realistic, photorealistic`重复堆叠 | 保留明确媒介和必要质感；交付像素由所选API实际参数控制，不能用正文“8K”冒充8K文件 |
| `Kodak Ektachrome`、`Portra`、`Vision3`、某相机/镜头 | 可保留为审美目标，再写色板、高光、阴影和柔化；不声称参考图真的使用它们，名称不等于模型实现了仿真 |
| `85mm`同时写`wide-angle perspective` | 从画面意图选一个距离/透视方案。宽画幅不等于广角；`full frame`先区分全画幅传感器还是全身入画 |
| `barefoot wearing sandals` | 裸足与穿鞋二选一；对作品有影响且意图不明时简短问清，不把矛盾原样提交 |
| 真实摄影同时写动漫/游戏人物 | 区分题材与媒介：可做真人扮演的幻想人物，也可做动漫。用户已有明确媒介就按它改写，不擅自移除幻想设定 |
| `matte porcelain skin`又要自然皮肤 | 表达细腻肤色、柔和转面和轻微自然变化；瓷器比喻不是无纹理的硬壳，也不靠粗毛孔“纠正”它 |
| 180°快门、运镜、gate weave写入单张图 | 保留可见的瞬间运动痕迹；跨帧抖动/轨迹留给视频，不承诺单张图证明时间行为 |
| 光晕、色差、颗粒、雾、漏光、暗角全开 | 按场景取最相关的几项并限定位置；不要让人物、环境、曝光都被统一脏滤镜吞没 |
| `sharp eyes`与`missed focus / camera shake` | 若用户明确要抓拍失误，允许脸轻微软化但表情可读，主要拖影落在移动衣袖/发丝；不能又要求全脸刀锐 |
| 中央完全留白，同时多人拉手穿过画心 | 人物、伸出的手、树和亮点都安排在边缘；中央保持低对比连续背景，留白不是黑洞，也不自动画音频可视化器 |
| 仅剑光、衣袖、散景等修饰片段 | 先补当前作品已有的主体与场景再使用；不把素材片段当完整生成请求，更不自创无关剧情 |
| `--ar` / `--s` / `--chaos` / `--sref`等MJ标记 | 只有实际出现时才移除/翻译；尺寸映射到已核实的GPT接口，风格权重/参考代码不能直接转成数值字段，未知代码不猜图像 |

十六进制色可作为设计锚点，例如珊瑚色衣料，但照片中的高光与阴影仍须随受光变化，不把物体涂成全域相同的色票。历史题材标为“朝代启发”或“架空古风”；未经考证不把混合冠饰、花钿与衣型称为严格复原。

## 4. 五种可复用配方

下列为原创迁移示范，均须按用户当前角色与用途重写；不是新增官方模型模板，也不代表已全部实测。

### A. 清透美妆／细腻但不塑料

适用：用户明确要柔和、精致的成年人物肖像。不要将成人美妆或感性时装用语移入少女分支。

> A refined daylight beauty editorial of an adult woman with her established facial features and age preserved. Close framing, a relaxed gaze and a quiet, unforced expression. Soft ivory light from a large window beside the camera creates gentle facial volume, with a luminous shadow cheek rather than flat front lighting. Subtle peach tones, softly defined brows, natural skin color variations and a small touch of lip gloss. Her eyes remain the point of attention; fine loose hairs, the ear and the background gradually soften. A warm cream backdrop and a brown knitted neckline make the face feel fresh and alive. Delicate photographic texture, elegant rather than clinical, no text.

### B. 非性化古装少女／明快神态

适用：来源明确为adolescent。保留青少年年龄段，不暗改为成人，也不套性感、成人身体强调或浓重成熟妆容。青涩不等于婴儿比例，眼神明亮不等于巨大玻璃眼。下面衣饰为宋式启发的造型，不是史实考据结论。

> A lively, innocent cinematic portrait of a teenage Chinese noble maiden in a Song-inspired historical setting, fully clothed in a modest pale-blue and ivory hanfu. A spontaneous sweet smile, a slight head tilt and bright attentive eyes suggest she has just heard something amusing. Soft youthful facial proportions, gently rounded cheeks, a small nose and fine wispy bangs; natural delicate skin, not a porcelain doll. A finely worked floral hairpiece with pearls, peony accents and slender pearl tassel earrings frames her face without hiding it. Chest-up framing in a warm private chamber, with a carved lattice window softly visible behind. Late-afternoon window light warms one side of her face while pale walls softly lift the other. Light silk folds, small pearl highlights and a calm background keep the face lively and clear. Natural, age-appropriate and non-sexual; no text.

### C. 古典舞近景／表情静、衣袖动

适用：克制的成年舞者人像。先决定脸、手与袖的关系，而不是仅写“anatomically correct”。场景属于古风编辑摄影，不默认单一朝代。

> A restrained cinematic editorial portrait of a young adult Chinese classical dancer, caught in one graceful moment rather than posing between movements. Frame from the upper chest to above the hair ornaments, leaving room beside her face for one raised hand. The wrist forms a relaxed continuous curve with the forearm; the separated fingers stop beside her temple without covering her eyes. Her oval face turns slightly away, phoenix-shaped eyes calm and distant, fine willow brows and a small red ruyi-shaped huadian on the forehead. Soft peach makeup and delicate natural skin texture, mostly matte with tiny warm highlights on the cheekbone and nose bridge. Dark emerald hanfu with fine gold embroidery, a gold-and-jade necklace and restrained gold hair ornaments. A warm diffused key light shapes the face; a cool moon-blue rim touches the far hair and shoulder. The face and hand remain readable while the trailing sleeve carries a little directional motion softness. Quiet shadows, shallow but plausible focus, fine film grain; no text.

### D. 复古浪漫抓拍／人物靠边、中央给后期

适用：背景图、音频可视化底图。留白是交付功能，优先于装饰。此例保持最新来源的成年人物年龄与关系；其他项目不继承其国籍、脸或情侣剧情。

> A horizontal romantic editorial photograph with an Ektachrome-inspired 35mm pop-retro palette. Composition is essential: keep the central area open and low-detail for an audio visualizer to be added later; do not draw the visualizer. A 26-year-old American woman occupies the far left third in an intimate near-camera crop, caught mid-spin in a flowing floral summer dress with dusty coral accents. She smiles naturally as loose hair sweeps across part of her face. Her partner, a man around 27–30, is small and softly visible in the distant far-left background, reaching towards her without an arm crossing the open center. Meadow grasses stay low in the frame; an old tree and a small tire swing sit near the far-right edge. The last warm sunset light touches hair and dress beneath a pale lavender-blue twilight sky. Luminous greens, creamy ivory and restrained coral, not a uniform vintage-yellow wash. Directional blur follows the turning dress, loose hair and near grass. Slight handheld softness leaves her expression readable; imperfect edge cropping, fine analog grain and a delicate bloom on bright edges. A few tiny fireflies remain near the darker tree, outside the clear center. Dreamy, warm and spontaneous; no staged kissing, bridal styling, exaggerated expression or text.

这只是背景图构图，不授权生成音乐或可视化动画。手机竖幅等窄画面若无法容纳近脸、双人关系和大留白，应先说明取舍，不机械缩小主体到不可读。

### E. 结构与材料／不把建筑拍成人像

适用：原MD中的藤编隔断、材料研究与空间图。

> Architectural photography of a sculptural rattan partition in a warm limestone interior. At its left end, closely packed horizontal layers form a low bench; across the structure they gradually rise and resolve into slender vertical rods. Show this continuous material transition clearly from a three-quarter viewpoint at standing height. One adult visitor stands beyond the partition solely to establish scale. Side daylight casts readable rod shadows across the pale floor. The rattan has a dry fibrous surface and the stone a quieter, fine-grained finish. Moderate depth of field keeps the bench-to-screen transition legible, with a calm cream-and-honey palette and clean photographic contrast. No decorative haze, no text.

## 5. 已获用户认可的方向样稿：候车室电影人像

2026-10-20，以GPT-Image-2做一次16:9纯文字生图，实际3840×2160。用户看过结果后反馈“已经好多了”，并要求写入Skill和发布；该反馈确认这张样稿的改善方向，不表示27条来源、全部配方或视频连续性都已验证。以下是该次实际提示词，供学习写法；人物年龄、短发、围巾、候车室、焦段与色板都只是此例，不成为其他作品默认。

> A tender, quietly beautiful moment from a contemporary East Asian arthouse film, captured as a 35mm color-negative film still. A 26-year-old East Asian woman waits alone in an old railway waiting room. She has a short, slightly tousled black bob, a dusty burgundy wool scarf and a soft grey-green cotton coat. Her face is delicate but individual, with naturally luminous skin and a relaxed mouth. Someone outside has just caught her attention: her eyes turn towards the platform off frame right, her chin has barely begun to follow, a trace of recognition in her expression. Candid and emotionally present, not posing for a portrait.
>
> Horizontal chest-up framing, camera at her eye level, her face just right of center. An old window and a sliver of pale platform occupy the left; a wooden bench recedes behind her. A softly out-of-focus window jamb grazes the near left edge, creating a sense of watching from inside the room. The place remains recognizable.
>
> Late afternoon ivory window light from camera left wraps gently across her face, with a slender warm edge on a few loose hairs. The shadow cheek stays softly luminous from the room's natural reflected light. Warm peach skin, creamy highlights, muted burgundy, weathered neutral wood and cool blue-grey distance. Her nearer eye and eyelashes are clear; the far cheek, scarf edges and room fall gradually softer, like a 65mm cinema portrait lens. Fine skin color variations and a tiny natural lip sheen, tactile wool fibers against the smoother worn cotton. Supple highlight roll-off, gentle optical softness and delicate, unobtrusive film grain. Keep the face fresh and graceful without airbrushing it into plastic. One complete cinematic frame, no collage, no text.

复用的是先定温柔电影一瞬，再让视线/松弛嘴部、人物与窗口的位置、环境反光、冷暖距离及不同织物共同支撑它。用自然肤色变化和柔和体积保持吸引力，不追加整脸粗毛孔。此次未传旧图，因此人物外观与构图变化不能算锁脸改善；也不是严格单变量A/B。实际样稿面部高光和微纹理仍略偏硬，后续可按反馈局部调整，不因一个好结果把整个方法写成效果保证。

## 6. 多模态参考与四宫格

- 好提示词不保证跨模型同质；保留原文与本次改写，记录哪些变量改变。若旧图本身带有不想要的肤色/油亮/锐化，重复把它作为整幅编辑目标可能继续携带这些特征。用户允许重新设计时可做一次不带旧图的文字方向测试；这是新演员外观/新构图的可能来源，不是严格锁脸对比。
- 用户要求保留人物或布局时仍须保留相应参考，明确各图职责并核验实际输入；不能为了画质擅自换人。画质参考与身份参考并不保证可完全解耦。
- 要四宫格时，把一份共享的审美、光线、服装、肤色和成像段放在前面，再写四个连续状态。不要四格各自套一个美妆/抓拍/舞台配方；沿用[四宫格规则](four-panel-motion-storyboards.md)的4K整板、按运镜复杂度选用与真实像素核验。
- 静态样稿只证明这张图的结果。单张质感变化不证明锁脸、四格连续性或视频运动改善；不默认接着生成四宫格或视频。

## 7. 提交与检查

沿用Partner的路线核对、官方参数、请求预览、稳定idempotencyKey与实际文件检查；不创造`style_strength`等不存在的字段。按当前授权生成有限样稿，查看返图后报告：整体审美是否到位、表情/动作是否自然、空间与光线是否相容、留白是否满足用途、质感是否被夸大。尺寸单独核验；提示词写4K不算4K交付。不要自动审美打分或无限付费重生，不把“写入Skill”说成“所有配方效果已验证”。
