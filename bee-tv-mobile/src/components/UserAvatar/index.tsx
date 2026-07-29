interface UserAvatarProps {
  nickname?: string;
  avatar?: string | null;
  size?: number;
}

export default function UserAvatar({ nickname, avatar, size = 40 }: UserAvatarProps) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt=""
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    );
  }

  const initial = (nickname || '?')[0];
  const colors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const color = colors[(initial.charCodeAt(0) || 0) % colors.length];

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: size * 0.4,
      fontWeight: 600,
      flexShrink: 0,
    }}>
      {initial}
    </div>
  );
}
