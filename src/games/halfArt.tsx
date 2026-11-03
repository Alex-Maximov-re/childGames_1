import { useId, type ReactNode } from 'react'

type ArtProps = { uid: string }

function Meadow() {
  return (
    <g>
      <rect width="320" height="156" fill="#cfeeff" />
      <circle cx="38" cy="32" r="16" fill="#ffe08a" />
      <circle cx="38" cy="32" r="22" fill="#ffe08a" opacity="0.35" />
      <ellipse cx="78" cy="28" rx="22" ry="10" fill="#fff" opacity="0.92" />
      <ellipse cx="98" cy="32" rx="14" ry="8" fill="#fff" opacity="0.8" />
      <ellipse cx="236" cy="26" rx="26" ry="11" fill="#fff" opacity="0.92" />
      <ellipse cx="262" cy="32" rx="16" ry="8" fill="#fff" opacity="0.75" />
      <ellipse cx="160" cy="132" rx="210" ry="40" fill="#b7e38a" />
      <rect y="122" width="320" height="34" fill="#67b84e" />
      <path d="M0 122 C40 112 80 124 120 116 C160 112 200 124 240 116 C280 112 300 120 320 122 V132 H0 Z" fill="#8ed56a" />
      <Tuft x={18} />
      <Tuft x={96} />
      <Tuft x={196} />
      <Tuft x={274} />
    </g>
  )
}

function Tuft({ x }: { x: number }) {
  return <path d={`M${x} 126 C${x + 4} 112 ${x + 8} 114 ${x + 10} 126 C${x + 14} 114 ${x + 18} 116 ${x + 20} 126 Z`} fill="#4f9e3d" />
}

function Shadow({ cx, rx }: { cx: number | string; rx: number | string }) {
  return <ellipse cx={cx} cy="128" rx={rx} ry="6" fill="#2f6a28" opacity="0.22" />
}

function Soft({ uid, children }: { uid: string; children: ReactNode }) {
  return <g filter={`url(#${uid}-soft)`}>{children}</g>
}

function Eye({
  x,
  y,
  s = 1,
  iris = '#fff',
  cat = false,
  slit = false,
}: {
  x: number | string
  y: number | string
  s?: number | string
  iris?: string
  cat?: boolean
  slit?: boolean
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="0" rx={cat ? 8.2 : 7.4} ry={cat ? 6.4 : 7.8} fill="#fff" />
      <ellipse cx="0.3" cy="0.2" rx={cat ? 5.4 : 4.8} ry={cat ? 5.5 : 5.2} fill={iris} />
      {slit ? (
        <rect x="-3.4" y="-1.15" width="6.8" height="2.5" rx="1.1" fill="#241c18" />
      ) : (
        <ellipse cx="0.8" cy="0.3" rx={cat ? 1.45 : 3.1} ry={cat ? 4.5 : 3.3} fill="#241c18" />
      )}
      <circle cx="2.3" cy="-1.6" r="1.35" fill="#fff" />
    </g>
  )
}

function Nose({ x, y, fill, w = 9, h = 6.4 }: { x: number | string; y: number | string; fill: string; w?: number | string; h?: number | string }) {
  const nx = Number(x)
  const ny = Number(y)
  const nw = Number(w)
  const nh = Number(h)
  return (
    <g>
      <ellipse cx={nx} cy={ny} rx={nw} ry={nh} fill={fill} />
      <ellipse cx={nx - nw * 0.28} cy={ny - nh * 0.3} rx={nw * 0.22} ry={nh * 0.18} fill="#fff" opacity="0.5" />
    </g>
  )
}

function Whiskers({ x, y }: { x: number | string; y: number | string }) {
  const nx = Number(x)
  const ny = Number(y)
  return (
    <g stroke="#2a2340" strokeWidth="1.35" strokeLinecap="round" fill="none" opacity="0.75">
      <path d={`M${nx} ${ny} L${nx - 36} ${ny - 8}`} />
      <path d={`M${nx} ${ny + 5} L${nx - 38} ${ny + 5}`} />
      <path d={`M${nx} ${ny + 10} L${nx - 34} ${ny + 16}`} />
    </g>
  )
}

function Bridge({ color }: { color: string }) {
  return <path d="M96 74 C128 52 168 58 208 78 L204 116 C164 108 124 112 92 102 Z" fill={color} />
}

function Paw({
  x,
  y = 104,
  w = 13,
  h = 26,
  color,
  hoof,
}: {
  x: number
  y?: number
  w?: number
  h?: number
  color: string
  hoof: string
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={w / 2} fill={color} />
      <rect x={x - 0.4} y={y + h - 7} width={w + 0.8} height={8} rx="3" fill={hoof} />
    </g>
  )
}

