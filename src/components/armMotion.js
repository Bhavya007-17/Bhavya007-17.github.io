// Motion is expressed in the rotating base's horizontal radius and height.
// The gripper stays vertical, so the same wrist target works at every yaw.
export const ARM_MOTION_DURATION = 11.4;
export const ARM_STATIONS = [
  { radius: 1.1, yaw: -0.68 },
  { radius: 1.1, yaw: 0.62 },
];

export const ARM_GEOMETRY = {
  shoulderY: 0.54,
  upperLength: 0.99,
  forearmLength: 0.9,
  gripperOffset: 0.585,
  cubeSide: 0.23,
  padHeight: 0.02,
};

const CUBE_CENTER_Y = ARM_GEOMETRY.padHeight + ARM_GEOMETRY.cubeSide / 2;
const CARRY_Y = 0.9;
const { shoulderY: SHOULDER_Y, upperLength: UPPER_LENGTH, forearmLength: FOREARM_LENGTH, gripperOffset: GRIPPER_OFFSET } = ARM_GEOMETRY;

const keys = [
  [0, 0, CARRY_Y, 0],
  [0.7, 0, CARRY_Y, 0],
  [1.5, 0, CUBE_CENTER_Y, 0],
  [1.85, 0, CUBE_CENTER_Y, 1],
  [2.55, 0, CARRY_Y, 1],
  [3.8, 1, CARRY_Y, 1],
  [4.6, 1, CUBE_CENTER_Y, 1],
  [4.95, 1, CUBE_CENTER_Y, 0],
  [5.65, 1, CARRY_Y, 0],
  [6.1, 1, CARRY_Y, 0],
  [6.9, 1, CUBE_CENTER_Y, 0],
  [7.25, 1, CUBE_CENTER_Y, 1],
  [7.95, 1, CARRY_Y, 1],
  [9.2, 0, CARRY_Y, 1],
  [10, 0, CUBE_CENTER_Y, 1],
  [10.35, 0, CUBE_CENTER_Y, 0],
  [11.05, 0, CARRY_Y, 0],
  [ARM_MOTION_DURATION, 0, CARRY_Y, 0],
];

const ease = value => value * value * (3 - 2 * value);
const mix = (a, b, amount) => a + (b - a) * amount;

export function solveArmIK(radius, gripY) {
  const dx = radius;
  const dy = gripY + GRIPPER_OFFSET - SHOULDER_Y;
  const distance = Math.hypot(dx, dy);
  const upperFromHorizontal = Math.atan2(dy, dx) + Math.acos(
    (distance * distance + UPPER_LENGTH * UPPER_LENGTH - FOREARM_LENGTH * FOREARM_LENGTH) /
    (2 * distance * UPPER_LENGTH)
  );
  const shoulder = upperFromHorizontal - Math.PI / 2;
  const elbow = Math.atan2(dy - UPPER_LENGTH * Math.sin(upperFromHorizontal), dx - UPPER_LENGTH * Math.cos(upperFromHorizontal)) - upperFromHorizontal;
  return { shoulder, elbow, wrist: Math.PI - shoulder - elbow };
}

export function sampleArmMotion(seconds) {
  const time = ((seconds % ARM_MOTION_DURATION) + ARM_MOTION_DURATION) % ARM_MOTION_DURATION;
  let index = 0;
  while (index < keys.length - 2 && time > keys[index + 1][0]) index++;
  const from = keys[index], to = keys[index + 1];
  const amount = ease((time - from[0]) / (to[0] - from[0]));
  const station = mix(from[1], to[1], amount);
  const radius = mix(ARM_STATIONS[0].radius, ARM_STATIONS[1].radius, station);
  const yaw = mix(ARM_STATIONS[0].yaw, ARM_STATIONS[1].yaw, station);
  const gripY = mix(from[2], to[2], amount);
  const grip = mix(from[3], to[3], amount);
  const holding = (time >= 1.85 && time < 4.95) || (time >= 7.25 && time < 10.35);
  const cubeStation = time < 4.95 || time >= 10.35 ? ARM_STATIONS[0] : ARM_STATIONS[1];
  const cubeRadius = holding ? radius : cubeStation.radius;
  const cubeYaw = holding ? yaw : cubeStation.yaw;
  const cubeY = holding ? gripY : CUBE_CENTER_Y;
  return {
    radius, yaw, gripY, grip, holding,
    cube: { x: cubeRadius * Math.cos(cubeYaw), y: cubeY, z: -cubeRadius * Math.sin(cubeYaw), yaw: cubeYaw },
    joints: solveArmIK(radius, gripY),
  };
}
