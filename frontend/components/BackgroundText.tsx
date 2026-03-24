'use client';

import React, { forwardRef } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { GroupProps } from '@react-three/fiber';

interface BackgroundTextProps extends GroupProps {
  text?: string;
}

const BackgroundText = forwardRef<THREE.Group, BackgroundTextProps>(
  ({ text = 'EXPRESS DISTRIBUTORS', ...props }, ref) => {
    return (
      <group ref={ref} {...props}>
        <Text
          fontSize={2.8}
          color="#1a1a1a"
          anchorX="center"
          anchorY="middle"
          maxWidth={18}
          letterSpacing={0.08}
          lineHeight={0.9}
          material-transparent
          material-opacity={0.07}
        >
          {text.toUpperCase()}
        </Text>
      </group>
    );
  }
);

BackgroundText.displayName = 'BackgroundText';

export default BackgroundText;