function Cow({ uid }: ArtProps) {
  return (
    <g>
      <Shadow cx="196" rx="78" />
      <Soft uid={uid}>
        <Bridge color="#f7f4ee" />
        <path d="M268 82 C292 92 296 116 278 126" fill="none" stroke="#f7f4ee" strokeWidth="5" strokeLinecap="round" />
        <circle cx="276" cy="128" r="6.5" fill="#2c2a33" />
        <Paw x={158} y={106} h={24} w={14} color="#f7f4ee" hoof="#2c2a33" />
        <Paw x={182} y={108} h={22} w={14} color="#f4f1ea" hoof="#2c2a33" />
        <Paw x={224} y={106} h={24} w={14} color="#f7f4ee" hoof="#2c2a33" />
        <Paw x={250} y={108} h={22} w={13} color="#f4f1ea" hoof="#2c2a33" />
        <path d="M150 112 C148 78 176 62 214 60 C256 58 294 76 292 100 C290 120 256 130 214 128 C176 130 152 124 150 112 Z" fill="#f7f4ee" />
        <path d="M176 74 C214 64 258 68 286 86 C252 72 210 70 176 84 Z" fill="#d9d3c6" opacity="0.65" />
        <ellipse cx="198" cy="112" rx="28" ry="12" fill="#fff" opacity="0.7" />
        <ellipse cx="188" cy="82" rx="15" ry="11" fill="#2c2a33" />
        <ellipse cx="232" cy="96" rx="17" ry="12" fill="#2c2a33" />
        <ellipse cx="206" cy="108" rx="9" ry="7" fill="#2c2a33" />
        <ellipse cx="256" cy="82" rx="8" ry="6" fill="#2c2a33" />
        <ellipse cx="186" cy="122" rx="15" ry="8" fill="#f3b7c6" />
        <circle cx="178" cy="128" r="2.3" fill="#e07d90" />
        <circle cx="186" cy="130" r="2.3" fill="#e07d90" />
        <circle cx="194" cy="128" r="2.3" fill="#e07d90" />
        <path d="M116 92 C140 108 156 114 172 106 L176 90 C152 76 130 72 112 82 Z" fill="#f7f4ee" />
        <path d="M78 50 C72 30 88 26 92 44" fill="#efe0c0" />
        <path d="M98 48 C108 28 124 32 114 48" fill="#efe0c0" />
        <ellipse cx="118" cy="66" rx="12" ry="8" transform="rotate(-24 118 66)" fill="#f7f4ee" />
        <ellipse cx="118" cy="67" rx="7" ry="4" transform="rotate(-24 118 67)" fill="#f3b7c6" />
        <path d="M128 72 C124 50 98 40 74 48 C52 56 34 74 36 94 C30 102 24 112 32 118 C48 128 78 124 96 116 C112 124 132 112 134 96 C136 84 132 78 128 72 Z" fill="#f7f4ee" />
        <ellipse cx="100" cy="62" rx="9" ry="6.5" fill="#2c2a33" />
        <ellipse cx="52" cy="102" rx="18" ry="13" fill="#f6c5d2" />
        <ellipse cx="44" cy="99" rx="2.4" ry="3.3" fill="#c45b78" />
        <ellipse cx="56" cy="99" rx="2.4" ry="3.3" fill="#c45b78" />
        <path d="M38 108 Q52 116 66 108" fill="none" stroke="#c45b78" strokeWidth="1.7" strokeLinecap="round" />
        <Eye x="82" y="78" iris="#3a342f" />
      </Soft>
    </g>
  )
}

function Dog({ uid }: ArtProps) {
  return (
    <g>
      <Shadow cx="192" rx="74" />
      <Soft uid={uid}>
        <Bridge color="#d0893e" />
        <path d="M252 84 C292 58 312 90 290 114" fill="none" stroke="#e2ac64" strokeWidth="13" strokeLinecap="round" />
        <Paw x={160} color="#c47a3a" hoof="#6a3e22" />
        <Paw x={184} color="#d0893e" hoof="#6a3e22" />
        <Paw x={226} color="#c47a3a" hoof="#6a3e22" />
        <Paw x={250} color="#d0893e" hoof="#6a3e22" />
        <path d="M154 108 C150 76 178 62 216 60 C256 58 292 76 288 100 C284 120 252 128 214 124 C178 128 156 120 154 108 Z" fill="#d0893e" />
        <path d="M176 74 C214 64 258 68 282 86 C250 72 206 70 176 84 Z" fill="#a86428" opacity="0.28" />
        <ellipse cx="200" cy="110" rx="34" ry="12" fill="#f3d7b0" />
        <path d="M122 86 C146 102 160 110 174 102 L176 86 C156 72 136 68 118 76 Z" fill="#c47a3a" />
        <path d="M112 56 C132 48 146 72 134 102 C122 112 106 96 110 74 Z" fill="#b56a2c" />
        <path d="M116 64 C128 62 134 80 126 96 C118 102 112 90 114 74 Z" fill="#f0c2aa" />
        <path d="M136 70 C130 48 104 40 78 48 C54 56 34 74 38 94 L24 100 C18 106 22 118 36 118 C60 128 102 122 122 106 C132 98 138 84 136 70 Z" fill="#d0893e" />
        <ellipse cx="112" cy="98" rx="16" ry="10" fill="#f3d7b0" />
        <Eye x="84" y="72" iris="#8a5a32" />
        <Nose x={32} y={102} fill="#2a2340" />
        <path d="M40 110 Q54 116 68 108" fill="none" stroke="#6a3a28" strokeWidth="1.6" strokeLinecap="round" />
      </Soft>
    </g>
  )
}

function Cat({ uid }: ArtProps) {
  return (
    <g>
      <Shadow cx="186" rx="66" />
      <Soft uid={uid}>
        <Bridge color="#e39b3a" />
        <path d="M248 98 C272 104 292 82 274 62 C262 48 250 66 260 78" fill="none" stroke="#e39b3a" strokeWidth="8" strokeLinecap="round" />
        <Paw x={156} y={108} h={22} w={10} color="#e39b3a" hoof="#c47a28" />
        <Paw x={174} y={110} h={20} w={10} color="#f0b25a" hoof="#c47a28" />
        <Paw x={214} y={108} h={22} w={10} color="#e39b3a" hoof="#c47a28" />
        <Paw x={232} y={110} h={20} w={10} color="#f0b25a" hoof="#c47a28" />
        <path d="M150 108 C148 82 170 68 206 66 C242 64 272 80 268 102 C264 118 236 126 204 122 C172 126 152 118 150 108 Z" fill="#e39b3a" />
        <ellipse cx="198" cy="110" rx="28" ry="11" fill="#fff1d4" />
        <path d="M176 80 Q186 98 174 112" fill="none" stroke="#8c5a2a" strokeWidth="3" strokeLinecap="round" />
        <path d="M196 76 Q208 98 194 114" fill="none" stroke="#8c5a2a" strokeWidth="3" strokeLinecap="round" />
        <path d="M216 78 Q226 98 214 112" fill="none" stroke="#8c5a2a" strokeWidth="3" strokeLinecap="round" />
        <path d="M118 88 C138 102 154 108 166 100 L164 86 C146 74 128 72 114 80 Z" fill="#e39b3a" />
        <polygon points="78,64 60,30 96,54" fill="#e39b3a" />
        <polygon points="112,58 132,26 120,58" fill="#e39b3a" />
        <polygon points="80,58 70,36 92,54" fill="#f4b6b0" />
        <polygon points="112,54 124,34 118,56" fill="#f4b6b0" />
        <path d="M132 72 C126 52 100 44 76 54 C54 64 42 82 50 98 C40 104 36 114 48 118 C66 126 100 120 116 108 C128 100 134 86 132 72 Z" fill="#e39b3a" />
        <path d="M76 60 L84 74 L94 62 L104 74 L112 60" fill="none" stroke="#8c5a2a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <Eye x="86" y="76" s={0.95} iris="#c6d86a" cat />
        <Nose x={70} y={96} fill="#f2a0a8" w={6} h={4.4} />
        <Whiskers x={66} y={98} />
        <path d="M62 104 Q74 110 88 104" fill="none" stroke="#a86a58" strokeWidth="1.4" strokeLinecap="round" />
      </Soft>
    </g>
  )
}

