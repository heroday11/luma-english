# 词境 WordTrail

面向中文学习者的英语学习应用：真题词汇、FSRS 复习、听读、录音回放，以及 DeepSeek Harness 驱动的 AI 老师。

## 启动

在本机双击 `启动词境.cmd`，访问 http://127.0.0.1:8765/ 。界面左侧的「AI 老师」提供阅读、词汇、写作、情景对话、学习诊断和复习迁移六种方式。

首次配置 AI：双击 `配置AI老师.cmd`，在本机输入 DeepSeek 官方 API Key。Windows 使用当前用户的 DPAPI 加密保存，文件位于 `.study-data/ai-config.local.json`。更换 Windows 用户或电脑后需要重新配置。也支持服务器进程的 `DEEPSEEK_API_KEY` 环境变量。不要把密钥写进源代码或发到聊天里。

配置完成后在 AI 老师页刷新状态，登录词境账号，建立学习会话并发送消息。配置存在不等于密钥已通过官方验证；第一次真实请求会检查实际可用性。模型默认 `deepseek-flash`，通过官方 DSH Messages 适配器调用。

在新机器安装依赖：Node.js 24 或更新的兼容版本、Python 3.11；运行 `npm ci --ignore-scripts` 和 `python -m pip install -r requirements.txt`。按用户最新要求已恢复完整 `@deepseek-ai/dsh` npm 依赖。教学 profile 仍仅启用教学工具；完整依赖存在不代表桌面应用已安装，未验证的原生终端组件仍需按官方说明配置。

## 目录

- 根目录：现有词汇界面、音频、记忆算法及本机 Python 服务；保留数据生成脚本的相对路径。
- `tutor.js`、`tutor.css`：AI 老师界面。
- `tutor_backend.py`：账号隔离的会话、重试去重、独立小测和 DSH 调用。
- `integrations/dsh/`：固定版本的运行时适配、教学配置、密钥配置工具、两道人工编写的阅读小测。
- `packages/dsh-wordtrail/`：两个 Cordis 插件，提供课程查询、学习上下文和时间规划。
- `.dsh/skills/`：六项可被 DSH 原生发现、按需加载的英语教学 Skill。
- `tests/`：教学服务、HTTP 边界及真实 DSH 加载流程测试。
- `docs/`：插件选型及本次整理说明。
- `.study-data/`：账号数据库、教学数据库、加密密钥、DSH 会话记录。不可发布或提交。
- `.study-audio/`：学习音频缓存。
- 旧归档、构建缓存和调试资料已经移至项目外的 `../english-backups/2026-10-09-size-reduction/`；恢复清单保留。
- 词典生成脚本的新下载缓存默认存放在 `%LOCALAPPDATA%/WordTrail/dictionary-cache`，可用 `WORDTRAIL_DICTIONARY_CACHE` 指定。网页使用项目内已生成的词典，不需要原始构建缓存。

PDF、词典许可、修订映射和原始词汇数据仍然保留。旧 FreeLingo 不是当前应用的运行依赖。

## DSH 组合

截至 2026-10-09，最新官方发布为 `0.2.1-alpha.2`；npm 的 `latest` 标签为 `0.2.0-rc.2`。本项目按用户要求锁定前者，依赖解析保存在 `package-lock.json`，不在启动时静默升级。

Python 服务以固定参数启动 Node 桥接程序，桥接使用官方 `dsh-sdk-protocol`，由官方 `dsh --profile sdk-minimal --patch ...` 加载运行时。已恢复完整 npm 依赖和原始 CLI 接入方式。

教学 profile 只向模型提供 `skill`、`education_context`、`education_lookup_word`、`education_plan` 四个工具。Shell、文件编辑、工作目录切换、额外会话日志上传和插件清单上传被禁用。本机插件实现仍是受信任代码，不是对恶意插件的操作系统沙箱。

每轮最多 4096 输出 tokens、110 秒运行时间；同一会话串行，本机最多两个并发请求，每个会话最多 40 次用户提交。失败保留输入，相同请求编号成功后重试不会再次调用模型。每轮 DSH 使用新的隔离会话，由后端提供最近 12 条已完成消息及必要学习证据；完整聊天保存在本机教学数据库。

独立阅读小测不调用模型。首次提交保存后，另一道新材料复测在 24 小时后开放。首次答案保存在服务端，未来题目在开放前不发送给浏览器。两道题只能提供局部阅读证据，不是完整能力诊断或经过校准的等级测评。

## 隐私与当前边界

AI 老师需要登录词境账号。发送时将当前文字、近期对话、学习目标和经过裁剪的答题表现发送给 DeepSeek 官方 API；不会主动附带账号邮箱、密码、原始账户文件。用户主动输入的个人信息仍会作为消息内容发送。模型调用按官方账户计费。

AI 回复不自动改写 FSRS 卡片或声称达成掌握。现有词汇调度继续独立运行。情景对话目前是文字练习；既有录音仅供回放，没有自动发音评分、连续语音对话或语音识别。

## 验证

运行 `npm run test:tutor`、`npm run test:learning` 和 `python verify_backend.py`。其中 `tests/test_dsh_runtime.py` 启动实际安装的 DSH，以本机模拟 Messages 服务验证 Skill 加载、工具调用、回复和工具边界，不消耗 API 额度。它验证接口集成，不证明真实模型的教学质量。`verify_backend.py` 会检查现有在线语音或其缓存。

真实 DeepSeek 端到端教学需要用户在本机配置有效密钥。尚不能用本机模拟结果宣称官方模型已验证。

## 体积与更新

2026-10-09 曾精简至约 28 MB；随后按用户要求恢复完整 DSH 依赖，当前项目约 507 MB，超过原先 100 MB 目标。旧资料及构建缓存仍留在项目外，精简版配置与依赖保存在 `../english-backups/2026-10-09-size-reduction/slim-runtime/`。运行 `npm run check:size` 会如实报告体积并因超过 100 MB 返回失败。

当前固定版本 `0.2.1-alpha.2` 是核查时最新 alpha 发布；npm latest 为 `0.2.0-rc.2`。项目不会自动升级 DSH。升级时应同步更新三个直接 DSH 依赖和锁文件，再验证 Skill、SDK 与教学调用。官方桌面端是独立应用，其更新检查不会更新此项目 node_modules，也不会自动升级词境页面。
