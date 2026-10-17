import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { cx } from '../hooks/utils';

export interface MenuAction {
  id: string;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  tone?: 'default' | 'danger';
}

export interface ActionMenuProps {
  label: string;
  icon: ReactNode;
  actions: MenuAction[];
  className?: string;
  align?: 'start' | 'end';
}

/** Small accessible menu button: arrow-key navigation, Escape to close, focus restored to the trigger. */
export function ActionMenu({ label, icon, actions, className, align = 'end' }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const first = menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]:not([disabled])');
    first?.focus();
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !triggerRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open]);

  const close = (restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  const onMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not([disabled])') ?? []);
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close(true);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      items[(index + 1) % items.length]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      items[(index - 1 + items.length) % items.length]?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      items[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      items[items.length - 1]?.focus();
    } else if (event.key === 'Tab') {
      close(false);
    }
  };

  return (
    <div className={cx('um-menu', className)} data-align={align}>
      <button
        ref={triggerRef}
        type="button"
        className="um-icon-btn um-menu__trigger"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        {icon}
      </button>
      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          className="um-menu__list"
          onKeyDown={onMenuKeyDown}
          onClick={(event) => event.stopPropagation()}
        >
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              role="menuitem"
              className="um-menu__item"
              data-tone={action.tone}
              disabled={action.disabled}
              onClick={() => {
                close(true);
                action.onSelect();
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