function Horse({ uid }: ArtProps) {
  return (
    <g>
      <Shadow cx="198" rx="86" />
      <Soft uid={uid}>
        <Bridge color="#8c5a32" />
        <path d="M270 72 C308 86 304 122 286 134" stroke="#3a2a22" strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M272 78 C300 98 294 126 278 134" stroke="#4a3428" strokeWidth="4" fill="none" strokeLinecap="round" />
        <Paw x={156} y={96} h={34} w={11} color="#8c5a32" hoof="#2a211c" />
        <Paw x={180} y={98} h={32} w={11} color="#9a6840" hoof="#2a211c" />
        <Paw x={230} y={96} h={34} w={11} color="#8c5a32" hoof="#2a211c" />
        <Paw x={254} y={98} h={32} w={11} color="#9a6840" hoof="#2a211c" />
        <path d="M150 104 C146 72 178 58 222 56 C266 54 300 72 296 96 C292 116 258 124 214 120 C174 122 152 116 150 104 Z" fill="#8c5a32" />
        <path d="M170 74 C214 60 264 64 292 82 C258 68 210 66 170 82 Z" fill="#6e4426" opacity="0.4" />
        <ellipse cx="198" cy="108" rx="26" ry="10" fill="#c9956a" opacity="0.55" />
        <path d="M112 64 C150 82 162 100 176 102 L184 80 C158 60 132 48 108 56 Z" fill="#8c5a32" />
        <path d="M116 68 C146 46 186 48 228 66 C200 56 156 58 120 76 Z" fill="#3a2a22" />
        <polygon points="108,52 98,28 122,46" fill="#8c5a32" />
        <polygon points="108,48 102,34 116,46" fill="#c9956a" />
        <path d="M126 56 C118 40 92 32 68 40 C46 48 26 66 28 86 C20 94 16 106 26 112 C42 120 66 114 78 106 C82 118 102 118 110 106 C124 110 138 96 132 78 C134 66 130 60 126 56 Z" fill="#8c5a32" />
        <path d="M74 44 C66 68 64 90 72 104 C80 86 82 60 76 44 Z" fill="#f4efe6" />
        <Eye x="86" y="66" s={0.82} iris="#5c3a28" />
        <ellipse cx="36" cy="96" rx="9" ry="6.5" fill="#5c3a28" />
        <ellipse cx="32" cy="94" rx="1.6" ry="2.2" fill="#2a211c" />
        <ellipse cx="42" cy="94" rx="1.6" ry="2.2" fill="#2a211c" />
      </Soft>
    </g>
  )
}

function Pig({ uid }: ArtProps) {
  return (
    <g>
      <Shadow cx="190" rx="70" />
      <Soft uid={uid}>
        <path d="M258 100 C280 90 292 110 276 118 C266 122 264 108 276 106" fill="none" stroke="#e98aa0" strokeWidth="6" strokeLinecap="round" />
        <Paw x={156} y={108} h={22} w={14} color="#f4a3b0" hoof="#e07d90" />
        <Paw x={180} y={110} h={20} w={14} color="#f7b0bc" hoof="#e07d90" />
        <Paw x={222} y={108} h={22} w={14} color="#f4a3b0" hoof="#e07d90" />
        <Paw x={246} y={110} h={20} w={13} color="#f7b0bc" hoof="#e07d90" />
        <ellipse cx="206" cy="100" rx="62" ry="32" fill="#f4a3b0" />
        <ellipse cx="206" cy="112" rx="34" ry="14" fill="#f8c4ce" />
        <path d="M116 92 C142 110 160 114 176 104 L172 88 C150 76 128 74 112 84 Z" fill="#f4a3b0" />
        <ellipse cx="118" cy="62" rx="14" ry="9" transform="rotate(-28 118 62)" fill="#f4a3b0" />
        <ellipse cx="118" cy="63" rx="8" ry="4.5" transform="rotate(-28 118 63)" fill="#f8c4ce" />
        <ellipse cx="96" cy="84" rx="34" ry="28" fill="#f4a3b0" />
        <Eye x="102" y="76" s={0.85} iris="#5c3a44" />
        <ellipse cx="60" cy="98" rx="18" ry="14" fill="#f7b7c3" />
        <ellipse cx="60" cy="98" rx="18" ry="14" fill="none" stroke="#e07d90" strokeWidth="2.2" />
        <ellipse cx="53" cy="96" rx="2.6" ry="3.5" fill="#c45b70" />
        <ellipse cx="67" cy="96" rx="2.6" ry="3.5" fill="#c45b70" />
      </Soft>
    </g>
  )
}

function Sheep({ uid }: ArtProps) {
  const puffs: Array<[number, number, number]> = [
    [176, 96, 22],
    [202, 82, 24],
    [230, 90, 24],
    [252, 106, 20],
    [188, 112, 18],
    [220, 114, 18],
    [104, 66, 18],
    [88, 56, 14],
    [122, 60, 14],
    [128, 74, 20],
    [148, 80, 22],
    [166, 90, 22],
    [138, 86, 22],
    [160, 98, 22],
  ]
  return (
    <g>
      <Shadow cx="198" rx="72" />
      <Soft uid={uid}>
        <rect x="168" y="112" width="8" height="18" rx="3" fill="#3a342f" />
        <rect x="190" y="114" width="8" height="16" rx="3" fill="#3a342f" />
        <rect x="232" y="112" width="8" height="18" rx="3" fill="#3a342f" />
        <rect x="254" y="114" width="8" height="16" rx="3" fill="#3a342f" />
        {puffs.map(([cx, cy, r]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="#fbfaf7" />
        ))}
        <ellipse cx="108" cy="78" rx="8" ry="5" fill="#3f3934" />
        <ellipse cx="96" cy="88" rx="20" ry="17" fill="#3f3934" />
        <Eye x="88" y="84" s={0.7} iris="#e6c98a" />
        <ellipse cx="78" cy="96" rx="5" ry="3.4" fill="#f0c0c8" />
      </Soft>
    </g>
  )
}

