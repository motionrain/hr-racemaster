// src/components/QrCodeModal.tsx
'use client';

import React, { useMemo } from 'react';
import { Smartphone, X } from 'lucide-react';

function gfMul(x: number, y: number): number {
  let r = 0;
  for (let i = 0; i < 8; i++) {
    if ((y >> i) & 1) r ^= x << i;
  }
  for (let i = 15; i >= 8; i--) {
    if ((r >> i) & 1) r ^= 0x11d << (i - 8);
  }
  return r;
}

function rsEncode(data: number[], nsym: number): number[] {
  let g = [1];
  for (let i = 0; i < nsym; i++) {
    const ng = new Array(g.length + 1).fill(0);
    let factor = 1;
    for (let k = 0; k < i; k++) factor = gfMul(factor, 2);
    for (let j = 0; j < g.length; j++) {
      ng[j] ^= g[j];
      ng[j + 1] ^= gfMul(g[j], factor);
    }
    g = ng;
  }
  const res = [...data, ...new Array(nsym).fill(0)];
  for (let i = 0; i < data.length; i++) {
    const coef = res[i];
    if (coef !== 0) {
      for (let j = 1; j < g.length; j++) {
        res[i + j] ^= gfMul(g[j], coef);
      }
    }
  }
  return res.slice(data.length);
}

export function buildQrMatrix(text: string): number[][] {
  const raw: number[] = [];
  const clean = text.slice(0, 53);
  for (let i = 0; i < clean.length; i++) {
    raw.push(clean.charCodeAt(i) & 0xff);
  }

  const bits: number[] = [0, 1, 0, 0];
  for (let i = 7; i >= 0; i--) bits.push((raw.length >> i) & 1);
  for (let idx = 0; idx < raw.length; idx++) {
    for (let i = 7; i >= 0; i--) bits.push((raw[idx] >> i) & 1);
  }

  const maxBits = 55 * 8;
  for (let i = 0; i < 4 && bits.length < maxBits; i++) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);

  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let bVal = 0;
    for (let b = 0; b < 8; b++) bVal = (bVal << 1) | bits[i + b];
    data.push(bVal);
  }

  const pads = [0xec, 0x11];
  let pIdx = 0;
  while (data.length < 55) {
    data.push(pads[pIdx++ % 2]);
  }

  const codewords = [...data, ...rsEncode(data, 15)];
  const allBits: number[] = [];
  for (let i = 0; i < codewords.length; i++) {
    for (let b = 7; b >= 0; b--) allBits.push((codewords[i] >> b) & 1);
  }
  for (let i = 0; i < 7; i++) allBits.push(0);

  const size = 29;
  const mat: number[][] = Array.from({ length: size }, () => new Array(size).fill(0));
  const isFunc: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));

  const setFunc = (r: number, c: number, val: boolean) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      mat[r][c] = val ? 1 : 0;
      isFunc[r][c] = true;
    }
  };

  const finder = (r0: number, c0: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const in7 = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const in5 = dr >= 1 && dr <= 5 && dc >= 1 && dc <= 5;
        const in3 = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        setFunc(r0 + dr, c0 + dc, in7 && (!in5 || in3));
      }
    }
  };

  finder(0, 0);
  finder(0, size - 7);
  finder(size - 7, 0);

  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      setFunc(22 + dr, 22 + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
    }
  }

  for (let i = 8; i < size - 8; i++) {
    setFunc(6, i, i % 2 === 0);
    setFunc(i, 6, i % 2 === 0);
  }

  for (let i = 0; i < 9; i++) {
    if (!isFunc[8][i]) setFunc(8, i, false);
    if (!isFunc[i][8]) setFunc(i, 8, false);
  }
  for (let i = 0; i < 8; i++) {
    if (!isFunc[8][size - 1 - i]) setFunc(8, size - 1 - i, false);
    if (!isFunc[size - 1 - i][8]) setFunc(size - 1 - i, 8, false);
  }
  setFunc(size - 8, 8, true);

  let bitIdx = 0;
  let up = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    for (let i = 0; i < size; i++) {
      const r = up ? size - 1 - i : i;
      for (let dc = 0; dc < 2; dc++) {
        const c = col - dc;
        if (!isFunc[r][c]) {
          let v = bitIdx < allBits.length ? allBits[bitIdx++] : 0;
          if ((r + c) % 2 === 0) v ^= 1;
          mat[r][c] = v;
        }
      }
    }
    up = !up;
  }

  const fmt = 0x77c4;
  const tl = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  ];
  for (let i = 0; i < 15; i++) {
    mat[tl[i][0]][tl[i][1]] = (fmt >> (14 - i)) & 1;
  }
  for (let i = 0; i < 7; i++) {
    mat[size - 1 - i][8] = (fmt >> (14 - i)) & 1;
  }
  for (let i = 0; i < 8; i++) {
    mat[8][size - 8 + i] = (fmt >> (7 - i)) & 1;
  }

  return mat;
}

export function QrCodeSvg({ url, sizePx = 220 }: { url: string; sizePx?: number }) {
  const matrix = useMemo(() => buildQrMatrix(url || 'http://localhost:3000/mobile'), [url]);
  const border = 3;
  const total = matrix.length + border * 2;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${total} ${total}`}
      width={sizePx}
      height={sizePx}
      shapeRendering="crispEdges"
      className="rounded-xl bg-white p-1 shadow-md border-2 border-amber-500/40"
    >
      <rect width="100%" height="100%" fill="#ffffff" />
      {matrix.map((row, r) =>
        row.map((val, c) =>
          val ? (
            <rect
              key={`${r}-${c}`}
              x={c + border}
              y={r + border}
              width={1}
              height={1}
              fill="#000000"
            />
          ) : null
        )
      )}
    </svg>
  );
}

interface QrCodeModalProps {
  open: boolean;
  onClose: () => void;
  mobileUrl: string;
}

export default function QrCodeModal({ open, onClose, mobileUrl }: QrCodeModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 print:hidden"
      onClick={onClose}
    >
      <div
        className="bg-[#1A1A1A] border-2 border-amber-500 rounded-2xl p-6 max-w-sm w-full text-center text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 text-amber-400 font-black text-base">
            <Smartphone className="w-5 h-5" />
            <span>SMARTPHONE CHECK-IN</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#272727] hover:bg-[#404040] text-neutral-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-neutral-400 mb-4">
          Handy-Kamera im selben WLAN öffnen und QR-Code scannen, um Fahrer live einzutragen:
        </p>

        <div className="flex justify-center mb-4">
          <QrCodeSvg url={mobileUrl} sizePx={250} />
        </div>

        <div className="font-mono text-xs bg-[#272727] border border-[#404040] text-emerald-400 font-bold py-2.5 px-3 rounded-xl break-all mb-4">
          {mobileUrl}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm transition"
        >
          Schließen
        </button>
      </div>
    </div>
  );
}
