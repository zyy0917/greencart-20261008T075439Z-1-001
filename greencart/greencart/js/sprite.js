/* Shared SVG icons. Loaded first on every page so <use href="#..."> can find them. */
document.body.insertAdjacentHTML('afterbegin', `
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
  <defs>
    <symbol id="gc-mark" viewBox="0 0 64 64">
      <path d="M6 14h9l6 26h27l6-19H19" fill="none" stroke="#46543a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="26" cy="50" r="4" fill="#46543a"/><circle cx="43" cy="50" r="4" fill="#46543a"/>
      <path d="M30 30c-2-9 3-16 13-18 1 9-3 16-13 18z" fill="#6c8f4f"/>
      <path d="M31 29c3-5 6-9 11-14" stroke="#eaf1e0" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    </symbol>
    <symbol id="i-eye" viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/></symbol>
    <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 16l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>
    <symbol id="i-bell" viewBox="0 0 24 24"><path d="M6 17V11a6 6 0 1 1 12 0v6l1.5 2h-15L6 17zM10 21h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></symbol>
    <symbol id="i-globe" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" fill="none" stroke="currentColor" stroke-width="1.6"/></symbol>
    <symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 21c1-4.5 4.2-6.5 8-6.5s7 2 8 6.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
    <symbol id="i-grid" viewBox="0 0 24 24"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" fill="currentColor"/></symbol>
    <symbol id="i-list" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></symbol>
    <symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 3l8 3v6c0 4.5-3.2 7.6-8 9-4.8-1.4-8-4.5-8-9V6l8-3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></symbol>
    <symbol id="i-dots" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>

    <symbol id="c-veg" viewBox="0 0 48 48"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 24h36l-4 18H10z"/><path d="M14 24l2 18M24 24v18M34 24l-2 18"/><path d="M17 24c-3-6 0-12 6-13 1 6-1 11-6 13zM29 24c3-7 8-9 11-7-1 5-5 8-11 7z"/><path d="M24 11c0-3 2-5 4-6"/></g></symbol>
    <symbol id="c-fruit" viewBox="0 0 48 48"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 26h38l-4 16H9z"/><path d="M12 26l2 16M24 26v16M36 26l-2 16"/><circle cx="16" cy="19" r="6"/><circle cx="30" cy="18" r="6"/><path d="M16 13c0-2 1-3 3-3M30 12c0-2 1-4 3-4"/></g></symbol>
    <symbol id="c-egg" viewBox="0 0 48 48"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 8c5 0 9 9 9 16a9 9 0 0 1-18 0c0-7 4-16 9-16z"/><path d="M33 16c4 0 7 7 7 13a7 7 0 0 1-14 0c0-6 3-13 7-13z"/><path d="M9 26c3 1 5 1 8-1"/></g></symbol>
    <symbol id="c-meat" viewBox="0 0 48 48"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M28 8c8-2 14 4 12 12-2 7-9 8-14 13l-5 5-6-6 5-5c5-5 6-12 8-19z"/><path d="M14 33l-6 6M10 30l-4 4M17 38l-4 4"/><path d="M30 14c3 0 5 2 5 5"/></g></symbol>
    <symbol id="c-milk" viewBox="0 0 48 48"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6h18l3 8v28H12V14z"/><path d="M12 14h24M15 6l-3 8M33 6l3 8"/><path d="M18 24h12v10H18z"/><path d="M21 20h6"/></g></symbol>
    <symbol id="c-drink" viewBox="0 0 48 48"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16h24l-3 26H15z"/><path d="M10 16c0-4 6-6 14-6s14 2 14 6"/><path d="M26 10l4-6h5"/><path d="M15 26h18"/></g></symbol>
  </defs>
</svg>`);
