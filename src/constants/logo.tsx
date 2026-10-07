import React from 'react';

/**
 * Logotipo Oficial de GASTEIZ DE VIGILANCIA (GV)
 * Recreación fiel y nítida del emblema corporativo de image.png:
 * - Escudo triangular con bordes verde y negro
 * - Inscripción superior: GASTEIZ
 * - Inscripción inferior: VIGILANCIA
 * - Escudo interior rojo/degradado con sector de radar blanco
 * - Monograma central "gv" en negro grueso
 */

export const GASTEIZ_LOGO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <defs>
    <!-- Red gradient for the inner shield -->
    <linearGradient id="innerShieldGrad" x1="0%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="#991B1B" />
      <stop offset="35%" stop-color="#DC2626" />
      <stop offset="70%" stop-color="#EA580C" />
      <stop offset="100%" stop-color="#C2410C" />
    </linearGradient>

    <!-- Path for the top text "GASTEIZ" -->
    <path id="topTextArc" d="M 105, 115 A 320,320 0 0,1 395, 115" fill="none" />

    <!-- Path for the bottom text "V I G I L A N C I A" -->
    <path id="bottomTextArc" d="M 85, 240 Q 250, 520 415, 240" fill="none" />
  </defs>

  <!-- Outer Black Shield Shape -->
  <path d="M 250, 18
           C 360, 20  445, 60  475, 135
           C 495, 185 450, 310 370, 400
           C 310, 465 265, 482 250, 482
           C 235, 482 190, 465 130, 400
           C 50,  310 5,   185 25,  135
           C 55,  60  140, 20  250, 18 Z"
        fill="#0A0A0A" />

  <!-- Green Outer Band -->
  <path d="M 250, 35
           C 345, 37  425, 72  452, 142
           C 470, 185 428, 298 355, 382
           C 300, 442 262, 462 250, 462
           C 238, 462 200, 442 145, 382
           C 72,  298 30,  185 48,  142
           C 75,  72  155, 37  250, 35 Z"
        fill="none" stroke="#00A859" stroke-width="22" stroke-linejoin="round" />

  <!-- Thin White Contour inside Green Band -->
  <path d="M 250, 50
           C 335, 52  410, 84  435, 148
           C 452, 188 412, 292 342, 370
           C 292, 426 258, 446 250, 446
           C 242, 446 208, 426 158, 370
           C 88,  292 48,  188 65,  148
           C 90,  84  165, 52  250, 50 Z"
        fill="none" stroke="#FFFFFF" stroke-width="4" />

  <!-- Inner Black Frame Background -->
  <path d="M 250, 54
           C 330, 56  405, 87  428, 150
           C 445, 190 405, 290 338, 366
           C 288, 422 256, 442 250, 442
           C 244, 442 212, 422 162, 366
           C 95,  290 55,  190 72,  150
           C 95,  87  170, 56  250, 54 Z"
        fill="#121212" />

  <!-- Arched Text TOP: GASTEIZ -->
  <text fill="#FFFFFF" font-family="'Arial Black', Impact, Arial, sans-serif" font-size="44" font-weight="900" letter-spacing="4">
    <textPath href="#topTextArc" startOffset="50%" text-anchor="middle">
      GASTEIZ
    </textPath>
  </text>

  <!-- Arched Text BOTTOM: V I G I L A N C I A -->
  <text fill="#FFFFFF" font-family="'Arial Black', Impact, Arial, sans-serif" font-size="42" font-weight="900" letter-spacing="10">
    <textPath href="#bottomTextArc" startOffset="50%" text-anchor="middle">
      VIGILANCIA
    </textPath>
  </text>

  <!-- Central Red Shield with Gradient -->
  <g id="centralShield">
    <!-- Red Triangular Shield -->
    <path d="M 250, 110
             C 310, 110 380, 125 390, 160
             C 400, 195 380, 270 330, 335
             C 290, 385 260, 405 250, 405
             C 240, 405 210, 385 170, 335
             C 120, 270 100, 195 110, 160
             C 120, 125 190, 110 250, 110 Z"
          fill="url(#innerShieldGrad)" />

    <!-- White Sector / Radar Beam Angle at Top-Right -->
    <path d="M 215, 178 L 368, 250" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" />
    <path d="M 215, 178 L 338, 118" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" />
    <!-- Arc for radar angle -->
    <path d="M 315, 226 A 70,70 0 0,0 326, 155" fill="none" stroke="#FFFFFF" stroke-width="11" stroke-linecap="round" />

    <!-- Monogram: "gv" in bold black -->
    <g transform="translate(160, 230)">
      <!-- Letter 'g' -->
      <path d="M 0, 5 C 0, 0 10, -5 28, -5
               C 62, -5 72, 8 72, 38
               L 72, 70
               C 72, 100 55, 115 15, 115
               L 0, 115
               L 0, 88
               L 18, 88
               C 35, 88 42, 82 42, 65
               L 42, 58
               C 36, 68 22, 72 8, 72
               C -15, 72 -28, 55 -28, 32
               C -28, 8 -12, 5 0, 5 Z
               M 24, 22
               C 8, 22 2, 26 2, 36
               C 2, 47 10, 50 24, 50
               C 36, 50 42, 44 42, 36
               C 42, 28 36, 22 24, 22 Z"
            fill="#050505" />

      <!-- Letter 'v' -->
      <path d="M 85, 0
               L 115, 0
               L 135, 68
               L 155, 0
               L 185, 0
               L 152, 95
               L 118, 95 Z"
            fill="#050505" />
    </g>
  </g>
</svg>
`.trim();

export const GASTEIZ_LOGO_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(GASTEIZ_LOGO_SVG)}`;

/**
 * Componente React que renderiza el logotipo oficial con soporte SVG y responsive
 */
export const GasteizLogo: React.FC<{
  className?: string;
  size?: number;
  showText?: boolean;
}> = ({ className = 'w-10 h-10', size, showText = false }) => {
  return (
    <div className={`inline-flex items-center gap-2 select-none shrink-0 ${className}`}>
      <img
        src={GASTEIZ_LOGO_DATA_URL}
        alt="Gasteiz de Vigilancia"
        className="w-full h-full object-contain filter drop-shadow-md"
        style={size ? { width: size, height: size } : undefined}
      />
      {showText && (
        <div className="flex flex-col leading-none">
          <span className="font-black text-slate-900 tracking-tight text-sm uppercase">
            GASTEIZ DE VIGILANCIA
          </span>
          <span className="text-[10px] font-bold text-emerald-600 tracking-widest">
            SEGURIDAD PRIVADA
          </span>
        </div>
      )}
    </div>
  );
};
