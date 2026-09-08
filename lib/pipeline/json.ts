import { ProviderModelRefusalError } from './providerPayload';

function tryParseJson(text: string): any | undefined {
  try {
    return JSON.parse(text.trim());
  } catch {
    return undefined;
  }
}

// Find the first complete JSON value while respecting nested arrays/objects and
// braces inside strings. The opening token decides the outer shape, so a valid
// one-item array is never accidentally reduced to its inner object.
function findFirstJsonValue(text: string): any | undefined {
  for (let start = 0; start < text.length; start += 1) {
    const opening = text[start];
    if (opening !== '[' && opening !== '{') continue;

    const stack: string[] = [opening];
    let inString = false;
    let escaped = false;

    for (let end = start + 1; end < text.length; end += 1) {
      const char = text[end];
      if (inString) {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === '"') inString = false;
        continue;
      }

      if (char === '"') {
        inString = true;
        continue;
      }
      if (char === '[' || char === '{') {
        stack.push(char);
        continue;
      }
      if (char !== ']' && char !== '}') continue;

      const expectedOpening = char === ']' ? '[' : '{';
      if (stack[stack.length - 1] !== expectedOpening) return undefined;
      stack.pop();
      if (stack.length) continue;

      const parsed = tryParseJson(text.slice(start, end + 1));
      if (parsed !== undefined) return parsed;
      // Skip the entire invalid container, never reinterpret one of its
      // children as the requested document.
      start = end;
      break;
    }
    // An unfinished outer object/array owns everything after its opening.
    // Searching inside it used to turn a truncated {shots:[...]} into shot 1.
    if (stack.length) return undefined;
  }
  return undefined;
}

// 从 LLM 返回的自由文本里健壮地提取最外层 JSON（对象或数组）。
// 兼容 markdown 代码块围栏、前后多余文字、以及常见的模型「多嘴」输出。
export function extractJson(text: string): any {
  const t = String(text || '').trim();

  const direct = tryParseJson(t);
  if (direct !== undefined) return direct;

  const fencedBlocks = t.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi);
  for (const match of fencedBlocks) {
    const fenced = tryParseJson(match[1]) ?? findFirstJsonValue(match[1]);
    if (fenced !== undefined) return fenced;
  }

  const embedded = findFirstJsonValue(t);
  if (embedded !== undefined) return embedded;

  // Only a standalone refusal counts. Valid screenplay JSON may legitimately
  // contain these words as dialogue; never interpret that as provider policy.
  if (/^(?:I'm sorry[,，]?\s*|I am sorry[,，]?\s*|Sorry[,，]?\s*)?I (?:can(?:not|'t|’t)|am unable to) (?:assist|help|comply) (?:with )?(?:that|this|your|the) request[.!。]?$/i.test(t)
    || /^(?:抱歉[，,。]?\s*)?(?:我)?(?:无法|不能)(?:协助|帮助|满足|处理)(?:您|你)?的?(?:这个|该|此)?请求[。.!]?$/.test(t)) {
    throw new ProviderModelRefusalError(t, t);
  }
  throw new Error(`No valid JSON in AI response (${t.length} chars): ${t.slice(0, 300)}`);
}
