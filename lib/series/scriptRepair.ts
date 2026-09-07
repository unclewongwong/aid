import type { SeriesShot } from './types';
import { speechSeconds, speechRuntimeSeconds } from '../speechAudioContract';

/** Planning correction, not media QC. Preserve speech/actions and extend a
 * short estimate within the existing single-clip limit before shortening text. */
export function fitScriptDialogueDurations(raw: any, language: string) {
  const result = structuredClone(raw);
  const changes: Array<{ shotNumber: number; from: number; to: number }> = [];
  for (const shot of Array.isArray(result?.shots) ? result.shots : []) {
    const previous = Number(shot?.seconds);
    if (!Number.isFinite(previous) || previous < 2 || previous > 15 || !Array.isArray(shot.dialogue)) continue;
    const lines = shot.dialogue.map((line: any) => typeof line?.text === 'string' ? line.text : '').filter(Boolean);
    if (!lines.length) continue;
    const units = lines.reduce((sum: number, line: string) => sum + (language === 'zh' ? line.length : line.trim().split(/\s+/).length), 0);
    const estimated = speechRuntimeSeconds(lines);
    const seconds = Math.min(15, Math.ceil(Math.max(estimated, units / (language === 'zh' ? 4.2 : 2.4) + 0.8)));
    if (seconds > previous) {
      shot.seconds = seconds;
      changes.push({ shotNumber: Number(shot.number), from: previous, to: seconds });
    }
  }
  return { raw: result, changes };
}

export interface DialogueIssue {
  index: number;
  line: number;
  path: string;
  maxUnits: number;
  unit: string;
  shotNumber?: number;
  characterId?: string;
  originalText?: string;
  reason?: 'timing' | 'ownership';
}

export class ScriptDialogueError extends Error {
  constructor(public issues: DialogueIssue[]) {
    super(`台词超时：${issues.map(i => `第 ${i.index + 1} 镜 ${i.path} 最多${i.maxUnits}${i.unit}`).join('；')}。请缩短普通台词，保留动作反应时间`);
    this.name = 'ScriptDialogueError';
  }
}

export function scriptTimingIssues(shots: SeriesShot[], language: string): DialogueIssue[] {
  const rate = language === 'zh' ? 4.2 : 2.4;
  const units = (text: string) => language === 'zh' ? text.length : text.trim().split(/\s+/).length;
  const issues: DialogueIssue[] = [];
  shots.forEach((shot, index) => {
    const counts = shot.dialogue.map(d => units(d.text));
    const total = counts.reduce((sum, n) => sum + n, 0);
    const budget = Math.floor((shot.seconds - 0.8) * rate);
    const runtime = speechRuntimeSeconds(shot.dialogue.map(d => d.text));
    if (total <= budget && runtime <= Math.min(15, shot.seconds)) return;
    const availableSpeech = Math.min(15, shot.seconds) - 1.8 - Math.max(0, counts.length - 1) * 0.12;
    const spokenSeconds = shot.dialogue.reduce((sum, d) => sum + speechSeconds(d.text), 0);
    const runtimeBudget = Math.floor(total * Math.max(0, availableSpeech) / Math.max(0.8, spokenSeconds) * 0.95);
    const safeBudget = Math.min(budget, runtimeBudget);
    if (safeBudget < counts.length) throw new Error(`第 ${index + 1} 镜台词轮次过多，需调整镜头时长与对白`);
    // Reserve at least one unit per line, then distribute the remaining budget.
    const extra = safeBudget - counts.length;
    shot.dialogue.forEach((_line, line) => issues.push({
      index, line, path: `shots[${index}].dialogue[${line}].text`, shotNumber: shot.number,
      characterId: _line.characterId, originalText: _line.text, reason: 'timing',
      maxUnits: 1 + Math.floor(extra * counts[line] / total),
      unit: language === 'zh' ? '字（含标点）' : '个英文词',
    }));
  });
  return issues;
}

export function checkScriptDialogue(shots: SeriesShot[], language: string): void {
  const issues = scriptTimingIssues(shots, language);
  if (issues.length) throw new ScriptDialogueError(issues);
  checkDialogueOwnership(shots, language);
}

