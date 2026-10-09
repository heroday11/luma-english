# 英语教学组件选型

调查日期：2026-10-09。优先核实作者仓库和本次安装版本的官方源码；市场条目仅作线索。

## 已采用

- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness/releases)：安装 `0.2.1-alpha.2`，锁定 npm 依赖。开发者预览版，升级需重新验证 profile 和工具协议。
- [SDK 协议](https://github.com/deepseek-ai/deepseek-harness/tree/dsh-v0.2.1-alpha.2/packages/sdk)：stdio JSON-RPC 的 initialize、session/prompt、session/wait 和 shutdown；不引入第二套 Agent 循环。
- [原生 Skills](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-alpha.2/docs/subsystems/skills.md)：采用 skill、skill-filesystem、tool-skill 组合。项目 Skill 位于 `.dsh/skills/<name>/SKILL.md`，使用 name/description 前置信息，按需加载正文。
- [工具规范](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-alpha.2/docs/cookbook/adding-a-tool.md)：插件导出 name、inject、apply；defineTool 声明参数、规范输出和渲染；文件读取接受 exec.signal 取消。已实现课程内容插件与教学规划插件。
- [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs)：保留项目既有 5.4.2 调度，避免迁移历史记忆卡片。AI 不直接修改稳定度、难度或间隔。
- 已有 edge-tts、本地词典和录音回放继续使用，保持当前学习功能可运行。

## 调查后暂未启用

- [StudyHub](https://github.com/EricWang1358/dsh-web-studyhub)：作者说明支持 DSH 0.2、资料导入、带出处的问题生成、教学流程和 SM-2 复习。适合未来资料导入与出题工作台，但它运行在 DSH Web UI 并拥有自己的资料库和复习状态。直接加入当前词境会产生两套 UI、账号/数据边界和调度。未安装，也没有宣称验证过其 0.2.1-alpha.2 兼容性。后续应先设计有来源的题库交换格式再评估接入。
- [官方 Voice Input bundle](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-alpha.2/packages/experimental/voice-input-bundle/README.md)：此前随完整 DSH 下载；体积精简后已移除，未启用。提供本地 SenseVoice 转写、模型准备和 DSH 自身输入框集成；不是发音评分器，也不会自动为词境页面增加语音对话。需适配词境录音接口及实测英文识别后再启用。
- [Voice Context](https://github.com/CharlesLiuZC/deepseek-harness-voice-context)：提供 FunASR/SenseVoice、faster-whisper 相关集成，是另一套源码/组合路线；先使用官方语音能力的接口，避免同时维护多个 Harness 分支。未安装或运行。
- 官方 dsh-mcp-client：精简后不安装，教学 profile 未挂载。未来可以接受限的词典、语料库或资料检索服务，当前没有需要它才能访问的外部数据源。
- 官方 web-search/web-fetch：当前教学 profile 未启用。现有本地课程可提供确定的来源，开放网络材料需要额外内容质量与版权筛选；未为普通练习增加搜索调用成本。

## 排除的误匹配

[deutsch-lernen](https://github.com/aolingge/deutsch-lernen) 的 DSH 指德国高校德语考试，而不是 DeepSeek Harness。作者仓库是德语资源路线站，不按插件市场的自动分类把它安装为英语教学插件。

## 教育适配

六个自建 Skill 分别负责诊断、阅读、词汇、写作、情景对话、迁移复测。共同约束是：先独立尝试、分级提示、定位错因、修正后换情境，明确帮助程度和证据范围。技能不自动宣布 CEFR 等级，不用转写文本猜测发音，不用 XP 代替学习效果。

这些是可执行的教学约定，仍需有效模型密钥下的实际教学评估。后续以无提示新题表现、延迟保持、任务完成率和帮助次数验证，不以模型回复流畅度作为学习质量证明。

体积精简更新：直接安装所需官方模块，保留同版本；使用官方 app-boot + SDK server 启动教学组合，完整 CLI、Office、终端、Web UI 与语音识别依赖不进入运行项目。

最新状态：用户随后要求恢复完整依赖；当前已恢复官方 CLI 包和 sdk-minimal 启动方式。以上精简记录仅说明曾采用的方案。桌面端单独安装、单独检查更新，不管理本项目 npm 锁定版本。
