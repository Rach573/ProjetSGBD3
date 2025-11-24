// Thin wrapper around the preload bridge for legacy callers.
// Prefer using the newer composables in `useMail*` going forward.

export async function fetchMails(): Promise<unknown[]> {
  if (window.electronService.mail.invokeGetAllMails) {
    return await window.electronService.mail.invokeGetAllMails();
  }
  return [];
}

export async function updateMailStatus(id: number, status: string): Promise<never> {
  throw new Error(`Mail status updates are no longer supported (id=${id}, status=${status}).`);
}
