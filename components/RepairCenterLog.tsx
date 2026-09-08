'use client';
import type { RepairEvent } from '@/lib/repairCenter';

export default function RepairCenterLog({ events, onRecheck, disabled }: { events: RepairEvent[]; onRecheck?: () => void; disabled?: boolean }) {
  if (!events.length) return null;
  return <details className="my-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 text-xs">
    <summary className="cursor-pointer">修复中枢 · {events.length} 条处理记录</summary>
    <p className="mt-3 text-[var(--text-secondary)]">记录自动处理和停止原因。处理完成仍需通过原阶段校验；记录中的停止不会删除已保存成果。</p>
    <ol className="mt-3 space-y-3">
      {events.slice(-12).reverse().map((event, index) => <li key={`${event.at}-${index}`}>
        <p>{event.status === 'resolved' ? '已恢复' : event.status === 'stopped' ? '已停止' : '处理中'} · {event.scope.replace(/:[a-f0-9]+$/, '')} · {new Date(event.at).toLocaleString()}</p>
        <p className="mt-1 text-[var(--text-secondary)]">{event.reason}{event.attempt > 0 ? `（第 ${event.attempt} 次）` : ''}</p>
      </li>)}
    </ol>
    {onRecheck && events.some(event => event.status === 'stopped') && <button type="button" disabled={disabled} onClick={onRecheck} className="mt-4 rounded border border-[var(--border-color)] px-3 py-2 disabled:opacity-50">已处理原因，重新检查</button>}
  </details>;
}
