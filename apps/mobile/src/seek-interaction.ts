export type SeekAction = { type: 'ignore' } | { type: 'preview' | 'seek'; position: number };
const ignored: SeekAction = { type: 'ignore' };

/** Android accessibility/keyboard changes emit value-change without touch
 * start/end. Touch drags preview until release; non-touch changes seek at once.
 * Every callback belongs to the native slider mounted for one recording. */
export class SeekInteraction {
  private track: string | null = null;
  private visible = false;
  private dragging: string | null = null;

  configure(track: string | null, visible: boolean) {
    if (track !== this.track || visible !== this.visible) this.dragging = null;
    this.track = track; this.visible = visible;
  }

  private accepts(track: string | null, position: number): boolean {
    return this.visible && track !== null && track === this.track && Number.isFinite(position);
  }

  start(track: string | null, position: number): SeekAction {
    if (!this.accepts(track, position)) return ignored;
    this.dragging = track;
    return { type: 'preview', position };
  }

  change(track: string | null, position: number): SeekAction {
    if (!this.accepts(track, position)) return ignored;
    return { type: this.dragging === track ? 'preview' : 'seek', position };
  }

  complete(track: string | null, position: number): SeekAction {
    if (!this.accepts(track, position) || this.dragging !== track) return ignored;
    this.dragging = null;
    return { type: 'seek', position };
  }
}
