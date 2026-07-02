/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

const GlowMaterialImpl = shaderMaterial(
  {
    coefficient: 0.2,
    power: 3.0,
    glowColor: new THREE.Color('#00ffff'),
  },
  `
  varying vec3 vNormal;
  varying vec3 vPositionNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPositionNormal = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  `
  uniform vec3 glowColor;
  uniform float coefficient;
  uniform float power;
  varying vec3 vNormal;
  varying vec3 vPositionNormal;
  void main() {
    float intensity = pow(coefficient - dot(vNormal, vPositionNormal), power);
    gl_FragColor = vec4(glowColor, intensity);
  }
  `
);

extend({ GlowMaterialImpl });

export default GlowMaterialImpl;