function Goat({ uid }: ArtProps) {
  return (
    <g>
      <Shadow cx="188" rx="64" />
      <Soft uid={uid}>
        <path d="M248 90 C262 78 270 96 258 100" fill="none" stroke="#f3ebdd" strokeWidth="5" strokeLinecap="round" />
        <Paw x={158} y={106} h={24} w={11} color="#f3ebdd" hoof="#2a2340" />
        <Paw x={178} y={108} h={22} w={11} color="#fff" hoof="#2a2340" />
        <Paw x={214} y={106} h={24} w={11} color="#f3ebdd" hoof="#2a2340" />
        <Paw x={234} y={108} h={22} w={11} color="#fff" hoof="#2a2340" />
        <path d="M150 106 C148 80 170 66 204 64 C238 62 266 78 262 100 C258 116 230 124 198 120 C168 122 152 116 150 106 Z" fill="#f3ebdd" />
        <ellipse cx="196" cy="108" rx="24" ry="10" fill="#fff" opacity="0.8" />
        <path d="M112 84 C136 100 152 106 166 98 L168 84 C148 70 126 66 108 76 Z" fill="#f3ebdd" />
        <path d="M102 56 C108 26 132 18 138 40 C132 22 114 28 110 50" fill="#e6d2a4" />
        <path d="M118 52 C132 22 158 20 152 44 C144 24 130 30 124 50" fill="#d7c08a" />
        <ellipse cx="124" cy="64" rx="8" ry="5" fill="#f3ebdd" />
        <path d="M128 70 C122 50 96 44 74 54 C52 64 40 82 46 98 C36 106 34 118 48 120 C64 128 96 120 110 108 C122 100 132 84 128 70 Z" fill="#f7f4ee" />
        <path d="M62 102 C58 122 74 132 84 118 C76 128 66 116 70 102 Z" fill="#f7f4ee" />
        <Eye x="82" y="76" s={0.85} iris="#e6c15a" slit />
        <Nose x={52} y={96} fill="#2a2340" w={6.5} h={4.6} />
        <circle cx="150" cy="108" r="6" fill="#e6c36a" />
        <circle cx="150" cy="110" r="2" fill="#a67c2d" />
      </Soft>
    </g>
  )
}

function Hen({ uid }: ArtProps) {
  return (
    <g>
      <Shadow cx="184" rx="52" />
      <Soft uid={uid}>
        <path d="M228 92 C258 62 286 78 270 100 C292 96 304 112 278 118 C292 124 286 140 262 132 C248 128 236 116 228 108 Z" fill="#c4621e" />
        <path d="M226 86 C258 58 280 74 266 92" fill="none" stroke="#e8842c" strokeWidth="8" strokeLinecap="round" />
        <ellipse cx="192" cy="100" rx="52" ry="30" fill="#e8842c" />
        <path d="M170 92 C196 86 214 100 206 116 C188 120 166 108 170 92 Z" fill="#c4621e" />
        <path d="M176 98 Q192 108 208 98" fill="none" stroke="#f2b06a" strokeWidth="2" />
        <path d="M184 104 Q196 112 208 104" fill="none" stroke="#f2b06a" strokeWidth="2" />
        <path d="M128 86 C150 102 164 108 176 100 L172 86 C156 74 138 72 124 80 Z" fill="#e8842c" />
        <circle cx="108" cy="74" r="22" fill="#e8842c" />
        <path d="M96 56 Q102 36 110 54 Q116 34 122 54 Q130 38 124 58 Q112 50 96 56 Z" fill="#d63a3a" />
        <path d="M92 76 L64 84 L92 92 Z" fill="#f2b33d" />
        <ellipse cx="96" cy="96" rx="6" ry="8" fill="#d63a3a" />
        <Eye x="100" y="70" s={0.75} iris="#f2b33d" />
        <path d="M176 124 L176 138 M166 138 H186 M168 138 L162 146 M184 138 L190 146" stroke="#f2b33d" strokeWidth="3" strokeLinecap="round" />
        <path d="M214 124 L214 136 M206 136 H222 M208 136 L204 144 M220 136 L226 144" stroke="#f2b33d" strokeWidth="3" strokeLinecap="round" />
      </Soft>
    </g>
  )
}

function Duck({ uid }: ArtProps) {
  return (
    <g>
      <Shadow cx="190" rx="58" />
      <Soft uid={uid}>
        <path d="M244 96 L286 86 L268 112 Z" fill="#6a7078" />
        <ellipse cx="200" cy="104" rx="54" ry="26" fill="#8d949c" />
        <ellipse cx="162" cy="106" rx="24" ry="22" fill="#e4d2ae" />
        <path d="M178 92 C202 86 220 98 214 112 C196 116 174 106 178 92 Z" fill="#6a727a" />
        <rect x="186" y="98" width="24" height="5" rx="2" fill="#2f6f9f" />
        <rect x="186" y="103" width="24" height="2.5" rx="1" fill="#fff" />
        <path d="M118 70 C138 92 156 108 172 102 L166 86 C148 74 132 58 116 56 Z" fill="#1f6b45" />
        <path d="M128 74 C146 92 160 102 174 96" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" />
        <ellipse cx="100" cy="64" rx="28" ry="22" fill="#1f6b45" />
        <path d="M78 70 L40 78 L78 86 Z" fill="#f2a03a" />
        <path d="M78 80 L52 88 L80 90 Z" fill="#e08a28" />
        <Eye x="92" y="58" s={0.75} iris="#2a2340" />
        <ellipse cx="176" cy="132" rx="16" ry="6" fill="#f2a03a" />
        <ellipse cx="214" cy="132" rx="14" ry="5" fill="#e08a28" />
      </Soft>
    </g>
  )
}

