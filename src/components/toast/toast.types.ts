export type ToastType = 'success' | 'error' | 'info';

export interface ToastEntry {
  id: number;
  message: string;
  type: ToastType;
}

export type ToastItemProps = {
  entry: ToastEntry;
  onRemove: () => void;
};
