import React from 'react';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  name,
  size = 'md',
  className = ''
}) => {
  // Size classes for the avatar
  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
    xl: 'h-14 w-14 text-xl'
  };

  // Get initials from name
  const getInitials = () => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Determine background color based on name hash
  const getBackgroundColor = () => {
    if (!name) return 'bg-gray-500';
    
    const colors = [
      'bg-blue-500',
      'bg-indigo-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-red-500',
      'bg-orange-500',
      'bg-amber-500',
      'bg-yellow-500',
      'bg-lime-500',
      'bg-green-500',
      'bg-emerald-500',
      'bg-teal-500',
      'bg-cyan-500'
    ];
    
    const hash = name.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    return colors[hash % colors.length];
  };

  const avatarClasses = `
    ${sizeClasses[size]} 
    inline-flex items-center justify-center rounded-full 
    ${className}
  `;

  if (src) {
    return (
      <img
        className={`${avatarClasses} object-cover`}
        src={src}
        alt={alt}
      />
    );
  }

  return (
    <div className={`${avatarClasses} ${getBackgroundColor()} text-white font-medium`}>
      {getInitials()}
    </div>
  );
};

export default Avatar;