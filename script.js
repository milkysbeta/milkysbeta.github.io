const doc = document.documentElement;
const header = document.querySelector('[data-header]');
const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');
const dialog = document.querySelector('.request-dialog');
const requestForm = document.querySelector('#service-request-form');
const toast = document.querySelector('.toast');
const parallaxImage = document.querySelector('.parallax-image');
const heroPhoto = document.querySelector('.hero-photo');
const heroPhotoBase = document.querySelector('.hero-photo-base');
const heroScreen = document.querySelector('[data-hero-screen]');
const heroScreenMedia = [...document.querySelectorAll('.hero-screen-media')];
let formOpenedAt = Date.now();
doc.classList.add('js-ready');

const browserHeartbeat = () => fetch('/api/browser-heartbeat', { method: 'POST' }).catch(() => {});
browserHeartbeat();
window.setInterval(browserHeartbeat, 12000);

document.querySelector('[data-year]').textContent = new Date().getFullYear();

const setHeaderState = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
setHeaderState();
window.addEventListener('scroll', setHeaderState, { passive: true });

let parallaxFrame = 0;
const updateParallax = () => {
  parallaxFrame = 0;
  if (!parallaxImage || doc.classList.contains('reduce-motion')) return;
  const frame = parallaxImage.parentElement;
  const rect = frame.getBoundingClientRect();
  const viewportCentre = window.innerHeight / 2;
  const sectionCentre = rect.top + rect.height / 2;
  const travel = Math.max(-70, Math.min(70, (viewportCentre - sectionCentre) * 0.11));
  parallaxImage.style.setProperty('--parallax-y', `${travel}px`);
};
const requestParallaxUpdate = () => {
  if (parallaxFrame) return;
  parallaxFrame = window.requestAnimationFrame(updateParallax);
};
updateParallax();
window.addEventListener('scroll', requestParallaxUpdate, { passive: true });
window.addEventListener('resize', requestParallaxUpdate, { passive: true });

menuToggle?.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!open));
  navigation.classList.toggle('is-open', !open);
  menuToggle.querySelector('.sr-only').textContent = open ? 'Open navigation' : 'Close navigation';
});

navigation?.addEventListener('click', (event) => {
  if (!event.target.closest('a')) return;
  navigation.classList.remove('is-open');
  menuToggle?.setAttribute('aria-expanded', 'false');
  const menuLabel = menuToggle?.querySelector('.sr-only');
  if (menuLabel) menuLabel.textContent = 'Open navigation';
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || menuToggle?.getAttribute('aria-expanded') !== 'true') return;
  navigation?.classList.remove('is-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.querySelector('.sr-only').textContent = 'Open navigation';
  menuToggle.focus();
});

const systemReducesMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (systemReducesMotion) doc.classList.add('reduce-motion');

// Screen corners measured against the optimized 1400 × 876 hero WebP.
const heroScreenSource = { x: 557.35, y: 297.56, width: 388.64, height: 275.61 };
const positionFraction = (value, fallback = .5) => value?.endsWith('%') ? Number.parseFloat(value) / 100 : fallback;
const placeHeroScreen = () => {
  if (!heroPhoto || !heroPhotoBase || !heroScreen || !heroPhotoBase.naturalWidth) return;
  const containerWidth = heroPhoto.clientWidth;
  const containerHeight = heroPhoto.clientHeight;
  const scale = Math.max(containerWidth / heroPhotoBase.naturalWidth, containerHeight / heroPhotoBase.naturalHeight);
  const renderedWidth = heroPhotoBase.naturalWidth * scale;
  const renderedHeight = heroPhotoBase.naturalHeight * scale;
  const [positionX, positionY] = getComputedStyle(heroPhotoBase).objectPosition.split(' ');
  const offsetX = (containerWidth - renderedWidth) * positionFraction(positionX);
  const offsetY = (containerHeight - renderedHeight) * positionFraction(positionY);
  heroScreen.style.left = `${offsetX + heroScreenSource.x * scale}px`;
  heroScreen.style.top = `${offsetY + heroScreenSource.y * scale}px`;
  heroScreen.style.width = `${heroScreenSource.width * scale}px`;
  heroScreen.style.height = `${heroScreenSource.height * scale}px`;
};

