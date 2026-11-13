import { flushSync } from 'react-dom';

function findCover(id: string) {
  return document.querySelector<HTMLElement>(`[data-cover="${CSS.escape(id)}"]`);
}

export async function moveCover(from: string, to: string, update: () => void, reduceMotion: boolean) {
  const source = findCover(from);
  if (reduceMotion || !document.startViewTransition || !source) {
    update();
    return;
  }

  const root = document.documentElement;
  let destination: HTMLElement | null | undefined;
  let landingCover: HTMLElement | null | undefined;
  root.dataset.vaultTransition = '';
  source.style.viewTransitionName = 'vault-cover';

  try {
    const transition = document.startViewTransition(() => {
      source.style.removeProperty('view-transition-name');
      flushSync(update);
      const cover = findCover(to);
      const stackLanding = cover?.parentElement?.querySelector<HTMLElement>('[data-stack-landing]');
      destination = stackLanding ?? cover;

      // Keep the real cover in the stack snapshot so books above it can occlude it.
      if (cover && stackLanding) {
        landingCover = cover;
        landingCover.dataset.stackReturnCover = '';
        root.dataset.vaultTransition = 'stack-return';
      }

      if (destination) destination.style.viewTransitionName = 'vault-cover';
    });

    await transition.finished;
  } finally {
    delete root.dataset.vaultTransition;
    source.style.removeProperty('view-transition-name');
    destination?.style.removeProperty('view-transition-name');
    landingCover?.removeAttribute('data-stack-return-cover');
  }
}
