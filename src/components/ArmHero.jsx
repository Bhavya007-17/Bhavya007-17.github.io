import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ARM_GEOMETRY, ARM_STATIONS, sampleArmMotion } from './armMotion';
import { useMotion } from './useInView.js';
import { ArmDrawing } from './ArmFallback.jsx';

export default function ArmHero() {
  const container = useRef(null), control = useRef(null);
  const { paused } = useMotion();
  const playing = !paused, playingNow = useRef(playing);
  const [fallback, setFallback] = useState(false);
  // The arm obeys the site-wide motion toggle: paused freezes it on the current frame (the render loop stops), playing resumes it.
  useEffect(() => { playingNow.current = playing; control.current?.(playing); }, [playing]);
  useEffect(() => {
    const host = container.current;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
    catch { setFallback(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x242321, 0);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.65;
    host.appendChild(renderer.domElement); renderer.domElement.setAttribute('aria-hidden', 'true');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, .1, 40);
    const cameraTarget = new THREE.Vector3(.55, .72, .15);
    camera.position.set(4.51, 1.94, 1.23); camera.lookAt(cameraTarget);
    scene.add(new THREE.HemisphereLight(0xfff5e8, 0x665b50, 3));
    const light = new THREE.DirectionalLight(0xfff7ea, 4.5);
    light.position.set(-2, 5, 4); light.castShadow = true; light.shadow.mapSize.set(1024, 1024);
    Object.assign(light.shadow.camera, { left: -3, right: 3, top: 4, bottom: -3 });
    light.shadow.bias = -.001; light.shadow.normalBias = .025; scene.add(light);
    const fill = new THREE.DirectionalLight(0xd1bbb0, 1.2); fill.position.set(3, 1, -3); scene.add(fill);
    const ivory = new THREE.MeshStandardMaterial({ color: 0xc9c3b6, roughness: .54, metalness: .22 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x383735, roughness: .49, metalness: .5 });
    const accent = new THREE.MeshStandardMaterial({ color: 0xd93f45, roughness: .54, metalness: .25 });
    const metal = new THREE.MeshStandardMaterial({ color: 0x84827b, roughness: .35, metalness: .75 });
    const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0xb77558, roughness: .53, metalness: .08 });
    const padMaterial = new THREE.MeshStandardMaterial({ color: 0x4b4038, roughness: .78, metalness: .12 });
    const padRimMaterial = new THREE.MeshStandardMaterial({ color: 0x987663, roughness: .7, metalness: .22, transparent: true, opacity: .5 });
    const root = new THREE.Group(); root.rotation.y = -.22; scene.add(root);
    function cylinder(parent, top, bottom, height, material, y = 0) {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, height, 48), material);
      mesh.position.y = y; mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
    }
    function box(parent, w, h, d, material, x, y) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      mesh.position.set(x, y, 0); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh);
    }
    function joint(parent, radius) {
      const body = cylinder(parent, radius, radius, .28, dark); body.rotation.x = Math.PI / 2;
      for (const z of [-.153, .153]) {
        const cap = cylinder(parent, radius * .72, radius * .72, .024, accent); cap.rotation.x = Math.PI / 2; cap.position.z = z;
        const center = cylinder(parent, radius * .27, radius * .27, .027, metal); center.rotation.x = Math.PI / 2; center.position.z = z * 1.11;
        for (let i = 0; i < 4; i++) {
          const bolt = cylinder(parent, .014, .014, .018, dark); bolt.rotation.x = Math.PI / 2;
          bolt.position.set(Math.cos(i * Math.PI / 2) * radius * .51, Math.sin(i * Math.PI / 2) * radius * .51, z * 1.1);
        }
      }
    }
    cylinder(root, .37, .4, .075, dark, .045); cylinder(root, .27, .3, .16, ivory, .16); cylinder(root, .245, .245, .06, accent, .27);
    const swivel = new THREE.Group(); swivel.position.y = .31; root.add(swivel); cylinder(swivel, .19, .23, .22, ivory, .1);
    const shoulder = new THREE.Group(); shoulder.position.y = .23; swivel.add(shoulder); joint(shoulder, .195);
    cylinder(shoulder, .115, .16, .79, ivory, .49);
    const elbow = new THREE.Group(); elbow.position.y = .99; shoulder.add(elbow); joint(elbow, .165);
    cylinder(elbow, .095, .125, .74, ivory, .46);
    const wrist = new THREE.Group(); wrist.position.y = .9; elbow.add(wrist); joint(wrist, .12);
    cylinder(wrist, .083, .095, .22, ivory, .19); cylinder(wrist, .08, .08, .085, dark, .34); box(wrist, .25, .09, .16, metal, 0, .42);
    const left = new THREE.Group(), right = new THREE.Group(); wrist.add(left, right);
    for (const [finger, sign] of [[left, -1], [right, 1]]) {
      box(finger, .044, .19, .065, dark, sign * .115, .545); box(finger, .077, .035, .065, dark, sign * .098, .63);
    }
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: .19 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; ground.position.y = -.002; scene.add(ground);
    for (const station of ARM_STATIONS) {
      const x = station.radius * Math.cos(station.yaw), z = -station.radius * Math.sin(station.yaw);
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(.185, .185, ARM_GEOMETRY.padHeight, 48), padMaterial);
      pad.position.set(x, ARM_GEOMETRY.padHeight / 2, z); pad.receiveShadow = true; root.add(pad);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(.151, .005, 6, 48), padRimMaterial);
      rim.rotation.x = -Math.PI / 2; rim.position.set(x, ARM_GEOMETRY.padHeight + .002, z); root.add(rim);
    }
    const cube = new THREE.Mesh(new THREE.BoxGeometry(ARM_GEOMETRY.cubeSide, ARM_GEOMETRY.cubeSide, ARM_GEOMETRY.cubeSide), cubeMaterial);
    cube.castShadow = true; cube.receiveShadow = true; root.add(cube);
    let frame = 0, visible = true, active = playingNow.current, elapsed = 0, last = 0, disposed = false;
    function pose(t) {
      const motion = sampleArmMotion(t);
      swivel.rotation.y = motion.yaw;
      shoulder.rotation.z = motion.joints.shoulder;
      elbow.rotation.z = motion.joints.elbow;
      wrist.rotation.z = motion.joints.wrist;
      left.position.x = -.085 + .03 * motion.grip; right.position.x = -left.position.x;
      cube.position.set(motion.cube.x, motion.cube.y, motion.cube.z);
      cube.rotation.y = motion.cube.yaw;
    }
    function tick(time) {
      frame = 0; if (disposed) return;
      if (last) elapsed += Math.min(time - last, 50) / 1000;
      last = time; pose(elapsed); renderer.render(scene, camera);
      if (active && visible && !document.hidden) frame = requestAnimationFrame(tick);
    }
    function sync() {
      cancelAnimationFrame(frame); frame = 0; last = 0;
      if (active && visible && !document.hidden) frame = requestAnimationFrame(tick);
      else renderer.render(scene, camera);
    }
    control.current = value => { active = value; sync(); };
    const resize = new ResizeObserver(() => {
      const { width, height } = host.getBoundingClientRect(); if (!width || !height) return;
      renderer.setSize(width, height); camera.aspect = width / height;
      const fit = Math.max(1, .88 / camera.aspect);
      camera.position.copy(cameraTarget).add(new THREE.Vector3(5.5, 1.7, 1.5).multiplyScalar(.72 * fit));
      camera.lookAt(cameraTarget); camera.updateProjectionMatrix(); renderer.render(scene, camera);
    }); resize.observe(host);
    const observer = new IntersectionObserver(entries => { visible = entries[entries.length - 1].isIntersecting; sync(); }); observer.observe(host);
    document.addEventListener('visibilitychange', sync); pose(0); sync();
    return () => {
      disposed = true; cancelAnimationFrame(frame); control.current = null;
      resize.disconnect(); observer.disconnect(); document.removeEventListener('visibilitychange', sync);
      const geometries = new Set(), materials = new Set();
      scene.traverse(object => { if (object.geometry) geometries.add(object.geometry); if (object.material) materials.add(object.material); });
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); renderer.forceContextLoss(); renderer.dispose(); renderer.domElement.remove();
    };
  }, []);
  return <div className="arm-hero" role="group" aria-label="Decorative robot arm picking up and placing a cube"><div className="arm-canvas" ref={container}>{fallback && <ArmDrawing />}</div><div className="arm-caption"><span>Pick. Place. Repeat.</span></div></div>;
}
