/**
 * @author Ryan He
 * @date 2026-04-18
 * @description 客户端 SSE 流解析器：把 `/api/assistant` 的 Response body 拆成结构化 AssistantEvent 序列。
 *   专注 event + data 两种字段，忽略 id/retry，够用即可。
 */

export interface AssistantRefComponent {
  slug: string;
  title: string;
  href: string;
}

/** 服务端推送的事件联合；与 API route 中的 writer.send 名称一一对应。 */
export type AssistantEvent =
  | { type: 'delta'; text: string }
  | { type: 'tool_use'; name: string; input: unknown }
  | { type: 'tool_result'; name: string; summary: string }
  | { type: 'refs'; components: AssistantRefComponent[] }
  | { type: 'error'; message: string; code?: string }
  | { type: 'done' };

interface RawSSEFrame {
  event: string;
  data: string;
}

/** 把一段 SSE 裸块（以 `\n\n` 分隔）解析成 {event, data}。 */
function parseFrame(block: string): RawSSEFrame | null {
  let event = 'message';
  const dataLines: string[] = [];
  // 兼容 CRLF / LF 两种换行。
  for (const line of block.split(/\r?\n/)) {
    if (!line || line.startsWith(':')) continue; // 注释 / 心跳
    const colon = line.indexOf(':');
    if (colon < 0) continue;
    const field = line.slice(0, colon);
    // SSE 规范：冒号后可选一个空格。
    const value = line.slice(colon + 1).replace(/^ /, '');
    if (field === 'event') event = value;
    else if (field === 'data') dataLines.push(value);
  }
  if (dataLines.length === 0 && event === 'message') return null;
  return { event, data: dataLines.join('\n') };
}

function toAssistantEvent(frame: RawSSEFrame): AssistantEvent | null {
  const raw = frame.data;
  // done 可能是空对象，其它事件都带 JSON。
  let parsed: unknown = null;
  if (raw.length > 0) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      // 非 JSON 的 delta 也当作纯字符串处理，向后兼容。
      if (frame.event === 'delta') return { type: 'delta', text: raw };
      return null;
    }
  }
  const obj = (parsed ?? {}) as Record<string, unknown>;

  switch (frame.event) {
    case 'delta':
      return { type: 'delta', text: typeof obj.text === 'string' ? obj.text : '' };
    case 'tool_use':
      return {
        type: 'tool_use',
        name: typeof obj.name === 'string' ? obj.name : 'unknown',
        input: obj.input ?? {},
      };
    case 'tool_result':
      return {
        type: 'tool_result',
        name: typeof obj.name === 'string' ? obj.name : 'unknown',
        summary: typeof obj.summary === 'string' ? obj.summary : '',
      };
    case 'refs': {
      const components = Array.isArray(obj.components)
        ? (obj.components as AssistantRefComponent[]).filter(
            (c) => c && typeof c.slug === 'string' && typeof c.href === 'string',
          )
        : [];
      return { type: 'refs', components };
    }
    case 'error':
      return {
        type: 'error',
        message: typeof obj.message === 'string' ? obj.message : 'Unknown error.',
        code: typeof obj.code === 'string' ? obj.code : undefined,
      };
    case 'done':
      return { type: 'done' };
    default:
      return null;
  }
}

/**
 * 消费 Fetch Response 的 SSE body。
 * AbortController 挂在上游 fetch 即可；此生成器本身不管取消 —— reader 会因 abort 抛 error。
 */
export async function* parseAssistantStream(
  response: Response,
): AsyncGenerator<AssistantEvent, void, void> {
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // SSE frame 以两个换行为分界（CRLF 或 LF 都兼容）。
      let sep = findFrameBoundary(buffer);
      while (sep >= 0) {
        const chunk = buffer.slice(0, sep);
        // 跳过分隔符本身（可能是 `\n\n` 或 `\r\n\r\n`）。
        const skip = buffer.startsWith('\r\n\r\n', sep)
          ? 4
          : buffer.startsWith('\n\n', sep)
            ? 2
            : 2;
        buffer = buffer.slice(sep + skip);
        const frame = parseFrame(chunk);
        if (frame) {
          const evt = toAssistantEvent(frame);
          if (evt) yield evt;
        }
        sep = findFrameBoundary(buffer);
      }
    }
    // flush 残余（通常不会有：服务端结束会发 done + close）。
    buffer += decoder.decode();
    if (buffer.trim().length > 0) {
      const frame = parseFrame(buffer);
      const evt = frame ? toAssistantEvent(frame) : null;
      if (evt) yield evt;
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // reader 可能已被 abort 释放；忽略。
    }
  }
}

function findFrameBoundary(buf: string): number {
  // 优先匹配 `\n\n`；也兼容 `\r\n\r\n`。
  const a = buf.indexOf('\n\n');
  const b = buf.indexOf('\r\n\r\n');
  if (a < 0) return b;
  if (b < 0) return a;
  return Math.min(a, b);
}
