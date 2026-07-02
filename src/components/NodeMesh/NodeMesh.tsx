/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Line, Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useNodeStore } from '../../store/useNodeStore';
import { NodeStatus, EventPriority } from '../../types';
import { Activity, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NodeDetailPanel } from './NodeDetailPanel';
import './GlowMaterial';

const AlertRing = ({ position, color }: { position: [number, number, number], color: string }) => {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (ring1Ref.current) {
      const p1 = (time * 1.5) % 1;
      ring1Ref.current.scale.setScalar(1 + p1 * 3);
      (ring1Ref.current.material as THREE.MeshBasicMaterial).opacity = (1 - p1) * 0.8;
    }
    
    if (ring2Ref.current) {
      const p2 = (time * 1.5 + 0.5) % 1;
      ring2Ref.current.scale.setScalar(1 + p2 * 3);
      (ring2Ref.current.material as THREE.MeshBasicMaterial).opacity = (1 - p2) * 0.8;
    }
  });

  return (
    <group position={position}>
      <mesh ref={ring1Ref} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 1.3, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring2Ref} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 1.3, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

const SynapticConnection = ({ start, end, active, color, opacity, isBeam, isWinnerPath, thickness = 0.05, brightness = 1.0 }: { start: THREE.Vector3, end: THREE.Vector3, active: boolean, color: string, opacity: number, isBeam?: boolean, isWinnerPath?: boolean, thickness?: number, brightness?: number }) => {
  const visualSettings = useNodeStore((state) => state.visualSettings);
  const packetRef = useRef<THREE.Mesh>(null);
  const trailRefs = useRef<(THREE.Mesh | null)[]>([]);
  const lineRef = useRef<any>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const progress = useRef(0);
  const [isFiring, setIsFiring] = React.useState(false);

  const finalOpacity = isWinnerPath ? opacity * 1.5 : opacity * 0.2; // Fade out non-winning paths

  const curve = useMemo(() => {
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    mid.y += isBeam ? 5 : 2; // Curve height
    return new THREE.QuadraticBezierCurve3(start, mid, end);
  }, [start, end, isBeam]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(color).multiplyScalar(brightness) },
    uActive: { value: active ? 1.0 : 0.0 }
  }), [color, brightness]);

  React.useEffect(() => {
    if (active && !isFiring && !isBeam) {
      setIsFiring(true);
      progress.current = 0;
    }
  }, [active, isFiring, isBeam]);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = time;
      shaderRef.current.uniforms.uActive.value = THREE.MathUtils.lerp(shaderRef.current.uniforms.uActive.value, active ? 1.0 : 0.0, 0.1);
      if (beamRef.current) {
        beamRef.current.visible = shaderRef.current.uniforms.uActive.value > 0.01;
      }
    }

    if (lineRef.current) {
      if (active && visualSettings.showDashedLines) {
        lineRef.current.material.opacity = finalOpacity + Math.sin(time * 12) * 0.1;
        lineRef.current.material.dashOffset -= delta * 2 * visualSettings.connectionSpeed;
      } else {
        lineRef.current.material.opacity = finalOpacity;
      }
    }

    if (isFiring && !isBeam) {
      progress.current += delta * visualSettings.connectionSpeed;
      if (progress.current >= 1.3) {
        if (active) {
          progress.current = 0;
        } else {
          setIsFiring(false);
          progress.current = 0;
        }
      }

      if (packetRef.current) {
        const p = Math.min(1, Math.max(0, progress.current));
        packetRef.current.position.lerpVectors(start, end, p);
        const pulse = 1 + Math.sin(time * 25) * 0.3;
        packetRef.current.scale.setScalar(pulse);
        
        // Sharpened peak visibility
        const peakVisibility = Math.pow(Math.sin(p * Math.PI), 1.2);
        (packetRef.current.material as THREE.MeshStandardMaterial).opacity = peakVisibility;
        (packetRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = (30 + Math.sin(time * 20) * 15) * peakVisibility;
      }

      trailRefs.current.forEach((trail, i) => {
        if (trail) {
          const trailOffset = (i + 1) * 0.08;
          const p = Math.min(1, Math.max(0, progress.current - trailOffset));
          
          // Base position
          trail.position.lerpVectors(start, end, p);
          
          // Add dynamic jitter/offset for more organic flow
          const jitter = Math.sin(time * 15 + i) * 0.04;
          trail.position.x += jitter;
          trail.position.y += Math.cos(time * 12 + i) * 0.04;
          trail.position.z += Math.sin(time * 10 + i) * 0.04;

          const trailPulse = 0.8 + Math.sin(time * 20 + i) * 0.2;
          trail.scale.setScalar(trailPulse * (1 - (i + 1) * 0.2));
          
          // Sharpened peak visibility for trails
          const peakVisibility = Math.pow(Math.sin(p * Math.PI), 1.5);
          const trailOpacity = peakVisibility * (0.7 / (i + 1));
          (trail.material as THREE.MeshStandardMaterial).opacity = trailOpacity;
          
          // Pronounced emissive intensity at peak
          const baseEmissive = 20 + Math.sin(time * 25 + i) * 10;
          (trail.material as THREE.MeshStandardMaterial).emissiveIntensity = (baseEmissive * peakVisibility) / (i + 1);
        }
      });
    }
  });

  return (
    <group>
      {isBeam ? (
        <mesh ref={beamRef}>
          <tubeGeometry args={[curve, 64, 0.12, 8, false]} />
          <shaderMaterial
            ref={shaderRef}
            transparent
            uniforms={uniforms}
            vertexShader={`
              varying vec2 vUv;
              void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `}
            fragmentShader={`
              uniform float uTime;
              uniform vec3 uColor;
              uniform float uActive;
              varying vec2 vUv;
              
              void main() {
                float flow = fract(vUv.x * 3.0 - uTime * 4.0);
                float pulse = 0.5 + 0.5 * sin(uTime * 15.0 + vUv.x * 30.0);
                
                // Animated data flow segments
                float alpha = smoothstep(0.0, 0.1, flow) * (1.0 - smoothstep(0.6, 0.7, flow));
                
                // Edge glow
                float edge = 1.0 - abs(vUv.y - 0.5) * 2.0;
                alpha *= pow(edge, 2.0);
                
                alpha *= uActive;
                
                vec3 color = mix(uColor, vec3(1.0), pulse * 0.3);
                gl_FragColor = vec4(color, alpha * 0.9);
              }
            `}
          />
        </mesh>
      ) : (
        <>
          <Line 
            ref={lineRef} 
            points={[start, end]} 
            color={color} 
            lineWidth={Math.max(1, thickness * 40)} 
            transparent 
            opacity={finalOpacity}
            dashed={active && visualSettings.showDashedLines}
            dashScale={5}
            dashSize={0.5}
            gapSize={0.5}
          />
          {isFiring && (
            <>
              <Sphere ref={packetRef} args={[0.06, 8, 8]}>
                <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={5} transparent opacity={0} />
              </Sphere>
              {visualSettings.showTrails && [0, 1, 2].map((i) => (
                <Sphere 
                  key={i} 
                  ref={(el) => { trailRefs.current[i] = el; }} 
                  args={[0.04, 6, 6]}
                >
                  <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} transparent opacity={0} />
                </Sphere>
              ))}
            </>
          )}
        </>
      )}
    </group>
  );
};

