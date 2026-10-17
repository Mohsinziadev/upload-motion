import type { JSX, SVGProps } from 'react';
import type { FileKind } from '../core/types';

export type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 20, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const UploadIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 15V4" />
    <path d="m7 8.5 5-5 5 5" />
    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  </Svg>
);
export const CloudIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 8.5a4.5 4.5 0 0 1-.5 9.5" />
    <path d="M12 13v8" />
    <path d="m8.5 16.5 3.5-3.5 3.5 3.5" />
  </Svg>
);
export const PauseIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={2.4}>
    <path d="M9 6v12M15 6v12" />
  </Svg>
);
export const PlayIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none" />
  </Svg>
);
export const CloseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);
export const RetryIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 11a8 8 0 1 0-2.3 5.7" />
    <path d="M20 4v7h-7" />
  </Svg>
);
export const TrashIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </Svg>
);
export const CheckIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={2.4}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
);
export const AlertIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3 2 20h20L12 3z" />
    <path d="M12 10v4M12 17.2v.1" />
  </Svg>
);
export const ExpandIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14 4h6v6M10 20H4v-6M20 4l-6.5 6.5M4 20l6.5-6.5" />
  </Svg>
);
export const CollapseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 4l-6 6M14 5v5h5M4 20l6-6M10 19v-5H5" />
  </Svg>
);
export const MoreIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={2.8}>
    <path d="M12 5.5v.01M12 12v.01M12 18.5v.01" />
  </Svg>
);
export const PlusIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
export const ImageIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
    <circle cx="9" cy="9" r="1.8" />
    <path d="m20.5 15.5-5-5-9 9" />
  </Svg>
);
export const VideoIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M10.2 8.8v6.4l5.2-3.2z" />
  </Svg>
);
export const MusicIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 17.5V6l11-2v11.5" />
    <circle cx="6.5" cy="17.5" r="2.5" />
    <circle cx="17.5" cy="15.5" r="2.5" />
  </Svg>
);
export const DocumentIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5M9 13h6M9 17h4" />
  </Svg>
);
export const SheetIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M4 10h16M4 15h16M10 4v16" />
  </Svg>
);
export const SlidesIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M12 16v4M8 20h8" />
  </Svg>
);
export const ArchiveIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M12 3v2M12 7v2M12 11v2" />
    <rect x="10" y="14" width="4" height="4" rx="1" />
  </Svg>
);
export const CodeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" />
  </Svg>
);
export const DataIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 4c-2 0-2 1.5-2 3s0 3-2 5c2 2 2 3.5 2 5s0 3 2 3M16 4c2 0 2 1.5 2 3s0 3 2 5c-2 2-2 3.5-2 5s0 3-2 3" />
  </Svg>
);
export const TextIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 6h14M5 10h14M5 14h10M5 18h7" />
  </Svg>
);
export const FileIconGlyph = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
  </Svg>
);

export const KIND_ICONS: Record<FileKind, (p: IconProps) => JSX.Element> = {
  image: ImageIcon,
  video: VideoIcon,
  audio: MusicIcon,
  pdf: DocumentIcon,
  document: DocumentIcon,
  spreadsheet: SheetIcon,
  presentation: SlidesIcon,
  archive: ArchiveIcon,
  code: CodeIcon,
  data: DataIcon,
  text: TextIcon,
  unknown: FileIconGlyph,
};
