export interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  /** When true, this note shows different content via secret corner taps (UpLeft=1, UpRight=2, DownLeft=3, DownRight=4). */
  isGimmicked?: boolean;
}
