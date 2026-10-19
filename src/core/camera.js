import { WW, WH } from '../config/constants.js';
import { S } from './state.js';

export const screenToWorld = (sx, sy) => ({ x: sx / S.cam.z + S.cam.x, y: sy / S.cam.z + S.cam.y });

export function clampCam() {
  const { cam, view } = S, vw = view.w / cam.z, vh = view.h / cam.z;
  cam.x = vw >= WW ? (WW - vw) / 2 : Math.max(0, Math.min(WW - vw, cam.x));
  cam.y = vh >= WH ? (WH - vh) / 2 : Math.max(0, Math.min(WH - vh, cam.y));
}

export function centerOn(x, y) {
  S.cam.x = x - S.view.w / S.cam.z / 2;
  S.cam.y = y - S.view.h / S.cam.z / 2;
  clampCam();
}

export const vis = (x, y, w, h) =>
  x + w > S.cam.x && y + h > S.cam.y && x < S.cam.x + S.view.w / S.cam.z && y < S.cam.y + S.view.h / S.cam.z;
