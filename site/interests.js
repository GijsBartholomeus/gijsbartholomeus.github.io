/* Reading cards: mouse hover, keyboard focus, and tap; native click fallback. */
(() => {
  if (!('showPopover' in HTMLElement.prototype)) return;
  const triggers = [...document.querySelectorAll('.interest-trigger')];
  let active = null, timer;
  const cancel = () => clearTimeout(timer);
  function position(trigger, card) {
    const rect = trigger.getBoundingClientRect();
    const gap = 9, edge = 12;
    const left = Math.max(edge, Math.min(rect.left, innerWidth - card.offsetWidth - edge));
    const below = rect.bottom + gap;
    const top = below + card.offsetHeight <= innerHeight - edge ? below : Math.max(edge, rect.top - card.offsetHeight - gap);
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
    card.style.margin = '0';
  }
  function open(trigger, card) {
    cancel();
    if (active && active.card !== card) active.card.hidePopover();
    if (!card.matches(':popover-open')) card.showPopover();
    active = {trigger, card};
    trigger.setAttribute('aria-expanded', 'true');
    position(trigger, card);
  }
  function leave(trigger, card) {
    cancel();
    timer = setTimeout(() => {
      if (!card.contains(document.activeElement) && document.activeElement !== trigger && !trigger.matches(':hover') && !card.matches(':hover')) card.hidePopover();
    }, 240);
  }
  triggers.forEach(trigger => {
    const card = document.getElementById(trigger.getAttribute('popovertarget'));
    trigger.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') open(trigger, card); });
    trigger.addEventListener('pointerleave', () => leave(trigger, card));
    trigger.addEventListener('focus', () => open(trigger, card));
    trigger.addEventListener('click', event => { event.preventDefault(); open(trigger, card); });
    trigger.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown') { event.preventDefault(); open(trigger, card); card.querySelector('a,button').focus(); }
    });
    trigger.addEventListener('blur', () => leave(trigger, card));
    card.addEventListener('pointerenter', cancel);
    card.addEventListener('pointerleave', () => leave(trigger, card));
    card.addEventListener('focusin', cancel);
    card.addEventListener('focusout', () => leave(trigger, card));
    card.addEventListener('toggle', () => {
      const isOpen = card.matches(':popover-open');
      trigger.setAttribute('aria-expanded', String(isOpen));
      if (!isOpen && active?.card === card) active = null;
    });
  });
  addEventListener('resize', () => { if (active) position(active.trigger, active.card); });
  document.querySelector('.content-scroll')?.addEventListener('scroll', () => { if (active) active.card.hidePopover(); });
  addEventListener('hashchange', () => { if (active) active.card.hidePopover(); });
})();