function Rabbit({ uid }: ArtProps) {
  return (
    <g>
      <Shadow cx="190" rx="62" />
      <Soft uid={uid}>
        <circle cx="262" cy="96" r="14" fill="#fff" />
        <circle cx="256" cy="94" r="8" fill="#f7f4ef" />
        <ellipse cx="230" cy="108" rx="34" ry="24" fill="#f4efe8" />
        <Paw x={214} y={114} h={16} w={12} color="#f4efe8" hoof="#e7d5c8" />
        <Paw x={236} y={116} h={14} w={11} color="#f7f4ee" hoof="#e7d5c8" />
        <ellipse cx="188" cy="104" rx="40" ry="24" fill="#f7f4ee" />
        <ellipse cx="176" cy="112" rx="18" ry="10" fill="#fff" />
        <Paw x={154} y={108} h={22} w={10} color="#f7f4ee" hoof="#e7d5c8" />
        <Paw x={170} y={110} h={20} w={10} color="#f4efe8" hoof="#e7d5c8" />
        <path d="M120 96 C140 110 156 112 170 102 L166 88 C148 78 130 78 116 88 Z" fill="#f7f4ee" />
        <ellipse cx="84" cy="46" rx="11" ry="34" fill="#f7f4ee" />
        <ellipse cx="110" cy="50" rx="10" ry="30" fill="#f4efe8" />
        <ellipse cx="84" cy="50" rx="5" ry="24" fill="#f4b7c4" />
        <ellipse cx="110" cy="54" rx="4.5" ry="20" fill="#f4b7c4" />
        <ellipse cx="96" cy="88" rx="28" ry="22" fill="#f7f4ee" />
        <Eye x="84" y="82" s={0.82} iris="#6a5040" />
        <ellipse cx="66" cy="96" rx="7" ry="5" fill="#f4b7c4" />
        <Whiskers x={68} y={94} />
      </Soft>
    </g>
  )
}

function Lion({ uid }: ArtProps) {
  const mane: Array<[number, number, number]> = [
    [96, 50, 18],
    [74, 66, 20],
    [122, 56, 22],
    [66, 92, 18],
    [136, 84, 22],
    [100, 104, 18],
    [154, 74, 18],
    [148, 100, 14],
    [170, 92, 20],
  ]
  return (
    <g>
      <Shadow cx="200" rx="78" />
      <Soft uid={uid}>
        <Bridge color="#e2a24a" />
        <path d="M250 98 C288 102 296 120 274 128" stroke="#e2a24a" strokeWidth="6" fill="none" strokeLinecap="round" />
        <circle cx="276" cy="130" r="7" fill="#3a2a22" />
        <Paw x={168} y={104} h={26} w={14} color="#e2a24a" hoof="#8a5a28" />
        <Paw x={192} y={106} h={24} w={14} color="#f0c27a" hoof="#8a5a28" />
        <Paw x={230} y={104} h={26} w={14} color="#e2a24a" hoof="#8a5a28" />
        <Paw x={254} y={106} h={24} w={13} color="#f0c27a" hoof="#8a5a28" />
        <path d="M160 108 C158 80 186 66 224 64 C264 62 296 80 292 104 C288 122 256 130 220 126 C182 128 162 120 160 108 Z" fill="#e2a24a" />
        <ellipse cx="214" cy="114" rx="30" ry="12" fill="#f0c98a" />
        {mane.map(([cx, cy, r]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="#c9841a" />
        ))}
        <circle cx="104" cy="78" r="26" fill="#e2a24a" />
        <ellipse cx="96" cy="92" rx="14" ry="10" fill="#f0c98a" />
        <Eye x="92" y="72" s={0.85} iris="#e6b04a" />
        <Nose x={78} y={90} fill="#2a2340" w={7} h={5} />
        <Whiskers x={74} y={94} />
        <polygon points="86,48 78,30 98,46" fill="#c9841a" />
        <polygon points="112,46 126,28 116,50" fill="#c9841a" />
      </Soft>
    </g>
  )
}

function Elephant({ uid }: ArtProps) {
  return (
    <g>
      <Shadow cx="198" rx="84" />
      <Soft uid={uid}>
        <path d="M272 88 Q292 110 278 126" stroke="#8ea0ae" strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle cx="276" cy="128" r="4" fill="#2c2a33" />
        <rect x="166" y="108" width="24" height="22" rx="8" fill="#a9b7c4" />
        <rect x="198" y="110" width="22" height="20" rx="8" fill="#9aabba" />
        <rect x="232" y="108" width="24" height="22" rx="8" fill="#a9b7c4" />
        <rect x="262" y="112" width="18" height="16" rx="7" fill="#9aabba" />
        <path d="M170 126 h7 M200 126 h6 M236 126 h7" stroke="#f4f1ea" strokeWidth="2.4" strokeLinecap="round" />
        <ellipse cx="214" cy="96" rx="66" ry="36" fill="#b7c5d0" />
        <ellipse cx="214" cy="110" rx="40" ry="16" fill="#d5dee6" opacity="0.75" />
        <path d="M190 86 Q220 96 250 88" fill="none" stroke="#8ea0ae" strokeWidth="1.6" />
        <path d="M196 100 Q226 110 254 100" fill="none" stroke="#8ea0ae" strokeWidth="1.6" />
        <path d="M108 92 C136 74 164 84 184 100 L178 116 C140 124 112 114 100 100 Z" fill="#b7c5d0" />
        <ellipse cx="128" cy="74" rx="32" ry="40" fill="#8ea0ae" />
        <ellipse cx="130" cy="76" rx="20" ry="28" fill="#d5e0e8" />
        <ellipse cx="100" cy="86" rx="32" ry="26" fill="#b7c5d0" />
        <path d="M78 102 Q60 116 70 128" stroke="#f7f4ee" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M86 100 C68 112 58 126 74 136 C82 144 96 138 90 124 C86 114 100 112 104 104 Z" fill="#b7c5d0" />
        <path d="M74 118 Q84 128 76 136" fill="none" stroke="#8ea0ae" strokeWidth="2" />
        <Eye x="96" y="78" s={0.7} iris="#5c6a78" />
      </Soft>
    </g>
  )
}

function GiraffeShape() {
  return (
    <>
      <rect x="148" y="96" width="12" height="34" rx="5" fill="#f0c14a" />
      <rect x="170" y="98" width="12" height="32" rx="5" fill="#f0c14a" />
      <rect x="222" y="98" width="12" height="32" rx="5" fill="#f0c14a" />
      <rect x="244" y="100" width="12" height="30" rx="5" fill="#f0c14a" />
      <ellipse cx="216" cy="102" rx="54" ry="26" fill="#f0c14a" />
      <path d="M62 52 C96 34 132 48 168 74 C196 94 214 108 228 104 L214 122 C176 116 140 98 108 76 C82 60 66 62 62 52 Z" fill="#f0c14a" />
      <ellipse cx="74" cy="42" rx="22" ry="16" fill="#f0c14a" />
      <polygon points="88,36 80,16 102,32" fill="#f0c14a" />
    </>
  )
}

