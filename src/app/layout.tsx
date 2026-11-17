import './globals.css';
import React from 'react';

export const metadata = {
  title: 'HR-RaceMaster | Kartbahn Rheinfelden',
  description: 'Modulares Kart Event, KartRolling & KaRaS Live-Timing System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <style>{`
          @media print {
            #hr-qr-floating-root { display: none !important; }
          }
        `}</style>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('unhandledrejection', function(e) {
                if (!e || !e.reason || e.reason instanceof Event || Object.prototype.toString.call(e.reason) === '[object Event]') {
                  e.preventDefault();
                  e.stopImmediatePropagation();
                }
              }, true);
              window.addEventListener('error', function(e) {
                if (e && (e.error instanceof Event || Object.prototype.toString.call(e.error) === '[object Event]')) {
                  e.preventDefault();
                  e.stopImmediatePropagation();
                }
              }, true);

              function generateQrSvg(text) {
                function gfMul(x, y) {
                  var r = 0;
                  for (var i = 0; i < 8; i++) if ((y >> i) & 1) r ^= x << i;
                  for (var i = 15; i >= 8; i--) if ((r >> i) & 1) r ^= 0x11d << (i - 8);
                  return r;
                }
                function rsEncode(data, nsym) {
                  var g = [1];
                  for (var i = 0; i < nsym; i++) {
                    var ng = new Array(g.length + 1).fill(0);
                    var factor = 1;
                    for (var k = 0; k < i; k++) factor = gfMul(factor, 2);
                    for (var j = 0; j < g.length; j++) {
                      ng[j] ^= g[j];
                      ng[j + 1] ^= gfMul(g[j], factor);
                    }
                    g = ng;
                  }
                  var res = data.slice().concat(new Array(nsym).fill(0));
                  for (var i = 0; i < data.length; i++) {
                    var coef = res[i];
                    if (coef !== 0) {
                      for (var j = 1; j < g.length; j++) res[i + j] ^= gfMul(g[j], coef);
                    }
                  }
                  return res.slice(data.length);
                }

                var raw = [];
                for (var i = 0; i < Math.min(text.length, 53); i++) raw.push(text.charCodeAt(i) & 0xff);
                var bits = [0, 1, 0, 0];
                for (var i = 7; i >= 0; i--) bits.push((raw.length >> i) & 1);
                for (var idx = 0; idx < raw.length; idx++) {
                  for (var i = 7; i >= 0; i--) bits.push((raw[idx] >> i) & 1);
                }
                var maxBits = 55 * 8;
                for (var i = 0; i < 4 && bits.length < maxBits; i++) bits.push(0);
                while (bits.length % 8 !== 0) bits.push(0);

                var data = [];
                for (var i = 0; i < bits.length; i += 8) {
                  var byteVal = 0;
                  for (var b = 0; b < 8; b++) byteVal = (byteVal << 1) | bits[i + b];
                  data.push(byteVal);
                }
                var pads = [0xec, 0x11], pIdx = 0;
                while (data.length < 55) data.push(pads[pIdx++ % 2]);

                var codewords = data.concat(rsEncode(data, 15));
                var allBits = [];
                for (var i = 0; i < codewords.length; i++) {
                  for (var b = 7; b >= 0; b--) allBits.push((codewords[i] >> b) & 1);
                }
                for (var i = 0; i < 7; i++) allBits.push(0);

                var size = 29;
                var mat = Array.from({ length: size }, function() { return new Array(size).fill(0); });
                var isFunc = Array.from({ length: size }, function() { return new Array(size).fill(false); });

                function setFunc(r, c, val) {
                  if (r >= 0 && r < size && c >= 0 && c < size) {
                    mat[r][c] = val ? 1 : 0;
                    isFunc[r][c] = true;
                  }
                }
                function finder(r0, c0) {
                  for (var dr = -1; dr <= 7; dr++) {
                    for (var dc = -1; dc <= 7; dc++) {
                      var in7 = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
                      var in5 = dr >= 1 && dr <= 5 && dc >= 1 && dc <= 5;
                      var in3 = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
                      setFunc(r0 + dr, c0 + dc, in7 && (!in5 || in3));
                    }
                  }
                }
                finder(0, 0);
                finder(0, size - 7);
                finder(size - 7, 0);

                for (var dr = -2; dr <= 2; dr++) {
                  for (var dc = -2; dc <= 2; dc++) {
                    setFunc(22 + dr, 22 + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
                  }
                }
                for (var i = 8; i < size - 8; i++) {
                  setFunc(6, i, i % 2 === 0);
                  setFunc(i, 6, i % 2 === 0);
                }
                for (var i = 0; i < 9; i++) {
                  if (!isFunc[8][i]) setFunc(8, i, 0);
                  if (!isFunc[i][8]) setFunc(i, 8, 0);
                }
                for (var i = 0; i < 8; i++) {
                  if (!isFunc[8][size - 1 - i]) setFunc(8][size - 1 - i, 0);
                  if (!isFunc[size - 1 - i][8]) setFunc(size - 1 - i, 8, 0);
                }
                setFunc(size - 8, 8, 1);

                var bitIdx = 0, up = true;
                for (var col = size - 1; col > 0; col -= 2) {
                  if (col === 6) col--;
                  for (var i = 0; i < size; i++) {
                    var r = up ? size - 1 - i : i;
                    for (var dc = 0; dc < 2; dc++) {
                      var c = col - dc;
                      if (!isFunc[r][c]) {
                        var v = bitIdx < allBits.length ? allBits[bitIdx++] : 0;
                        if ((r + c) % 2 === 0) v ^= 1;
                        mat[r][c] = v;
                      }
                    }
                  }
                  up = !up;
                }

                var fmt = 0x77c4;
                var tl = [[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]];
                for (var i = 0; i < 15; i++) mat[tl[i][0]][tl[i][1]] = (fmt >> (14 - i)) & 1;
                for (var i = 0; i < 7; i++) mat[size - 1 - i][8] = (fmt >> (14 - i)) & 1;
                for (var i = 0; i < 8; i++) mat[8][size - 8 + i] = (fmt >> (7 - i)) & 1;

                var border = 3, total = size + border * 2;
                var rects = '';
                for (var r = 0; r < size; r++) {
                  for (var c = 0; c < size; c++) {
                    if (mat[r][c]) rects += '<rect x="' + (c + border) + '" y="' + (r + border) + '" width="1" height="1" fill="#000"/>';
                  }
                }
                return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + ' ' + total + '" width="260" height="260" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff" rx="2"/>' + rects + '</svg>';
              }

              window.addEventListener('DOMContentLoaded', function() {
                if (window.location.pathname.indexOf('/mobile') === 0) return;

                var root = document.createElement('div');
                root.id = 'hr-qr-floating-root';
                root.innerHTML =
                  '<button id="hr-qr-btn" style="position:fixed;bottom:18px;right:18px;z-index:9998;background:#dc2626;color:#fff;border:2px solid #f87171;border-radius:10px;padding:10px 16px;font-weight:800;font-size:14px;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,0.5);">📱 Mobile QR-Code</button>' +
                  '<div id="hr-qr-modal" style="display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.82);align-items:center;justify-content:center;">' +
                    '<div style="background:#18181b;border:2px solid #dc2626;border-radius:16px;padding:24px 28px;max-width:380px;width:92%;text-align:center;color:#fff;box-shadow:0 15px 40px rgba(0,0,0,0.8);">' +
                      '<div style="font-size:18px;font-weight:900;margin-bottom:4px;color:#f87171;">📱 SMARTPHONE CHECK-IN</div>' +
                      '<div style="font-size:12px;color:#a1a1aa;margin-bottom:16px;">Kamera öffnen & scannen (gleiches WLAN)</div>' +
                      '<div id="hr-qr-svg-box" style="display:flex;justify-content:center;margin-bottom:14px;"></div>' +
                      '<div id="hr-qr-url-text" style="font-family:monospace;font-size:13px;background:#27272a;padding:8px 10px;border-radius:8px;color:#4ade80;word-break:break-all;margin-bottom:16px;">Lade IP...</div>' +
                      '<button id="hr-qr-close" style="background:#3f3f46;color:#fff;border:none;border-radius:8px;padding:8px 22px;font-weight:700;cursor:pointer;width:100%;">Schließen</button>' +
                    '</div>' +
                  '</div>';
                document.body.appendChild(root);

                var btn = document.getElementById('hr-qr-btn');
                var modal = document.getElementById('hr-qr-modal');
                var closeBtn = document.getElementById('hr-qr-close');
                var svgBox = document.getElementById('hr-qr-svg-box');
                var urlText = document.getElementById('hr-qr-url-text');

                function updateQr() {
                  fetch('/api/event', { cache: 'no-store' })
                    .then(function(r) { return r.json(); })
                    .then(function(d) {
                      var url = d && d.mobileUrl ? d.mobileUrl : ('http://' + window.location.hostname + ':3000/mobile');
                      urlText.textContent = url;
                      svgBox.innerHTML = generateQrSvg(url);
                    })
                    .catch(function() {
                      var fallback = 'http://' + window.location.hostname + ':3000/mobile';
                      urlText.textContent = fallback;
                      svgBox.innerHTML = generateQrSvg(fallback);
                    });
                }

                btn.addEventListener('click', function() {
                  updateQr();
                  modal.style.display = 'flex';
                });
                closeBtn.addEventListener('click', function() {
                  modal.style.display = 'none';
                });
                modal.addEventListener('click', function(e) {
                  if (e.target === modal) modal.style.display = 'none';
                });
              });
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}