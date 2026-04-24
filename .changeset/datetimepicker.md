---
'@timeui/react': minor
---

feat(datetimepicker): add DateTimePicker with optional minute/second granularity

新增 `DateTimePicker` 组件，在 `DatePicker` 基础上并排 `TimePanel`（小时 / 分钟 / 秒滚动列）。`showMinute`（默认 true）与 `showSecond`（默认 false）按需开放分 / 秒粒度——被关闭的字段在 value 中恒为 0；支持 `use12Hours`、`hourStep` / `minuteStep` / `secondStep`、`Now` / `Clear` / `OK` 底部按钮；`defaultDateTimeFormat` / `defaultDateTimeParse` 与 24h / 12h 模式自适配。
