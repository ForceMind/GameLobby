import { SPRITE_ATLAS_URL, SPRITE_COLUMNS, SPRITE_ROWS, spriteMap } from '../spriteMap';

function SpriteIcon({ name, size = 32, className = '', label }) {
  const sprite = spriteMap[name];

  if (!sprite) {
    return null;
  }

  return (
    <span
      className={`sprite-icon ${className}`.trim()}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundImage: `url(${SPRITE_ATLAS_URL})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: `${SPRITE_COLUMNS * size}px ${SPRITE_ROWS * size}px`,
        backgroundPosition: `${-sprite.col * size}px ${-sprite.row * size}px`,
      }}
    />
  );
}

export default SpriteIcon;
