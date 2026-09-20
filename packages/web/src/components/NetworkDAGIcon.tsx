import React from 'react';

interface NetworkDAGIconProps {
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export const NetworkDAGIcon: React.FC<NetworkDAGIconProps> = ({ size = 28, className, style }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1000 1000"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      <defs>
        <marker
          id="dag-arrow-white"
          viewBox="0 0 12 12"
          refX="6"
          refY="6"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 1 2 L 9 6 L 1 10 z" fill="#FFFFFF" />
        </marker>
        <marker
          id="dag-arrow-muted"
          viewBox="0 0 12 12"
          refX="6"
          refY="6"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 1 2 L 9 6 L 1 10 z" fill="#9BB6C9" />
        </marker>
        <marker
          id="dag-arrow-cyan"
          viewBox="0 0 12 12"
          refX="6"
          refY="6"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 1 2 L 9 6 L 1 10 z" fill="#34C3B1" />
        </marker>
      </defs>

      {/* Edges */}
      {/* Root -> Left Middle (White) */}
      <line
        x1="480"
        y1="225"
        x2="340"
        y2="455"
        stroke="#FFFFFF"
        strokeWidth="22"
        markerEnd="url(#dag-arrow-white)"
      />
      {/* Root -> Right Middle (Muted Grey) */}
      <line
        x1="520"
        y1="225"
        x2="660"
        y2="455"
        stroke="#9BB6C9"
        strokeWidth="22"
        markerEnd="url(#dag-arrow-muted)"
      />

      {/* Left Middle -> Bottom Left (Cyan) */}
      <line
        x1="288"
        y1="535"
        x2="150"
        y2="765"
        stroke="#34C3B1"
        strokeWidth="22"
        markerEnd="url(#dag-arrow-cyan)"
      />
      {/* Left Middle -> Bottom Center (Muted Grey) */}
      <line
        x1="328"
        y1="535"
        x2="465"
        y2="765"
        stroke="#9BB6C9"
        strokeWidth="22"
        markerEnd="url(#dag-arrow-muted)"
      />

      {/* Right Middle -> Bottom Center (Cyan) */}
      <line
        x1="672"
        y1="535"
        x2="535"
        y2="765"
        stroke="#34C3B1"
        strokeWidth="22"
        markerEnd="url(#dag-arrow-cyan)"
      />
      {/* Right Middle -> Bottom Right (Muted Grey) */}
      <line
        x1="712"
        y1="535"
        x2="850"
        y2="765"
        stroke="#9BB6C9"
        strokeWidth="22"
        markerEnd="url(#dag-arrow-muted)"
      />

      {/* Nodes */}
      {/* Root (White) */}
      <circle cx="500" cy="190" r="42" fill="#FFFFFF" />

      {/* Middle Left (White) */}
      <circle cx="308" cy="500" r="42" fill="#FFFFFF" />
      {/* Middle Right (Muted Grey) */}
      <circle cx="692" cy="500" r="42" fill="#9BB6C9" />

      {/* Leaves (Bright Cyan) */}
      <circle cx="116" cy="810" r="42" fill="#34C3B1" />
      <circle cx="500" cy="810" r="42" fill="#34C3B1" />
      <circle cx="884" cy="810" r="42" fill="#34C3B1" />
    </svg>
  );
};
