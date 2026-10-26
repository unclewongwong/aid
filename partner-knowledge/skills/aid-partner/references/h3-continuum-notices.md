# H3 Continuum 方法来源与许可

2026-10-26，根据用户明确要求融合 [ComfyUI-H3-Continuum](https://github.com/ukr8b3g-cmyk/ComfyUI-H3-Continuum)，固定核对提交 [308653cff108061a94381cef446fef985384b214](https://github.com/ukr8b3g-cmyk/ComfyUI-H3-Continuum/tree/308653cff108061a94381cef446fef985384b214)。它是独立社区节点项目，包含提示词 Skill；本模块不是官方 MiniMax Skill、节点安装包或新模型接口。

## 核对范围与改编

- [H3-Continuum-Skill-v1.zip](https://github.com/ukr8b3g-cmyk/ComfyUI-H3-Continuum/blob/308653cff108061a94381cef446fef985384b214/H3-Continuum-Skill-v1.zip)：实际读取主 Skill、路由契约、连续性、H3/音频与提示词质量说明。
- [V3.9 参考提示词 Skill](https://github.com/ukr8b3g-cmyk/ComfyUI-H3-Continuum/tree/308653cff108061a94381cef446fef985384b214/write-h3-v39-reference-prompts)：固定槽位、逐块绑定、主体与属性归属。
- [舞蹈导演 Skill](https://github.com/ukr8b3g-cmyk/ComfyUI-H3-Continuum/blob/308653cff108061a94381cef446fef985384b214/minimax-h3-continuum-dance-director.zip)：只吸收支撑、重心、余势与摄影机接力的抽象方法。其 NOTICE 声明参考了其他社区项目但未复制其文件；本模块也未导入那些项目的文件、人物或示例。
- 当前 [README](https://github.com/ukr8b3g-cmyk/ComfyUI-H3-Continuum/blob/308653cff108061a94381cef446fef985384b214/README.md)、[用户指南](https://github.com/ukr8b3g-cmyk/ComfyUI-H3-Continuum/blob/308653cff108061a94381cef446fef985384b214/docs/USER_GUIDE.md)、[参考契约](https://github.com/ukr8b3g-cmyk/ComfyUI-H3-Continuum/blob/308653cff108061a94381cef446fef985384b214/docs/V39_REFERENCE_INLINE.md)与[重生成说明](https://github.com/ukr8b3g-cmyk/ComfyUI-H3-Continuum/blob/308653cff108061a94381cef446fef985384b214/docs/REGENERATE_INTENT_V396.md)用于校对旧 Skill 中版本相关内容。
- [实际解析器](https://github.com/ukr8b3g-cmyk/ComfyUI-H3-Continuum/blob/308653cff108061a94381cef446fef985384b214/v2/prompts.py)、constants/version 及 V3.9 参考映射源码用于核对文本路由与标签语义。CPU 解析验证不等于 GPU 生成、连续质量、兼容性或性能验收。

中文规则与修理室示例为本次重新组织编写，接入 Partner 现有条件导航、H3 编译与成段交接。保留中文默认、用户锁定内容、字幕/音乐/包装按要求、原有时长与交付约定。不继承上游英文默认、单人舞者默认、固定块长/动作数/重叠帧、默认 Auto、加速器或 GPU 参数；上游 System Prompt ZIP 只作归档研究，未安装为宿主指令。未分发模型、视频、运行代码或第三方依赖；不会改变现有供应商与运行环境。

## MIT 声明

上游 [LICENSE](https://github.com/ukr8b3g-cmyk/ComfyUI-H3-Continuum/blob/308653cff108061a94381cef446fef985384b214/LICENSE) 为 MIT，保留如下。可选 ComfyUI/加速器仍适用各自许可，知识包不包含它们，见上游 [第三方声明](https://github.com/ukr8b3g-cmyk/ComfyUI-H3-Continuum/blob/308653cff108061a94381cef446fef985384b214/THIRD_PARTY_NOTICES.md)。

```text
MIT License

Copyright (c) 2026 ukr8b3g-cmyk

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
```
