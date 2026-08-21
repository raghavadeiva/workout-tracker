interface MaterialIconProps {
  /** Material Symbols name, e.g. "fitness_center", "arrow_upward" */
  name: string;
  /** Font size in px (default 20) */
  size?: number;
  /** 1 = filled variant, 0 = outlined */
  fill?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Material Symbols Outlined glyph. The font is loaded in index.html;
 * ligature text renders as the icon.
 */
export function MaterialIcon({
  name,
  size = 20,
  fill = 0,
  className = '',
  style,
}: MaterialIconProps) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined select-none leading-none ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${fill}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
        ...style,
      }}
    >
      {name}
    </span>
  );
}
