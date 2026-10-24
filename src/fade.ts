/** A reversible opacity transition; camera coordinates never pass through it. */
export class OpacityFade {
  private from: number;
  private target: number;
  private started = -Infinity;
  constructor(initial: number) {
    this.from = initial;
    this.target = initial;
  }
  value(now: number): number {
    const t = Math.max(0, Math.min(1, (now - this.started) / 160));
    return this.from + (this.target - this.from) * t * t * (3 - 2 * t);
  }
  set(target: number, now: number, immediate: boolean): void {
    if (target === this.target) return;
    this.from = immediate ? target : this.value(now);
    this.target = target;
    this.started = now;
  }
  active(now: number): boolean {
    return this.from !== this.target && now - this.started < 160;
  }
}