function Giraffe({ uid }: ArtProps) {
  const clip = `${uid}gc`
  const spots: Array<[number, number, number, number]> = [
    [88, 48, 8, 6],
    [112, 58, 10, 7],
    [138, 72, 11, 8],
    [164, 88, 12, 8],
    [188, 80, 12, 9],
    [214, 92, 13, 9],
    [242, 100, 12, 8],
    [196, 108, 9, 7],
    [168, 108, 7, 12],
    [230, 114, 7, 11],
  ]
  return (
    <g>
      <Shadow cx="206" rx="74" />
      <defs>
        <clipPath id={clip}>
          <GiraffeShape />
        </clipPath>
      </defs>
      <Soft uid={uid}>
        <path d="M262 96 C286 104 284 120 270 126" stroke="#e0b03a" strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle cx="270" cy="128" r="5" fill="#6a4020" />
        <GiraffeShape />
        <g clipPath={`url(#${clip})`}>
          {spots.map(([cx, cy, rx, ry]) => (
            <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx={rx} ry={ry} fill="#b56a2a" />
          ))}
        </g>
        <path d="M88 40 C124 58 156 78 188 96" fill="none" stroke="#a86b32" strokeWidth="5" strokeLinecap="round" />
        <rect x="62" y="16" width="5" height="18" rx="2.5" fill="#e6c98a" />
        <rect x="84" y="12" width="5" height="18" rx="2.5" fill="#e6c98a" />
        <circle cx="64.5" cy="16" r="4.5" fill="#c9956a" />
        <circle cx="86.5" cy="12" r="4.5" fill="#c9956a" />
        <rect x="148" y="124" width="12" height="6" rx="2" fill="#6a4020" />
        <rect x="222" y="124" width="12" height="6" rx="2" fill="#6a4020" />
        <Eye x="68" y="40" s={0.75} iris="#5c3a28" />
        <ellipse cx="54" cy="50" rx="8" ry="5" fill="#c9956a" />
      </Soft>
    </g>
  )
}

function ZebraShape() {
  return (
    <>
      <rect x="156" y="98" width="12" height="32" rx="5" fill="#f7f5f0" />
      <rect x="178" y="100" width="12" height="30" rx="5" fill="#f7f5f0" />
      <rect x="228" y="98" width="12" height="32" rx="5" fill="#f7f5f0" />
      <rect x="250" y="100" width="12" height="30" rx="5" fill="#f7f5f0" />
      <path d="M146 106 C144 72 178 58 222 56 C268 54 302 74 298 98 C294 118 258 128 214 122 C174 126 148 118 146 106 Z" fill="#f7f5f0" />
      <path d="M96 72 C136 90 168 108 204 102 L198 76 C160 56 124 46 96 58 Z" fill="#f7f5f0" />
      <polygon points="108,54 98,32 122,48" fill="#f7f5f0" />
      <path d="M128 58 C120 42 94 34 70 42 C48 50 28 68 30 88 C22 96 18 108 28 114 C44 122 68 116 80 108 C84 118 104 118 112 106 C126 110 140 96 134 78 C136 66 132 60 128 58 Z" fill="#f7f5f0" />
    </>
  )
}

function Zebra({ uid }: ArtProps) {
  const clip = `${uid}zc`
  return (
    <g>
      <Shadow cx="198" rx="82" />
      <defs>
        <clipPath id={clip}>
          <ZebraShape />
        </clipPath>
      </defs>
      <Soft uid={uid}>
        <path d="M272 74 C306 88 302 120 286 132" stroke="#1a1a1e" strokeWidth="7" fill="none" strokeLinecap="round" />
        <ZebraShape />
        <g clipPath={`url(#${clip})`} stroke="#1a1a1e" strokeWidth="8" fill="none" strokeLinecap="butt">
          <path d="M48 70 L78 112" />
          <path d="M70 58 L98 114" />
          <path d="M92 52 L116 108" />
          <path d="M114 58 L142 114" />
          <path d="M140 64 L166 120" />
          <path d="M168 62 L176 128" />
          <path d="M192 58 L198 128" />
          <path d="M216 56 L220 128" />
          <path d="M240 60 L242 128" />
          <path d="M262 68 L260 126" />
        </g>
        <path d="M108 50 C130 36 150 58 168 40 C184 60 204 42 224 58" fill="none" stroke="#1a1a1e" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="156" y="124" width="12" height="6" rx="2" fill="#1a1a1e" />
        <rect x="228" y="124" width="12" height="6" rx="2" fill="#1a1a1e" />
        <Eye x="84" y="68" s={0.78} iris="#2a2340" />
        <ellipse cx="36" cy="98" rx="8" ry="6" fill="#1a1a1e" />
      </Soft>
    </g>
  )
}

function Bear({ uid }: ArtProps) {
  return (
    <g>
      <Shadow cx="192" rx="76" />
      <Soft uid={uid}>
        <circle cx="266" cy="98" r="8" fill="#6e4c32" />
        <Paw x={154} y={104} h={26} w={16} color="#8a6244" hoof="#3a2a22" />
        <Paw x={180} y={106} h={24} w={16} color="#9a7252" hoof="#3a2a22" />
        <Paw x={220} y={104} h={26} w={16} color="#8a6244" hoof="#3a2a22" />
        <Paw x={246} y={106} h={24} w={15} color="#9a7252" hoof="#3a2a22" />
        <path d="M158 128 l-2 6 M166 130 l0 6 M174 128 l2 6" stroke="#f4efe6" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M250 128 l-2 6 M258 130 l0 6 M266 128 l2 6" stroke="#f4efe6" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M148 104 C152 70 190 56 230 62 C272 68 298 90 292 110 C286 126 246 132 204 128 C166 130 144 118 148 104 Z" fill="#8a6244" />
        <path d="M170 76 C208 58 260 64 290 84 C252 68 200 66 170 84 Z" fill="#6e4c32" />
        <ellipse cx="198" cy="114" rx="32" ry="13" fill="#c9a27a" />
        <path d="M116 90 C140 106 158 112 172 102 L168 88 C148 74 128 70 112 80 Z" fill="#8a6244" />
        <circle cx="120" cy="62" r="13" fill="#8a6244" />
        <circle cx="120" cy="63" r="7" fill="#c9a27a" />
        <ellipse cx="92" cy="84" rx="30" ry="26" fill="#8a6244" />
        <ellipse cx="74" cy="96" rx="16" ry="12" fill="#c9a27a" />
        <Eye x="86" y="76" s={0.78} iris="#3a2a22" />
        <Nose x={60} y={92} fill="#2a2340" w={8} h={5.5} />
      </Soft>
    </g>
  )
}

