import React from 'react';

export interface InfoCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  link?: {
    href: string;
    label?: string;
    isExternal?: boolean;
  };
  className?: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  description,
  icon,
  children,
  link,
  className = '',
}) => {
  return (
    <div className={`card ${className}`.trim()} data-testid="info-card">
      {icon && <div style={{ marginBottom: '0.75rem' }}>{icon}</div>}
      <h3 className="card-title">
        {link ? (
          <a
            href={link.href}
            target={link.isExternal ? '_blank' : undefined}
            rel={link.isExternal ? 'noopener noreferrer' : undefined}
          >
            {title}
          </a>
        ) : (
          title
        )}
      </h3>

      {description && <p className="card-description">{description}</p>}

      {children}

      {link && link.label && (
        <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
          <a
            href={link.href}
            target={link.isExternal ? '_blank' : undefined}
            rel={link.isExternal ? 'noopener noreferrer' : undefined}
          >
            {link.label}
          </a>
        </div>
      )}
    </div>
  );
};
