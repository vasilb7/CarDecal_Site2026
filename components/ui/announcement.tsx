import { Badge, type BadgeProps } from './badge';
import { cn } from '../../lib/utils';
import { type HTMLAttributes, createContext, useContext } from 'react';

type BadgeContextType = {
  themed: boolean;
};

const BadgeContext = createContext<BadgeContextType>({
  themed: false,
});

const useBadgeContext = () => {
  const context = useContext(BadgeContext);

  if (!context) {
    throw new Error('useBadgeContext must be used within a Badge');
  }

  return context;
};

export type AnnouncementProps = BadgeProps & {
  themed?: boolean;
};

export const Announcement = ({
  variant = 'outline',
  themed = false,
  className,
  ...props
}: AnnouncementProps) => (
  <BadgeContext.Provider value={{ themed }}>
    <Badge
      variant={variant}
      className={cn(
        'max-w-full gap-2 rounded-full px-3 py-1 font-medium shadow-sm border border-white/20 bg-black/40 backdrop-blur-md cursor-pointer transition-all',
        'hover:shadow-md hover:bg-black/60 hover:border-white/30',
        themed && 'border-white/10',
        className
      )}
      {...props}
    />
  </BadgeContext.Provider>
);

export type AnnouncementTagProps = HTMLAttributes<HTMLDivElement>;

export const AnnouncementTag = ({
  className,
  ...props
}: AnnouncementTagProps) => {
  const { themed } = useBadgeContext();

  return (
    <div
      className={cn(
        '-ml-2.5 shrink-0 truncate rounded-full bg-red-600/20 text-red-500 px-2.5 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-widest',
        themed && 'bg-black/60',
        className
      )}
      {...props}
    />
  );
};

export type AnnouncementTitleProps = HTMLAttributes<HTMLDivElement>;

export const AnnouncementTitle = ({
  className,
  ...props
}: AnnouncementTitleProps) => (
  <div
    className={cn('flex items-center gap-2 truncate py-1 text-white text-xs sm:text-sm', className)}
    {...props}
  />
);