function Fox({ uid }: ArtProps) {
  return (
    <g>
      <Shadow cx="196" rx="80" />
      <Soft uid={uid}>
        <path d="M236 100 C278 78 318 104 300 128 C280 146 250 124 246 108 Z" fill="#e07030" />
        <path d="M292 112 C308 118 314 132 300 136 C292 128 296 118 292 112 Z" fill="#f7f4ee" />
        <rect x="162" y="100" width="12" height="12" rx="4" fill="#e07030" />
        <rect x="186" y="102" width="12" height="12" rx="4" fill="#e07030" />
        <rect x="214" y="100" width="12" height="12" rx="4" fill="#e07030" />
        <rect x="236" y="102" width="12" height="10" rx="4" fill="#e07030" />
        <Paw x={160} y={110} h={20} w={12} color="#1a1a1e" hoof="#1a1a1e" />
        <Paw x={184} y={112} h={18} w={12} color="#1a1a1e" hoof="#1a1a1e" />
        <Paw x={212} y={110} h={20} w={12} color="#1a1a1e" hoof="#1a1a1e" />
        <Paw x={234} y={112} h={18} w={11} color="#1a1a1e" hoof="#1a1a1e" />
        <path d="M150 106 C148 80 172 66 208 64 C236 62 258 76 256 98 C254 114 230 122 200 118 C170 120 152 116 150 106 Z" fill="#e07030" />
        <ellipse cx="176" cy="108" rx="22" ry="12" fill="#f7f4ee" />
        <path d="M112 82 C136 98 154 106 168 98 L170 84 C148 70 126 66 108 76 Z" fill="#e07030" />
        <polygon points="78,62 58,26 96,52" fill="#1a1a1e" />
        <polygon points="80,58 66,34 94,52" fill="#e07030" />
        <polygon points="82,60 72,40 92,54" fill="#f4b6b0" />
        <polygon points="112,56 130,24 118,56" fill="#1a1a1e" />
        <polygon points="112,54 122,32 116,54" fill="#f4b6b0" />
        <path d="M132 70 C126 50 100 42 74 52 C52 62 34 80 40 98 C30 106 28 116 42 118 C60 126 96 118 112 106 C124 98 134 84 132 70 Z" fill="#e07030" />
        <path d="M48 96 C64 108 86 104 92 94 C74 102 58 100 48 96 Z" fill="#f7f4ee" />
        <Eye x="82" y="74" s={0.8} iris="#e6b04a" />
        <Nose x={44} y={100} fill="#1a1a1e" w={7} h={5} />
        <Whiskers x={52} y={102} />
      </Soft>
    </g>
  )
}

function Wolf({ uid }: ArtProps) {
  return (
    <g>
      <Shadow cx="192" rx="78" />
      <Soft uid={uid}>
        <Bridge color="#8e97a1" />
        <ellipse cx="292" cy="112" rx="16" ry="11" fill="#6e7882" />
        <path d="M248 92 C290 76 314 102 296 122" stroke="#8e97a1" strokeWidth="13" fill="none" strokeLinecap="round" />
        <Paw x={158} y={102} h={28} w={12} color="#8e97a1" hoof="#2a2340" />
        <Paw x={180} y={104} h={26} w={12} color="#9aa3ad" hoof="#2a2340" />
        <Paw x={222} y={102} h={28} w={12} color="#8e97a1" hoof="#2a2340" />
        <Paw x={244} y={104} h={26} w={12} color="#9aa3ad" hoof="#2a2340" />
        <path d="M150 104 C148 76 176 62 218 60 C258 58 292 76 288 100 C284 118 250 126 210 122 C172 124 152 116 150 104 Z" fill="#8e97a1" />
        <path d="M172 74 C210 62 256 66 284 84 C248 70 202 68 172 84 Z" fill="#6e7882" opacity="0.45" />
        <ellipse cx="196" cy="110" rx="32" ry="12" fill="#d5dadf" />
        <path d="M108 74 C140 94 158 106 174 98 L178 80 C150 62 124 56 104 66 Z" fill="#7e8892" />
        <polygon points="96,66 88,38 114,58" fill="#8e97a1" />
        <polygon points="102,58 94,36 112,54" fill="#d5dadf" />
        <polygon points="120,56 136,26 126,58" fill="#6e7882" />
        <path d="M132 64 C126 46 100 38 74 46 C50 54 26 74 30 94 L16 102 C10 108 14 120 30 120 C52 130 98 122 118 106 C130 96 136 78 132 64 Z" fill="#8e97a1" />
        <path d="M36 98 C56 112 80 106 88 96 C70 104 50 102 36 98 Z" fill="#d5dadf" />
        <Eye x="78" y="68" s={0.8} iris="#e6c15a" />
        <Nose x={24} y={104} fill="#2a2340" />
      </Soft>
    </g>
  )
}

function Monkey({ uid }: ArtProps) {
  return (
    <g>
      <Shadow cx="186" rx="66" />
      <Soft uid={uid}>
        <Bridge color="#c4844a" />
        <path d="M236 90 C274 66 312 98 286 124 C266 140 244 112 250 96" fill="none" stroke="#a56b3c" strokeWidth="8" strokeLinecap="round" />
        <Paw x={158} y={108} h={22} w={12} color="#a56b3c" hoof="#8a5630" />
        <Paw x={184} y={110} h={20} w={12} color="#c4844a" hoof="#8a5630" />
        <Paw x={214} y={108} h={22} w={12} color="#a56b3c" hoof="#8a5630" />
        <ellipse cx="198" cy="100" rx="50" ry="28" fill="#c4844a" />
        <ellipse cx="190" cy="112" rx="26" ry="12" fill="#f0c9a0" />
        <path d="M124 90 C146 106 162 110 176 100 L172 86 C152 74 132 72 120 82 Z" fill="#c4844a" />
        <circle cx="126" cy="64" r="12" fill="#a56b3c" />
        <circle cx="126" cy="64" r="6.5" fill="#f0c9a0" />
        <ellipse cx="92" cy="82" rx="28" ry="24" fill="#c4844a" />
        <ellipse cx="84" cy="86" rx="18" ry="16" fill="#f0c9a0" />
        <ellipse cx="70" cy="80" rx="7" ry="8" fill="#f0c9a0" />
        <Eye x="78" y="80" s={0.75} iris="#6a3a22" />
        <ellipse cx="66" cy="94" rx="7" ry="4.5" fill="#d9a080" />
        <ellipse cx="63" cy="93" rx="1.4" ry="2" fill="#a86b5a" />
        <ellipse cx="70" cy="93" rx="1.4" ry="2" fill="#a86b5a" />
        <path d="M60 100 Q70 106 82 100" fill="none" stroke="#a56b3c" strokeWidth="1.5" strokeLinecap="round" />
      </Soft>
    </g>
  )
}

