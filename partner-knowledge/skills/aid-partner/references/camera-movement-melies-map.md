# Melies 运镜目录映射与转译示范

用于用户点名运镜、比较相近名称或需要车辆/主体固定、滚转、产品展示等视点时，作为[运镜决策](camera-movement-story-decisions.md)、[技法速查](camera-movement-vocabulary.md)与[提示词编译](camera-movement-prompt-craft.md)的检索补充。优先从观看任务、主体动作和空间约束选择；不把整张目录塞进 prompt，也不因术语加入新模型参数。

## 同名之外：先说清谁在运动

| 意图 | 摄影与对象 | 需要读清的结果 | 不宜混淆 |
| --- | --- | --- | --- |
| 物理靠近 | 固定焦段下摄影机向主体移动 | 前景遮挡和远近层关系随路径改变 | 机位不动的光学变焦 |
| 画角收紧 | 机身不走位、焦距逐渐变长 | 取景范围变小；固定相机的几何透视关系保持 | 摄影机穿过前景或绕开柱子 |
| 人物大小不变而空间变化 | 机身前进/后退与反向变焦配合 | 主体画面大小近似不变，背景透视随机位改变 | 普通放大或主体也明显缩放 |
| 从人物背后进入空间 | 摄影机跟在人物后方，匹配其路线与距离 | 背影和前方路线上逐步显露的信息 | 侧向跟拍，或相机绑在身体上朝向面部 |
| 固定在运动载体 | 摄影机与人物、车厢或物件共同移动 | 载体在画内相对稳定，环境可随载体运动改变 | 世界坐标里的固定机位；每种固定方式的构图不相同 |
| 产品自转展示 | 转盘带动产品，摄影机按需要固定或独立运动 | 明确产品旋转方向、可见面的变化和背景是否移动 | 摄影机绕静止产品一周 |
| 画面失衡 | 摄影机绕光轴旋转一定角度 | 地平线随时间转动，人物是否随之移动由场景决定 | 单纯一开始就是倾斜的Dutch angle |

速度、角度与距离按镜头需要决定；固定构图、缓动、自然手持、弧线及强效果都不是通用默认。关键动作/表情要在景别、焦点与时间里可辨；甩镜的模糊段不要承载唯一证据。高难度推拉变焦、穿越、长距离环绕和高速动作需以实际样片检查，不保证模型能按词语精确执行。

## 目录别名索引（2026-10-28）

来源目录列出86个标签，混合方向变体、设备、画面效果和应用场景，并不等于86种互斥运动。以下仅保留英文索引用于查找；未读取的子页或未确认含义的专有名，以原站为准，不猜定义。

- 焦距/尺度：Slow Zoom In、Slow Zoom Out、Crash Zoom In、Crash Zoom Out、Zoom、Rapid Zoom In、Rapid Zoom Out、YoYo Zoom、Eyes In、Mouth In、Eating Zoom。
- 推拉/移动变焦：Dolly In、Dolly Out、Push In、Pull Out、Super Dolly In、Super Dolly Out、Dolly Zoom、Dolly Zoom In、Dolly Zoom Out、Dolly。
- 固定点转向：Pan Left、Pan Right、Pan、Tilt Up、Tilt Down、Tilt、Whip Pan、Whip Tilt。
- 平移/升降：Dolly Left、Dolly Right、Trucking、Slider Shot、Pedestal Up、Pedestal Down、Crane Up、Crane Down、Crane Over、Crane Over The Head、Jib Shot、Jib Down、Jib Up。
- 弧线/姿态：360-Degree Orbit、Arc Left、Arc Right、Arc、Camera Roll、Dutch Roll、3D Rotation、Omnidirectional、Parallax、Falling、Wandering。
- 跟随/固定：Tracking Shot、Follow Shot、Steadicam、Handheld、Gimbal Shot、Double Dolly、SnorriCam、Locked-On、Walk and Talk、Choreo、Head Tracking、Hero Cam、Wiggle、Static Locked-Off、Fixed Cam。
- 空中/穿越/时间：FPV Drone、Aerial Pullback、Aerial Push In、Aerial、Hyperlapse、Earth Zoom、Pass Through、Through Object In、Through Object Out、Flying Cam Transition。
- 设备/车与产品：Lazy Susan、Bolt Cam、Robo Arm、Conveyor、Buckle Up、Car Chasing、Car Grip、Road Rush。

## 原创局部示范

这些是不同叙事意图下可转译进本片的局部描述，时长、景别、角色、物体及声音按实际需要调整，不是完整H3模型稿或已验证样片。

1. **跟随入室**：镜头位于人物后方肩部高度，与人物保持约一臂距离，人物推门前行时相机同步前进；门框遮挡逐渐退开，依次显露室内长桌和桌边空椅。人物停步后相机在门内保留背影与空椅同框，让进入空间的结果可读。
2. **车内视点**：镜头相对副驾驶位置固定，保持驾驶者侧脸与侧窗同框；车沿道路前行时驾驶者在车厢中的位置不变，窗外树木和路灯依车速向后移动。人物听到声音后转头，转向时仍能读清其表情；不切为车外追拍。
3. **产品自转**：镜头固定平视产品，主体在转盘上缓慢转过约90°，使原本背面的结构逐渐可见；背景、相机和光源位置保持，材质高光随产品旋转连续改变。
4. **推拉变焦的惊觉**：人物意识到门后威胁，摄影机缓慢后退，镜头同步变焦收紧，人物头部大小尽量保持，背景透视逐渐改变，焦点保持在脸上；反应读清后转入下一拍。结果需实际查看，画面单纯放大不算同一效果。

## 来源与验证

2026-10-28用户要求吸收 [Melies Camera Movement](https://melies.co/cinematic-techniques/camera-movement)。此前Partner已于2026-09-28引用该站部分术语；本次核对目录与部分可访问条目，补充命名映射、运动参照系与原创示范。部分子页访问超时、动态示例未逐一观看，不声称全部86项都已理解或重现。未分发网站素材、复制原站提示词或将教程导入真实提示词案例库；未生成样片，也未变更模型、工具、默认路线或用户授权。
