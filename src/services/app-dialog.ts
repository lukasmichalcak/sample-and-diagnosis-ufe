export type AppDialogKind = 'alert' | 'confirm';

export interface AppDialogRequest {
  id: number;
  kind: AppDialogKind;
  title: string;
  message: string;
  icon: string;
  confirmLabel: string;
  cancelLabel?: string;
}

type DialogResolver = (confirmed: boolean) => void;
type DialogListener = (request?: AppDialogRequest) => void;

let activeRequest: (AppDialogRequest & { resolve: DialogResolver }) | undefined;
let listener: DialogListener | undefined;
let nextDialogId = 1;

export function subscribeAppDialog(nextListener: DialogListener): () => void {
  listener = nextListener;
  listener(activeRequest);
  return () => {
    if (listener === nextListener) {
      listener = undefined;
    }
  };
}

export function showAppAlert(message: string, title = 'Notice'): Promise<void> {
  return openAppDialog({
    kind: 'alert',
    title,
    message,
    icon: 'info',
    confirmLabel: 'OK',
  }).then(() => undefined);
}

export function showAppConfirm(message: string, title = 'Confirm'): Promise<boolean> {
  return openAppDialog({
    kind: 'confirm',
    title,
    message,
    icon: 'help',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
  });
}

export function closeAppDialog(id: number, confirmed: boolean): void {
  if (!activeRequest || activeRequest.id !== id) {
    return;
  }

  const resolve = activeRequest.resolve;
  activeRequest = undefined;
  listener?.(undefined);
  resolve(confirmed);
}

function openAppDialog(request: Omit<AppDialogRequest, 'id'>): Promise<boolean> {
  if (!listener) {
    return Promise.resolve(request.kind === 'alert');
  }

  if (activeRequest) {
    closeAppDialog(activeRequest.id, false);
  }

  return new Promise(resolve => {
    activeRequest = {
      ...request,
      id: nextDialogId++,
      resolve,
    };
    listener?.(activeRequest);
  });
}
