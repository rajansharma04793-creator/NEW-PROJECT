import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface ThreeSceneCoinProps {
  className?: string;
  onClick?: () => void;
}

export const ThreeSceneCoin: React.FC<ThreeSceneCoinProps> = ({
  className = '',
  onClick,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [webGlSupported, setWebGlSupported] = useState<boolean>(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let animId: number | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let handleMouseMove: ((e: MouseEvent) => void) | null = null;

    try {
      let width = container.clientWidth || 400;
      let height = container.clientHeight || 400;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
      camera.position.z = 5.5;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'default' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      container.appendChild(renderer.domElement);

      // Group for the entire coin asset to allow combined rotation and hover
      const coinGroup = new THREE.Group();
      scene.add(coinGroup);

      // Main Coin Geometry
      const coinGeo = new THREE.CylinderGeometry(1.9, 1.9, 0.38, 64);
      const coinMat = new THREE.MeshStandardMaterial({
        color: 0xf0b90b,
        metalness: 0.88,
        roughness: 0.22,
      });
      const coin = new THREE.Mesh(coinGeo, coinMat);
      coin.rotation.x = Math.PI / 2;
      coinGroup.add(coin);

      // Torus Rings for embossed borders
      const ringGeo = new THREE.TorusGeometry(1.48, 0.09, 20, 80);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0xffdf99,
        metalness: 0.95,
        roughness: 0.15,
      });

      const frontRing = new THREE.Mesh(ringGeo, ringMat);
      frontRing.position.z = 0.20;
      coin.add(frontRing);

      const backRing = new THREE.Mesh(ringGeo, ringMat);
      backRing.position.z = -0.20;
      coin.add(backRing);

      // Inner Emblem "L" geometry on coin face
      const emblemGeo = new THREE.TorusGeometry(0.85, 0.05, 16, 60);
      const emblemMat = new THREE.MeshStandardMaterial({
        color: 0xfff8f1,
        metalness: 0.8,
        roughness: 0.2,
      });
      const frontEmblem = new THREE.Mesh(emblemGeo, emblemMat);
      frontEmblem.position.z = 0.205;
      coin.add(frontEmblem);

      const backEmblem = new THREE.Mesh(emblemGeo, emblemMat);
      backEmblem.position.z = -0.205;
      coin.add(backEmblem);

      // Ambient & Point Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
      scene.add(ambientLight);

      const goldLight = new THREE.PointLight(0xf6be16, 2.5, 20);
      goldLight.position.set(4, 4, 5);
      scene.add(goldLight);

      const fillLight = new THREE.PointLight(0x00ff94, 1.2, 20);
      fillLight.position.set(-4, -3, 3);
      scene.add(fillLight);

      const topWhiteLight = new THREE.DirectionalLight(0xffffff, 1.2);
      topWhiteLight.position.set(0, 8, 4);
      scene.add(topWhiteLight);

      // Mouse Parallax
      let targetRotX = 0;
      let targetRotY = 0;
      let mouseX = 0;
      let mouseY = 0;

      handleMouseMove = (e: MouseEvent) => {
        if (!container) return;
        const rect = container.getBoundingClientRect();
        if (rect.width && rect.height) {
          const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
          mouseX = x;
          mouseY = y;
        }
      };

      window.addEventListener('mousemove', handleMouseMove);

      // Resize Observer
      const handleResize = () => {
        if (!container || !renderer) return;
        width = container.clientWidth || 400;
        height = container.clientHeight || 400;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      };

      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);

      const startTime = performance.now();

      const animate = (timestamp: number) => {
        if (!renderer) return;
        const elapsedTime = (timestamp - startTime) * 0.001;

        // Continuous rotation
        coin.rotation.y += 0.012;
        coin.rotation.z += 0.004;

        // Floating hover motion
        coinGroup.position.y = Math.sin(elapsedTime * 1.8) * 0.12;

        // Mouse Parallax interpolation
        targetRotX = mouseY * 0.25;
        targetRotY = mouseX * 0.45;
        coinGroup.rotation.x += (targetRotX - coinGroup.rotation.x) * 0.05;
        coinGroup.rotation.y += (targetRotY - coinGroup.rotation.y) * 0.05;

        renderer.render(scene, camera);
        animId = requestAnimationFrame(animate);
      };

      animId = requestAnimationFrame(animate);

      return () => {
        if (animId) cancelAnimationFrame(animId);
        if (handleMouseMove) window.removeEventListener('mousemove', handleMouseMove);
        if (resizeObserver) resizeObserver.disconnect();
        if (renderer && renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
        if (renderer) renderer.dispose();
        coinGeo.dispose();
        coinMat.dispose();
        ringGeo.dispose();
        ringMat.dispose();
        emblemGeo.dispose();
        emblemMat.dispose();
      };
    } catch (err) {
      console.warn('WebGL context failed, falling back to CSS 3D coin:', err);
      setWebGlSupported(false);
    }
  }, []);

  return (
    <div
      id="threejs-coin-container"
      ref={containerRef}
      onClick={onClick}
      className={`w-full h-full cursor-pointer relative select-none flex items-center justify-center ${className}`}
    >
      {!webGlSupported && (
        <div className="relative w-44 h-44 md:w-56 md:h-56 rounded-full flex items-center justify-center bg-gradient-to-tr from-[#997300] via-[#f0b90b] to-[#fff3bf] p-3 shadow-[0_0_50px_rgba(240,185,11,0.4)] animate-bounce duration-1000">
          <div className="w-full h-full rounded-full border-4 border-[#fff3bf]/60 flex items-center justify-center bg-[#191c1f]/80 backdrop-blur-sm">
            <span className="font-hanken font-extrabold text-4xl md:text-5xl text-[#f0b90b] tracking-wider drop-shadow-md">
              ⟠
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
