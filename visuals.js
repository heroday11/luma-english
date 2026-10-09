const paths = {
 path:'<path d="M5 20V9a4 4 0 0 1 4-4h7M13 2l4 3-4 3M17 10v10"/><circle cx="17" cy="15" r="3"/>',
 book:'<path d="M12 5v15M12 5C8 2 3 3 3 3v16s5-1 9 2c4-3 9-2 9-2V3s-5-1-9 2Z"/>',
 practice:'<path d="m7 7 10 10M4 5l2-2 4 4-3 3-4-4 2-2M14 17l3-3 4 4-3 3-4-4M3 10l7-7M14 21l7-7"/>',
 play:'<path d="m9 7 8 5-8 5Z"/><circle cx="12" cy="12" r="10"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
 sound:'<path d="M11 4 5 9H2v6h3l6 5ZM15 8a6 6 0 0 1 0 8M18 4a11 11 0 0 1 0 16"/>',
 flame:'<path d="M12 2c2 6-1 7-1 10 3-1 4-4 4-4s6 5 4 10c-2 5-12 5-14 0-2-5 3-8 7-16Z"/>',
 bolt:'<path d="m13 2-9 12h7l-1 8 10-13h-7Z"/>',
 chevron:'<path d="m9 5 7 7-7 7"/>', check:'<path d="m5 12 4 4L19 6"/>',
 close:'<path d="m6 6 12 12M6 18 18 6"/>',
 star:'<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/>',
 heart:'<path d="M20 4c-4-3-8 2-8 2S8 1 4 4c-7 5 8 17 8 17S27 9 20 4Z"/>',
 search:'<circle cx="10" cy="10" r="7"/><path d="m16 16 6 6"/>',
 lock:'<rect x="4" y="10" width="16" height="12" rx="3"/><path d="M8 10V6a4 4 0 0 1 8 0v4M12 15v3"/>',
 trophy:'<path d="M7 3h10v6a5 5 0 0 1-10 0ZM7 5H3v3a5 5 0 0 0 5 5M17 5h4v3a5 5 0 0 1-5 5M12 14v7M7 21h10"/>',
 repeat:'<path d="m17 2 4 4-4 4M3 11V8a2 2 0 0 1 2-2h16M7 22l-4-4 4-4M21 13v3a2 2 0 0 1-2 2H3"/>',
 target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
 calendar:'<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M7 2v4M17 2v4M3 10h18M7 14h2M15 14h2M7 18h2"/>'
};
window.UI_ICON = (name,size=24) => `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.star}</svg>`;
window.MASCOT = `<svg class="mascot-svg" viewBox="0 0 180 190" role="img" aria-label="词境学习伙伴小芽"><ellipse cx="91" cy="176" rx="52" ry="8" fill="#172a5010"/><path class="mascot-leaf" d="M87 38C58 29 63 8 65 9c24-2 35 9 22 29Z" fill="#52c7ad"/><path d="M88 38c-1-25 21-32 30-30 5 23-13 34-30 30Z" fill="#18aa8c"/><path d="M35 99c-24-3-28 15-21 29 7 13 23 6 31-1M142 101c23-5 33 9 24 24-7 11-23 4-29-2" fill="#22b697"/><path d="M61 154v19c0 13 27 11 29 0l3-16M103 155v17c2 14 28 10 25-2l-4-18" fill="#0b9077"/><path d="M45 65c13-29 80-32 94 0 14 27 12 69-2 86-16 22-80 20-94-3-15-23-14-58 2-83Z" fill="#22b697"/><path d="M51 91c0-31 74-31 78 0v35c-4 36-73 37-78-1Z" fill="#e9fff4"/><ellipse cx="72" cy="95" rx="6" ry="10" fill="#244456"/><ellipse cx="109" cy="95" rx="6" ry="10" fill="#244456"/><circle cx="74" cy="92" r="2" fill="white"/><circle cx="111" cy="92" r="2" fill="white"/><path d="M78 116q13 15 26-1" fill="none" stroke="#244456" stroke-width="4" stroke-linecap="round"/><ellipse cx="62" cy="113" rx="8" ry="4" fill="#f8baa2"/><ellipse cx="119" cy="113" rx="8" ry="4" fill="#f8baa2"/><path d="M103 151q-12-9-30-3l-2 25q15-6 31 2l21-8-2-25Z" fill="#8467e6"/><path d="M102 153v21M77 155l17 2M77 161l14 2" stroke="#cabaf7" stroke-width="2" fill="none"/></svg>`;
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=window.UI_ICON(el.dataset.icon));
document.getElementById('authArt').innerHTML=window.MASCOT;
