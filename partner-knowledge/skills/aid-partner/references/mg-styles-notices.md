# MG 方法来源、许可与验证范围

## 来源

- 上游：Vincentwei1021 / [mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15)。核验日期：2026-10-22。
- 固定研究版本：[49052d80bfaf9fa8412cc9710530e5e95a3b8d8c](https://github.com/Vincentwei1021/mg-styles-15/tree/49052d80bfaf9fa8412cc9710530e5e95a3b8d8c)。后续上游变动不自动纳入。
- 研究范围：[15 份风格提示](https://github.com/Vincentwei1021/mg-styles-15/tree/49052d80bfaf9fa8412cc9710530e5e95a3b8d8c/prompts)、README、template.md、rubric.md、harness/render.mjs、lib/audio/README.md、assets/fonts/README.md 与 3D 示例说明。阅读源码与文档不等于已运行示例或核验所有成片。
- [上游 MIT 许可证](https://github.com/Vincentwei1021/mg-styles-15/blob/49052d80bfaf9fa8412cc9710530e5e95a3b8d8c/LICENSE)。保留以下版权与许可文本。

## AIDP 的改写与边界

本次将风格特征、内容驱动转场、确定性逐帧制作、授权范围内的声音锚点方法改写为 [MG 指南](mg-motion-design.md)和[方法卡](mg-style-catalog.md)，加入与现有 AIDP 制作流程的分工与原创应用例。并非 AIDP 独立发明全部上游方法，也不是对原案例的改名复刻。

没有导入上游示例影片、原始品牌案例、字体、照片、纸纹、声音采样、HDRI、可执行程序或依赖。没有采用上游自动评委/评分重做循环，也没有继承固定时长、BPM、输出规格、必加音乐或必装软件。此模块不改变默认模型/工作流，不新增 MCP 字段或 App 模板。

上游声明部分素材为 CC0/公有领域，字体及其衍生资产存在独立许可，代码依赖也有各自许可；MIT 不覆盖一切第三方素材。实际复用前逐件检查原始来源、许可证、署名和再分发要求，不能只引用本页作为许可证明。不要打包用户私人素材、原始提示词库或认证配置。

当前验证限于文档路由、知识包结构、既有规则保留及测试中的临时安装/回退；不宣称 15 套动效已在用户设备渲染、达到某审美分数或完成逐一验收。液态仅收录参考，不推翻既有试验排除。需要实片时在用户明确制作要求内逐项核验依赖、资产与效果。

## MIT License（上游保留）

Copyright (c) 2026 Vincentwei1021

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
