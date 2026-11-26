/** Wait for the reader's bounded capture before leaving it, while allowing a
 * newer tab, link, Back request, import or unmount to cancel that navigation. */
export class NavigationRequests {
  private revision = 0;

  invalidate() { ++this.revision; }

  async afterCapture(capture: () => Promise<unknown> | undefined, navigate: () => void): Promise<boolean> {
    const revision = ++this.revision;
    try { await capture(); } catch { /* Keep navigation available after a bridge failure. */ }
    if (revision !== this.revision) return false;
    navigate();
    return true;
  }
}