export function applyDialogueRepairs(raw: any, reply: any, issues: DialogueIssue[]) {
  let repairs = reply?.repairs;
  if (!Array.isArray(repairs) && Array.isArray(reply?.shots))
    repairs = issues.map(i => ({ path: i.path, value: reply.shots[i.index]?.dialogue?.[i.line]?.text }));
  if (!Array.isArray(repairs) || repairs.length !== issues.length)
    throw new Error('必须逐项返回所有超时台词的 repairs 数组');
  const result = structuredClone(raw);
  const allowed = new Map(issues.map(i => [i.path, i]));
  for (const repair of repairs) {
    const issue = allowed.get(repair?.path);
    if (!issue || typeof repair.value !== 'string' || !repair.value.trim())
      throw new Error('仅可缩短指定台词，不得重复、删除台词或改动其他字段');
    const count = issue.unit.startsWith('字') ? repair.value.length : repair.value.trim().split(/\s+/).length;
    if (count > issue.maxUnits) throw new Error(`${issue.path} 仍超过 ${issue.maxUnits}${issue.unit}，原稿已保留`);
    if (issue.reason === 'ownership') {
      const source = dialogueWords(issue.originalText || ''), proposed = dialogueWords(repair.value);
      const shared = source.filter(word => proposed.includes(word)).length;
      if (source.length >= 3 && shared / Math.max(source.length, proposed.length) >= 0.65)
        throw new Error(`${issue.path} 只改了错误台词的同义词或虚词；必须根据该角色的职责和本镜动作重写真实含义，不能保留邻镜的第一人称归属`);
    }
    result.shots[issue.index].dialogue[issue.line].text = repair.value;
    allowed.delete(issue.path);
  }
  return result;
}

const dialogueWords = (text: string): string[] => text.normalize('NFKC').toLowerCase().replace(/[’‘]/g, "'").match(/[\p{L}\p{N}]+(?:'[\p{L}]+)?/gu) || [];
function isCopiedLine(shorter: string, original: string): boolean {
  const a = dialogueWords(shorter), b = dialogueWords(original);
  if (a.length < 2 || a.length > b.length) return false;
  let i = 0;
  for (const word of b) if (a[i] === word) i++;
  return i === a.length;
}
export function copiedDialogueShotNumbers(shots: SeriesShot[]): number[] {
  return shots.filter((shot, index) => {
    const previous = shots[index - 1];
    if (!previous || shot.dialogue.length < 2) return false;
    const used = new Set<number>(); let copied = 0, substantial = false;
    for (const line of shot.dialogue) {
      const match = previous.dialogue.findIndex((prior, i) => !used.has(i) && prior.characterId !== line.characterId && isCopiedLine(line.text, prior.text));
      if (match >= 0) { used.add(match); copied++; substantial ||= dialogueWords(line.text).length >= 3; }
    }
    // A single shared phrase or a deliberate same-speaker repetition is not
    // enough. This targets copied exchanges reassigned to different actors.
    return substantial && copied >= 2 && copied >= Math.ceil(shot.dialogue.length * 2 / 3);
  }).map(shot => shot.number);
}
export function checkDialogueOwnership(shots: SeriesShot[], language: string): void {
  const copied = new Set(copiedDialogueShotNumbers(shots));
  if (!copied.size) return;
  const issues: DialogueIssue[] = [];
  shots.forEach((shot, index) => {
    if (!copied.has(shot.number)) return;
    const budget = Math.floor((shot.seconds - 0.8) * (language === 'zh' ? 4.2 : 2.4));
    const count = (text: string) => language === 'zh' ? text.length : text.trim().split(/\s+/).length;
    const total = shot.dialogue.reduce((sum, d) => sum + count(d.text), 0);
    shot.dialogue.forEach((line, i) => issues.push({ index, line: i, path: `shots[${index}].dialogue[${i}].text`, shotNumber: shot.number, characterId: line.characterId, originalText: line.text, reason: 'ownership', maxUnits: 1 + Math.floor((budget - shot.dialogue.length) * count(line.text) / total), unit: language === 'zh' ? '字（含标点）' : '个英文词' }));
  });
  const error = new ScriptDialogueError(issues);
  error.message = `第${[...copied].join('、')}镜把相邻镜头的多句台词复制给了不同角色；需依据当前镜头动作、说话人和叙事作用局部修稿，不能让报幕者说主角的第一人称台词`;
  throw error;
}