if (heroPhotoBase?.complete) placeHeroScreen();
else heroPhotoBase?.addEventListener('load', placeHeroScreen, { once: true });
window.addEventListener('resize', placeHeroScreen, { passive: true });
if ('ResizeObserver' in window && heroPhoto) new ResizeObserver(placeHeroScreen).observe(heroPhoto);

let heroScreenIndex = 0;
let heroScreenTimer = 0;
const showHeroScreenMedia = (nextIndex) => {
  if (!heroScreenMedia.length) return;
  heroScreenIndex = nextIndex % heroScreenMedia.length;
  heroScreenMedia.forEach((media, index) => {
    const active = index === heroScreenIndex;
    media.classList.toggle('is-active', active);
    if (media instanceof HTMLVideoElement) {
      if (active) media.play().catch(() => {});
      else media.pause();
    }
  });
};
const stopHeroScreenRotation = () => {
  window.clearInterval(heroScreenTimer);
  heroScreenTimer = 0;
};
const startHeroScreenRotation = () => {
  if (systemReducesMotion || heroScreenMedia.length < 2 || heroScreenTimer || document.hidden) return;
  heroScreenTimer = window.setInterval(() => showHeroScreenMedia(heroScreenIndex + 1), 9000);
};
startHeroScreenRotation();
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopHeroScreenRotation();
  else startHeroScreenRotation();
});

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !doc.classList.contains('reduce-motion')) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -30px' });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

