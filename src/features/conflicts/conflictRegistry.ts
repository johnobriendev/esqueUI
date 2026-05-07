type Resolution = 'keep_mine' | 'take_theirs' | 'cancel';

const pending = new Map<string, (resolution: Resolution) => void>();

export const waitForResolution = (id: string): Promise<Resolution> =>
  new Promise((resolve) => {
    pending.set(id, resolve);
  });

export const settle = (id: string, resolution: Resolution): void => {
  const resolve = pending.get(id);
  if (resolve) {
    pending.delete(id);
    resolve(resolution);
  }
};