function TigerShape() {
  return (
    <>
      <rect x="162" y="104" width="14" height="26" rx="6" fill="#f08a28" />
      <rect x="186" y="106" width="14" height="24" rx="6" fill="#f08a28" />
      <rect x="226" y="104" width="14" height="26" rx="6" fill="#f08a28" />
      <rect x="250" y="106" width="13" height="24" rx="6" fill="#f08a28" />
      <path d="M156 108 C154 76 184 60 226 58 C268 56 304 76 300 102 C296 122 260 132 220 126 C180 130 158 120 156 108 Z" fill="#f08a28" />
      <path d="M100 78 C132 98 164 114 196 104 L190 82 C156 64 124 58 100 70 Z" fill="#f08a28" />
      <circle cx="78" cy="52" r="12" fill="#f08a28" />
      <circle cx="118" cy="48" r="12" fill="#f08a28" />
      <path d="M136 70 C130 48 102 38 74 50 C50 62 34 82 42 100 C32 108 30 118 46 120 C66 130 108 122 124 108 C136 98 140 82 136 70 Z" fill="#f08a28" />
    </>
  )
}

function Tiger({ uid }: ArtProps) {
  const clip = `${uid}tc`
  return (
    <g>
      <Shadow cx="198" rx="82" />
      <defs>
        <clipPath id={clip}>
          <TigerShape />
        </clipPath>
      </defs>
      <Soft uid={uid}>
        <path d="M258 100 C296 96 314 112 300 124" stroke="#f08a28" strokeWidth="11" fill="none" strokeLinecap="round" />
        <path d="M276 98 L282 114" stroke="#1a1a1e" strokeWidth="4" strokeLinecap="round" />
        <path d="M290 102 L294 116" stroke="#1a1a1e" strokeWidth="4" strokeLinecap="round" />
        <TigerShape />
        <g clipPath={`url(#${clip})`} stroke="#1a1a1e" strokeWidth="6" fill="none" strokeLinecap="round">
          <path d="M168 70 Q178 96 166 116" />
          <path d="M192 64 Q204 96 190 120" />
          <path d="M216 62 Q228 96 214 122" />
          <path d="M240 66 Q250 98 238 120" />
          <path d="M264 74 Q272 100 262 116" />
          <path d="M86 56 L78 74" />
          <path d="M98 50 L94 72" />
          <path d="M110 52 L108 74" />
        </g>
        <ellipse cx="210" cy="114" rx="36" ry="13" fill="#f6e2c4" />
        <ellipse cx="96" cy="96" rx="16" ry="11" fill="#f6e2c4" />
        <ellipse cx="78" cy="52" rx="6" ry="7" fill="#f4b6b0" />
        <ellipse cx="118" cy="48" rx="6" ry="7" fill="#f4b6b0" />
        <Eye x="82" y="74" s={0.9} iris="#e6b04a" cat />
        <Nose x={62} y={96} fill="#f08a9a" w={7} h={5} />
        <Whiskers x={58} y={100} />
      </Soft>
    </g>
  )
}

function Penguin({ uid }: ArtProps) {
  return (
    <g>
      <Shadow cx="176" rx="42" />
      <Soft uid={uid}>
        <path d="M214 104 L250 92 L236 122 Z" fill="#1c2430" />
        <ellipse cx="184" cy="100" rx="52" ry="34" fill="#1c2430" />
        <ellipse cx="172" cy="108" rx="32" ry="24" fill="#f4f7fb" />
        <circle cx="122" cy="66" r="30" fill="#1c2430" />
        <ellipse cx="138" cy="80" rx="16" ry="22" fill="#f2b434" />
        <ellipse cx="130" cy="86" rx="12" ry="16" fill="#f6d56a" />
        <ellipse cx="112" cy="74" rx="16" ry="13" fill="#f4f7fb" />
        <Eye x="106" y="66" s={0.8} iris="#2a2340" />
        <path d="M96 74 L56 82 L98 90 Z" fill="#f29a2e" />
        <path d="M98 84 L70 94 L102 96 Z" fill="#e07a22" />
        <path d="M176 86 C200 96 208 122 188 130 C172 120 162 104 176 86 Z" fill="#2a3344" />
        <ellipse cx="158" cy="132" rx="18" ry="6" fill="#f29a2e" />
        <ellipse cx="196" cy="132" rx="16" ry="5.5" fill="#e8892a" />
      </Soft>
    </g>
  )
}

const ARTS: Record<string, (props: ArtProps) => ReactNode> = {
  cow: Cow,
  dog: Dog,
  cat: Cat,
  horse: Horse,
  pig: Pig,
  sheep: Sheep,
  goat: Goat,
  hen: Hen,
  duck: Duck,
  rabbit: Rabbit,
  lion: Lion,
  elephant: Elephant,
  giraffe: Giraffe,
  zebra: Zebra,
  bear: Bear,
  fox: Fox,
  wolf: Wolf,
  monkey: Monkey,
  tiger: Tiger,
  penguin: Penguin,
}

export function AnimalSvg({ id }: { id: string }) {
  const uid = `h${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const Art = ARTS[id] ?? Dog
  return (
    <svg className="half-svg" viewBox="0 0 320 156" aria-hidden="true">
      <defs>
        <filter id={`${uid}-soft`} x="-12%" y="-12%" width="124%" height="128%">
          <feDropShadow dx="0" dy="1" stdDeviation="0.45" floodColor="#243028" floodOpacity="0.28" />
        </filter>
      </defs>
      <Meadow />
      <Art uid={uid} />
    </svg>
  )
}
