# 本地后期模块的来源与许可

本模块参考 [kajisho5/ffmpeg-skill](https://github.com/kajisho5/ffmpeg-skill) 的素材探测、码流复制与精确裁切区分、结构化处理记录、交付检查与视觉检查分离等方法，按 AID Partner 已有制作和放行契约重写。

- 核验日期：2026-10-25；固定提交：[f2d90ea603a663711c3d6aa9775d2a2380d83182](https://github.com/kajisho5/ffmpeg-skill/tree/f2d90ea603a663711c3d6aa9775d2a2380d83182)。
- 对照文件：`SKILL.md`、`scripts/cut.py`、`join.py`、`fit.py`、`loudness.py`、`check.py`、`references/gotchas.md`和`LICENSE`。
- 本知识包不包含上游脚本、MCP服务、安装器、平台模板或媒体；没有运行上游42个工具的完整测试，不宣称这些工具已经装入Partner。
- 未采用上游的宽泛自动触发、固定处理链、默认交叉淡化、按倍率默认裁切/变速、平台默认字幕/响度和禁止原生FFmpeg替代路径等约定。AIDP依本片授权、当前宿主能力和真实交付要求选择执行方式；保留原有字幕/包装/声音边界和最终成片登记。

上游以 MIT 发布，保留原声明：

```text
MIT License

Copyright (c) 2026 kajisho5

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
