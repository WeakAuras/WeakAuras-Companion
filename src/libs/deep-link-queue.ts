export const rendererReadyChannel = "rendererReady";

export function createDeepLinkQueue(deliver: (link: string) => void) {
  let rendererReady = false;
  let flushing = false;
  const pendingLinks: string[] = [];

  function flush() {
    if (!rendererReady || flushing) return;

    flushing = true;
    try {
      while (rendererReady && pendingLinks.length > 0) {
        const link = pendingLinks[0];
        if (link === undefined) break;
        deliver(link);
        pendingLinks.shift();
      }
    } finally {
      flushing = false;
    }
  }

  return {
    enqueue(link: string) {
      if (!link) return;
      pendingLinks.push(link);
      flush();
    },
    markReady() {
      rendererReady = true;
      flush();
    },
    markNotReady() {
      rendererReady = false;
    },
  };
}