const Node = ({ node, onSelect }: { node: any, onSelect: (node: any) => void }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<any>(null);
  const groupRef = useRef<THREE.Group>(null);
  const throttlingHeatmap = useNodeStore((state) => state.throttlingHeatmap);
  const throttleLevel = throttlingHeatmap[node.id] || 0;
  const highlightedNodeIds = useNodeStore((state) => (state as any).highlightedNodeIds || []);
  const isHighlighted = highlightedNodeIds.includes(node.id);
  
  const [hovered, setHovered] = React.useState(false);
  
  const GlowMaterialTag = 'glowMaterialImpl' as any;
  
  // Activity Variance: Each node has a slightly different pulse speed and offset
  const pulseSpeed = useMemo(() => 0.8 + (Math.random() * 0.4), [node.id]);
  const pulseOffset = useMemo(() => Math.random() * Math.PI * 2, [node.id]);
  const driftSpeed = useMemo(() => 0.2 + (Math.random() * 0.3), [node.id]);

  const metaState = useNodeStore(state => state.metaState);
  const isWinner = metaState.winningNodes.includes(node.id);

  const isHighlyReliable = useMemo(() => {
    if (!node.decisionHistory || node.decisionHistory.length < 3) return false;
    const successes = node.decisionHistory.filter((h: any) => h.outcome === 'success').length;
    return (successes / node.decisionHistory.length) >= 0.8;
  }, [node.decisionHistory]);

  const currentColor = useRef(new THREE.Color('#444444'));

  React.useEffect(() => {
    if (node.type === 'LucyPrime' && meshRef.current) {
      // Immediate initialization for LucyPrime core
      const coreColor = new THREE.Color('#ffffff');
      (meshRef.current.material as THREE.MeshStandardMaterial).color.copy(coreColor);
      (meshRef.current.material as THREE.MeshStandardMaterial).emissive.copy(coreColor);
      currentColor.current.copy(coreColor);
    }
  }, [node.type]);

  const targetColor = useMemo(() => {
    if (isWinner) {
      const winningProposal = metaState.winningProposals?.find(p => p.nodeId === node.id);
      if (winningProposal?.domain === 'fivem') return new THREE.Color('#f59e0b'); // amber
      if (winningProposal?.domain === 'llama') return new THREE.Color('#a855f7'); // purple
      if (winningProposal?.domain === 'database') return new THREE.Color('#10b981'); // green
      return new THREE.Color('#00ff00'); // Bright green for winners
    }

    if (throttleLevel > 0) {
      if (throttleLevel === 3) return new THREE.Color('#ff0000');
      if (throttleLevel === 2) return new THREE.Color('#ff4400');
      if (throttleLevel === 1) return new THREE.Color('#ff8800');
    }

    // Subsystem-based coloring
    switch (node.subsystem) {
      case 'core': return new THREE.Color('#ffffff');
      case 'orchestration': return new THREE.Color('#3b82f6');
      case 'reasoning': return new THREE.Color('#a855f7');
      case 'memory': return new THREE.Color('#10b981');
      case 'execution': return new THREE.Color('#00ffff');
      case 'telemetry': return new THREE.Color('#f59e0b');
      case 'security': return new THREE.Color('#ef4444');
      default: break;
    }

    if (node.type === 'FiveMServer') return node.status === NodeStatus.ERROR ? new THREE.Color('#ff0000') : new THREE.Color('#00ffcc');
    
    switch (node.status) {
      case NodeStatus.ACTIVE: return new THREE.Color('#00ff00');
      case NodeStatus.THINKING: return new THREE.Color('#0088ff');
      case NodeStatus.ROUTING: return new THREE.Color('#ffff00');
      case NodeStatus.MERGING: return new THREE.Color('#ff00ff');
      case NodeStatus.RESPONDING: return new THREE.Color('#00ffff');
      case NodeStatus.ERROR: return new THREE.Color('#ff0000');
      case NodeStatus.ALERT: return new THREE.Color('#ffa500');
      case NodeStatus.HEARTBEAT: return new THREE.Color('#00ffcc');
      case NodeStatus.ANOMALY: return new THREE.Color('#ff0055');
      default: return new THREE.Color('#444444');
    }
  }, [node.status, node.subsystem, node.type, throttleLevel, isWinner]);

  useFrame((state, delta) => {
    if (meshRef.current && groupRef.current) {
      const time = state.clock.getElapsedTime();
      
      // Organic "Breathing" / Drifting (Neurons Realism)
      const driftX = Math.sin(time * driftSpeed + pulseOffset) * 0.3;
      const driftY = Math.cos(time * (driftSpeed * 0.8) + pulseOffset) * 0.3;
      const driftZ = Math.sin(time * (driftSpeed * 1.2) + pulseOffset) * 0.3;
      groupRef.current.position.set(node.position[0] + driftX, node.position[1] + driftY, node.position[2] + driftZ);

      // Gradual Color Transition
      currentColor.current.lerp(targetColor, 0.05);
      (meshRef.current.material as THREE.MeshStandardMaterial).color.copy(currentColor.current);
      (meshRef.current.material as THREE.MeshStandardMaterial).emissive.copy(currentColor.current);

      // Gradual state transitions and activity variance
      let targetScale = 1;
      const priorityMult = node.priority === EventPriority.CRITICAL ? 2 : node.priority === EventPriority.NORMAL ? 1 : 0.5;

      if (isWinner) {
        targetScale = 1.5 + Math.sin(time * 10) * 0.2;
        (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 5 + Math.sin(time * 10) * 2;
      } else if (node.status === NodeStatus.IDLE) {
        // Slow, subtle pulse for idle
        targetScale = 1 + Math.sin(time * 0.5 * pulseSpeed + pulseOffset) * 0.02;
      } else if (node.status === NodeStatus.THINKING) {
        targetScale = 1 + Math.sin(time * 5 * pulseSpeed * priorityMult + pulseOffset) * 0.1;
      } else if (node.status === NodeStatus.HEARTBEAT) {
        // Soft, gentle pulse for heartbeat
        targetScale = 1 + Math.sin(time * 1.2 * pulseSpeed + pulseOffset) * 0.03;
      } else if (node.status === NodeStatus.ACTIVE) {
        // Faster, more intense pulse for active load
        const loadIntensity = 1 + Math.sin(time * 10 * pulseSpeed + pulseOffset) * 0.06 + Math.sin(time * 18 * pulseSpeed) * 0.02;
        targetScale = 1.1 * loadIntensity;
      } else if (node.type === 'FiveMServer') {
        targetScale = 1 + Math.sin(time * 2 * pulseSpeed * priorityMult + pulseOffset) * 0.05;
      }

      if (node.status === NodeStatus.ANOMALY) {
        // Glitchy high-frequency flicker
        const glitch = Math.random() > 0.08;
        meshRef.current.visible = glitch;
        (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = glitch ? 15 : 0;
        
        // Rapid jitter
        meshRef.current.position.x = (Math.random() - 0.5) * 0.2;
        meshRef.current.position.z = (Math.random() - 0.5) * 0.2;
        targetScale = 1.3 + Math.sin(time * 40) * 0.3;
      } else if (node.status === NodeStatus.ERROR) {
        // Violent shake and red pulse for error
        meshRef.current.position.x = (Math.random() - 0.5) * 0.3;
        meshRef.current.position.y = (Math.random() - 0.5) * 0.3;
        meshRef.current.position.z = (Math.random() - 0.5) * 0.3;
        
        const errorPulse = 1.2 + Math.sin(time * 25) * 0.3;
        targetScale = errorPulse;
        (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 10 + Math.sin(time * 30) * 5;
        meshRef.current.visible = true;
      } else {
        meshRef.current.position.set(0, 0, 0);
        meshRef.current.visible = true;
        // Reset emissive intensity to default if not anomaly/error
        (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = node.status !== NodeStatus.IDLE ? 5 : 0.2;
      }

      if (isHighlighted) {
        targetScale = targetScale * 1.8 + Math.sin(time * 15 * pulseSpeed) * 0.15;
      }

      // Micro-delays/Lerp for smooth transitions
      const hoverScaleMult = hovered ? 1.2 : 1.0;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale * hoverScaleMult, targetScale * hoverScaleMult, targetScale * hoverScaleMult), 0.1);

      if (glowRef.current) {
        const priorityGlowMap: Record<string, number> = {
          [EventPriority.CRITICAL]: 6.0,
          [EventPriority.HIGH]: 2.5,
          [EventPriority.NORMAL]: 1.0,
          [EventPriority.LOW]: 0.5,
          [EventPriority.BACKGROUND]: 0.3,
          [EventPriority.SYSTEM]: 0.8,
        };
        
        const glowIntensity = priorityGlowMap[node.priority as string] || 1.0;
        
        const statusMult = node.status === NodeStatus.ERROR ? 4.0 :
                          node.status === NodeStatus.ANOMALY ? 5.0 :
                          node.status === NodeStatus.THINKING ? 2.0 :
                          node.status === NodeStatus.ACTIVE ? 1.5 :
                          node.status === NodeStatus.IDLE ? 0.4 : 1.0;

        const hoverGlowMult = hovered ? 1.8 : 1.0;
        const finalIntensity = glowIntensity * statusMult * hoverGlowMult;
        
        glowRef.current.glowColor.copy(currentColor.current);
        glowRef.current.coefficient = 0.1 * finalIntensity;
        glowRef.current.power = 2.0 / finalIntensity;
      }

      if (node.status === NodeStatus.ACTIVE) {
        meshRef.current.rotation.y += 0.05 * pulseSpeed * priorityMult;
      }
    }
  });

  const size = node.type === 'LucyPrime' ? 1.5 : node.type === 'Emma' ? 1.2 : node.type === 'Memory' ? 0.4 : node.type === 'Security' ? 0.6 : 0.5;

  return (
    <group ref={groupRef}>
      {node.status === NodeStatus.ANOMALY && <AlertRing position={[0, 0, 0]} color="#ff0055" />}
      {isHighlighted && <AlertRing position={[0, 0, 0]} color="#a855f7" />}
      {metaState.nodeHalosEnabled && isHighlyReliable && !isWinner && (
        <mesh>
          <ringGeometry args={[size + 0.1, size + 0.15, 32]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.2}>
        <Sphere 
          ref={meshRef} 
          args={[size, 16, 16]}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = 'auto';
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(node);
          }}
        >
          <meshStandardMaterial 
            emissiveIntensity={node.status !== NodeStatus.IDLE ? 8 : 0.5} 
            transparent 
            opacity={0.9}
          />
        </Sphere>
        <Sphere args={[size * 1.8, 16, 16]}>
          <GlowMaterialTag 
            ref={glowRef}
            transparent 
            side={THREE.BackSide}
          />
        </Sphere>
      </Float>
      {(hovered || node.type === 'LucyPrime' || node.type === 'Emma') && (
        <Text
          position={[0, size + 0.8, 0]}
          fontSize={0.4}
          color="white"
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
        >
          {node.metadata?.serverName || node.id}
        </Text>
      )}
    </group>
  );
};

const Connections = () => {
  const nodes = useNodeStore((state) => state.nodes);
  const metaState = useNodeStore((state) => state.metaState);
  
  const lines = useMemo(() => {
    const result: { start: THREE.Vector3; end: THREE.Vector3; color: string; opacity: number; isBeam: boolean; active: boolean; isWinnerPath: boolean; thickness: number; brightness: number }[] = [];
    nodes.forEach((node) => {
      // Calculate node's historical success and frequency
      const history = node.decisionHistory || [];
      const frequency = history.length;
      const successes = history.filter(h => h.outcome === 'success').length;
      const successRate = frequency > 0 ? successes / frequency : 0;
      
      // Synaptic Visuals: Line thickness = frequency, brightness = success
      const baseThickness = metaState.synapticVisualsEnabled ? Math.min(0.5, 0.05 + (frequency * 0.01)) : 0.05;
      const baseBrightness = metaState.synapticVisualsEnabled ? 0.2 + (successRate * 0.8) : 1.0;

      node.connections.forEach((targetId) => {
        const targetNode = nodes.find((n) => n.id === targetId);
        if (targetNode) {
          const isCore = node.subsystem === 'core' || targetNode.subsystem === 'core';
          const isOrchestration = node.subsystem === 'orchestration' || targetNode.subsystem === 'orchestration';
          const isWinnerPath = metaState.winningNodes.includes(node.id) || metaState.winningNodes.includes(targetNode.id);
          
          let color = '#222222';
          if (isWinnerPath) color = '#00ff00';
          else if (isCore) color = '#ffffff';
          else if (isOrchestration) color = '#3b82f6';
          else if (node.subsystem === targetNode.subsystem) {
            // Same subsystem connection
            switch (node.subsystem) {
              case 'reasoning': color = '#a855f7'; break;
              case 'memory': color = '#10b981'; break;
              case 'execution': color = '#00ffff'; break;
              case 'telemetry': color = '#f59e0b'; break;
              case 'security': color = '#ef4444'; break;
            }
          }

          result.push({
            start: new THREE.Vector3(...node.position),
            end: new THREE.Vector3(...targetNode.position),
            color: color,
            opacity: (isCore ? 0.6 : isOrchestration ? 0.4 : 0.15) * baseBrightness,
            isBeam: isCore || isOrchestration,
            active: node.status !== NodeStatus.IDLE || targetNode.status !== NodeStatus.IDLE,
            isWinnerPath,
            thickness: isWinnerPath ? baseThickness * 2 : baseThickness,
            brightness: baseBrightness
          });
        }
      });
    });
    return result;
  }, [nodes, metaState.winningNodes, metaState.synapticVisualsEnabled]);

  return (
    <group>
      {lines.map((line, i) => (
        <SynapticConnection 
          key={`connection-${i}`}
          start={line.start} 
          end={line.end} 
          active={line.active} 
          color={line.color} 
          opacity={line.opacity}
          isBeam={line.isBeam}
          isWinnerPath={line.isWinnerPath}
          thickness={line.thickness}
          brightness={line.brightness}
        />
      ))}
    </group>
  );
};

const ScreenShake = () => {
  const nodes = useNodeStore((state) => state.nodes);
  const hasError = nodes.some(n => n.status === NodeStatus.ERROR);
  
  useFrame((state) => {
    if (hasError) {
      state.camera.position.x += (Math.random() - 0.5) * 0.1;
      state.camera.position.y += (Math.random() - 0.5) * 0.1;
      state.camera.position.z += (Math.random() - 0.5) * 0.1;
      state.camera.lookAt(0, 0, 0);
    }
  });

  return null;
};

const CameraController = () => {
  const highlightedNodeIds = useNodeStore((state) => (state as any).highlightedNodeIds || []);
  const nodes = useNodeStore((state) => state.nodes);

  useFrame((state) => {
    if (highlightedNodeIds.length > 0) {
      // Find average position of highlighted nodes
      let sumX = 0, sumY = 0, sumZ = 0, count = 0;
      nodes.forEach((node) => {
        if (highlightedNodeIds.includes(node.id)) {
          sumX += node.position[0];
          sumY += node.position[1];
          sumZ += node.position[2];
          count++;
        }
      });

      if (count > 0) {
        const targetX = sumX / count;
        const targetY = sumY / count;
        const targetZ = sumZ / count;

        const targetCamPos = new THREE.Vector3(targetX, targetY, targetZ).add(new THREE.Vector3(12, 12, 12));
        state.camera.position.lerp(targetCamPos, 0.05);
        
        if (state.controls) {
          (state.controls as any).target.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.05);
        }
      }
    } else {
      const defaultCamPos = new THREE.Vector3(30, 30, 30);
      state.camera.position.lerp(defaultCamPos, 0.03);
      if (state.controls) {
        (state.controls as any).target.lerp(new THREE.Vector3(0, 0, 0), 0.03);
      }
    }
  });

  return null;
};

export const NodeMesh = () => {
  const nodes = useNodeStore((state) => state.nodes);
  const [selectedNode, setSelectedNode] = React.useState<any>(null);

  return (
    <div className="w-full h-full bg-[#050505] rounded-xl overflow-hidden border border-white/10 relative group/mesh">
      <Canvas camera={{ position: [30, 30, 30], fov: 45 }}>
        <ScreenShake />
        <CameraController />
        <color attach="background" args={['#050505']} />
        <ambientLight intensity={0.4} />
        <pointLight position={[20, 20, 20]} intensity={1.5} />
        <pointLight position={[-20, -20, -20]} intensity={0.5} color="#3b82f6" />
        
        <group>
          {nodes.map((node) => (
            <Node key={node.uid} node={node} onSelect={setSelectedNode} />
          ))}
          <Connections />
        </group>

        <OrbitControls 
          makeDefault 
          enableDamping 
          dampingFactor={0.05}
          maxDistance={100}
          minDistance={5}
        />
        <gridHelper args={[100, 50, '#111111', '#080808']} position={[0, -20, 0]} />
      </Canvas>
      
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-white font-mono text-sm tracking-[0.2em] font-bold">COGNITIVE MESH</h2>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest">137 NODES ACTIVE</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2 items-end pointer-events-none">
        <div className="p-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {[
              { label: 'CORE', color: 'bg-white' },
              { label: 'ORCHESTRATION', color: 'bg-blue-500' },
              { label: 'REASONING', color: 'bg-purple-500' },
              { label: 'MEMORY', color: 'bg-emerald-500' },
              { label: 'EXECUTION', color: 'bg-cyan-500' },
              { label: 'TELEMETRY', color: 'bg-amber-500' },
              { label: 'SECURITY', color: 'bg-red-500' }
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                <span className="text-[8px] text-white/40 font-mono uppercase tracking-widest">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedNode && (
          <NodeDetailPanel 
            node={selectedNode} 
            onClose={() => setSelectedNode(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};