const sections = [...document.querySelectorAll('main section[id]')];
const navigationLinks = [...document.querySelectorAll('.site-nav a')];
if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    navigationLinks.forEach((link) => {
      const active = link.getAttribute('href') === `#${visible.target.id}`;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-25% 0px -60% 0px', threshold: [0, 0.25, 0.5] });
  sections.forEach((section) => sectionObserver.observe(section));
}

const openDialog = (event) => {
  if (!dialog) return;
  const trigger = event?.currentTarget;
  const service = trigger?.dataset.service;
  const problem = trigger?.dataset.problem;
  const clearProgrammaticError = (field) => {
    if (!field) return;
    const label = field.closest('label');
    label?.classList.remove('field-error');
    label?.querySelector('.field-error-message')?.remove();
    field.removeAttribute('aria-invalid');
  };
  if (service && requestForm?.elements.service) {
    requestForm.elements.service.value = service;
    clearProgrammaticError(requestForm.elements.service);
  }
  if (problem && requestForm?.elements.problem) {
    requestForm.elements.problem.value = problem;
    clearProgrammaticError(requestForm.elements.problem);
  }
  const remainingErrors = requestForm?.querySelectorAll('.field-error').length ?? 0;
  const errorSummary = requestForm?.querySelector('.form-error-summary');
  if (!remainingErrors && errorSummary) errorSummary.hidden = true;
  formOpenedAt = Date.now();
  dialog.showModal();
  document.body.classList.add('dialog-open');
};
const closeDialog = () => {
  dialog?.close();
  document.body.classList.remove('dialog-open');
};

document.querySelectorAll('.request-trigger').forEach((button) => button.addEventListener('click', openDialog));
const activateServiceCard = (card) => {
  const destination = card.dataset.cardHref;
  if (destination) {
    window.location.hash = destination;
    document.querySelector(destination)?.focus({ preventScroll: true });
    return;
  }
  card.querySelector('.request-trigger')?.click();
};
document.querySelectorAll('.service-card[data-card-href], .service-card[data-card-action]').forEach((card) => {
  card.addEventListener('click', (event) => {
    if (event.target.closest('a, button')) return;
    activateServiceCard(card);
  });
  card.addEventListener('keydown', (event) => {
    if (event.target !== card || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    activateServiceCard(card);
  });
});
document.querySelector('.dialog-close')?.addEventListener('click', closeDialog);
dialog?.addEventListener('click', (event) => {
  if (event.target === dialog) closeDialog();
});
dialog?.addEventListener('close', () => document.body.classList.remove('dialog-open'));

const interestParams = new URLSearchParams(window.location.search);
const productInterest = interestParams.get('interest');
const productInterestService = interestParams.get('service') || 'Refurbished device or item';
if (productInterest && dialog && requestForm) {
  const interestTrigger = document.createElement('button');
  interestTrigger.dataset.service = productInterestService;
  interestTrigger.dataset.problem = `I’m interested in ${productInterest}. Please let me know what the next step is and any details you need from me.`;
  openDialog({ currentTarget: interestTrigger });
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.hash}`);
}

const showToast = (message) => {
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.setTimeout(() => toast.classList.remove('is-visible'), 5000);
};

const filePayload = async (file) => {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return { name: file.name, type: file.type, data: btoa(binary) };
};

requestForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const honeyPot = requestForm.elements.website_address;
  if (honeyPot?.value.trim()) {
    showToast('Unable to prepare this request. Please refresh the page and try again.');
    return;
  }

  const requiredFields = [...requestForm.querySelectorAll('[required]')];
  let firstInvalid = null;
  for (const field of requiredFields) {
    const label = field.closest('label');
    const existingMessage = label?.querySelector('.field-error-message');
    existingMessage?.remove();
    label?.classList.remove('field-error');
    field.removeAttribute('aria-invalid');
    if (field.checkValidity()) continue;

    firstInvalid ??= field;
    label?.classList.add('field-error');
    field.setAttribute('aria-invalid', 'true');
    if (field.type !== 'checkbox') {
      const message = document.createElement('span');
      message.className = 'field-error-message';
      message.textContent = field.validity.typeMismatch ? 'Please enter a valid email address.' : 'Please complete this field.';
      label?.append(message);
    }
  }

  const errorSummary = requestForm.querySelector('.form-error-summary');
  if (firstInvalid) {
    if (errorSummary) errorSummary.hidden = false;
    firstInvalid.focus({ preventScroll: true });
    firstInvalid.scrollIntoView({ block: 'center', behavior: doc.classList.contains('reduce-motion') ? 'auto' : 'smooth' });
    return;
  }
  if (errorSummary) errorSummary.hidden = true;

  const formData = new FormData(requestForm);
  const photoInput = requestForm.elements.photos;
  const photos = [...(photoInput?.files || [])];
  if (photos.length > 3 || photos.some((file) => file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) {
    const photoLabel = photoInput?.closest('label');
    photoLabel?.classList.add('field-error');
    photoInput?.setAttribute('aria-invalid', 'true');
    const message = document.createElement('span');
    message.className = 'field-error-message';
    message.textContent = 'Add up to three JPG, PNG or WebP photos, no larger than 5 MB each.';
    photoLabel?.querySelector('.field-error-message')?.remove();
    photoLabel?.append(message);
    if (errorSummary) {
      errorSummary.textContent = 'Please check the photo attachments highlighted in red.';
      errorSummary.hidden = false;
    }
    photoInput?.focus();
    return;
  }

  const submitButton = requestForm.querySelector('button[type="submit"]');
  const originalButtonText = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.textContent = 'Saving request...';
  try {
    const response = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        area: formData.get('area'),
        service: formData.get('service'),
        device: formData.get('device'),
        problem: formData.get('problem'),
        agreement: formData.get('agreement') === 'on',
        websiteAddress: formData.get('website_address'),
        formStartedAt: formOpenedAt,
        photos: await Promise.all(photos.map(filePayload))
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Your request could not be saved.');
    requestForm.reset();
    closeDialog();
    const emailNote = result.emailStatus === 'sent' ? ' A confirmation email is on its way.' : '';
    showToast(`Request ${result.ticketCode} has been saved.${emailNote}`);
  } catch (error) {
    if (errorSummary) {
      errorSummary.textContent = error.message || 'Your request could not be saved. Please try again.';
      errorSummary.hidden = false;
      errorSummary.scrollIntoView({ block: 'center', behavior: doc.classList.contains('reduce-motion') ? 'auto' : 'smooth' });
    }
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonText;
  }
});

requestForm?.addEventListener('input', (event) => {
  const field = event.target;
  if (!field.matches('input, select, textarea') || !field.checkValidity()) return;
  const label = field.closest('label');
  label?.classList.remove('field-error');
  label?.querySelector('.field-error-message')?.remove();
  field.removeAttribute('aria-invalid');
  const remainingErrors = requestForm.querySelectorAll('.field-error').length;
  const errorSummary = requestForm.querySelector('.form-error-summary');
  if (!remainingErrors && errorSummary) errorSummary.hidden = true;
});
