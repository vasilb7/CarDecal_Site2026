import React from 'react';
import clsx from 'clsx';
import './ExpandingMenu.css';

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}

interface Props {
  items: MenuItem[];
  className?: string;
}

export const ExpandingMenu: React.FC<Props> = ({ items, className }) => {
  return (
    <nav className={clsx("expanding-menu-container", className)}>
      {items.map(item => (
        <button
          key={item.id}
          onClick={item.onClick}
          className={clsx("menu-link", item.active && "active")}
          aria-current={item.active ? "page" : undefined}
        >
          <span className="menu-icon-wrapper">{item.icon}</span>
          <span className="menu-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};
