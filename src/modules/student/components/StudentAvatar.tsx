interface StudentAvatarProps {
  name: string;
  photoUrl?: string;
  size?: 'sm' | 'md';
}

export function StudentAvatar({ name, photoUrl, size = 'sm' }: StudentAvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const sizeClasses = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm';

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`${sizeClasses} rounded-full object-cover`}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} flex items-center justify-center rounded-full bg-teal-100 font-bold text-teal-700`}
    >
      {initials}
    </div>
  );
}