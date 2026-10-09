# 项目整理记录

2026-10-09：以根目录 WordTrail 为唯一运行应用。

已移至 `.archive/2026-10-09-pre-dsh/`：FreeLingo 空克隆目录、FreeLingo 源码副本和 ZIP、OCR 临时环境、PDF 校对截图、中间临时目录、旧 preview 截图、旧审计与优化报告、已不被运行代码引用的 words.json，以及上一轮优化备份。

归档前核对了当前 HTML/JS/Python 引用。原始 PDF、exam_vocab.json、learning-content.json、local-dictionary.json、recovered-content.json、source-review.json、词典许可和生成脚本保留。账号数据库、音频缓存、词典缓存没有迁移或清空。

每个移动项目的原路径和归档路径保存在归档目录 manifest.json。需要恢复时，确认目标不存在，再用 PowerShell Move-Item 将该项目移动回原路径。此轮没有永久删除参考资料。

新增 npm 锁文件、教学模块、DSH 教育插件与 Skill、开发文档和测试。服务改为仅提供明确列出的前端资源，归档、依赖、Python 源码、答案及配置不能通过静态 HTTP 下载。

## 100 MB 体积整理

同日进一步统计：node_modules 478.18 MiB，历史归档 448.60 MiB，词典构建缓存 75.58 MiB，DSH 调试资料 9.74 MiB。

历史 `.archive`、`.dictionary-cache` 和 `.dsh-runtime` 移至项目同级 `english-backups/2026-10-09-size-reduction/`，旧配置位于其中 `previous-config/`；它们不参与运行。新依赖通过锁文件从零安装，93 个包，实际教学集成测试通过。删除项目外旧 node_modules 回滚副本的操作被自动审批策略拒绝，故该副本暂时保留在备份目录，仍占约 478.18 MiB。未删除账号、学习记录、课程、原始 PDF 或历史参考资料。

运行时从完整 CLI 改为官方模块教学组合，减少实际安装依赖，不采用符号链接隐藏体积。使用 `npm run check:size` 检查包含依赖的整个项目。项目外备份仍占磁盘空间，项目瘦身数字不是全部磁盘空间的释放量。

## 恢复完整 DSH

2026-10-09：按用户要求将备份中的完整 node_modules 移回项目，恢复原来的 package.json、锁文件、CLI 桥接和教学覆盖配置。精简版保留在项目外 slim-runtime 目录；runtime.mjs/runtime.yml 保留作参考但不再由当前桥接调用。五项教学集成测试通过。完整依赖重新占用约 478 MiB，100 MB 目标目前不再满足。历史资料和词典原始缓存未移回。
