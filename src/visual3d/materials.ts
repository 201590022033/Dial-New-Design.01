import * as THREE from 'three';

export const visualMaterials = {
  'brushed-steel': () => new THREE.MeshStandardMaterial({ color: '#aeb7c2', metalness: 0.85, roughness: 0.34 }),
  'polished-steel': () => new THREE.MeshStandardMaterial({ color: '#e5e7eb', metalness: 0.95, roughness: 0.12 }),
  'black-pvd': () => new THREE.MeshStandardMaterial({ color: '#16181b', metalness: 0.8, roughness: 0.24 }),
  brass: () => new THREE.MeshStandardMaterial({ color: '#b98945', metalness: 0.75, roughness: 0.3 }),
  dial: (color = '#111827') => new THREE.MeshStandardMaterial({ color, metalness: 0.1, roughness: 0.52 }),
  sapphire: () => new THREE.MeshPhysicalMaterial({ color: '#bfe8ff', metalness: 0, roughness: 0.08, transmission: 0.28, transparent: true, opacity: 0.32, thickness: 0.4 }),
  lume: () => new THREE.MeshStandardMaterial({ color: '#d9ffd0', emissive: '#8cff72', emissiveIntensity: 0.8 })
};
