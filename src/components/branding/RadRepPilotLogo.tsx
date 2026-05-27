type RadRepPilotLogoProps = {
  variant?: 'iconOnly' | 'full';
  size?: number;
  showText?: boolean;
  showTagline?: boolean;
};

export function RadRepPilotLogo({
  variant = 'iconOnly',
  size = 40,
  showText = false,
  showTagline = false,
}: RadRepPilotLogoProps) {
  const logoSrc = `${import.meta.env.BASE_URL}Logo%201.png`;
  const icon = (
    <span
      className="radrep-logo-tile"
      style={{ width: size, height: size, flexBasis: size }}
      aria-hidden={variant === 'full' || showText ? 'true' : undefined}
    >
      <img
        src={logoSrc}
        alt={variant === 'full' || showText ? '' : 'RadRepPilot logo'}
        className="radrep-logo-image"
        width={size}
        height={size}
        draggable={false}
      />
    </span>
  );

  if (variant === 'full' || showText) {
    return (
      <div className="flex items-center gap-3">
        {icon}
        <div className="leading-tight">
          <div className="text-lg font-bold tracking-tight text-slate-950">RadRepPilot</div>
          {showTagline ? (
            <div className="text-xs font-medium text-slate-500">Better requisitions in. Better reports out.</div>
          ) : null}
        </div>
      </div>
    );
  }

  return icon;
}
