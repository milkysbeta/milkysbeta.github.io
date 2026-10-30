(() => {
  const root = document.querySelector('[data-catalogue-products]');
  const filters = document.querySelector('[data-catalogue-filters]');
  const purchaseDialog = document.querySelector('[data-purchase-dialog]');
  const purchaseForm = document.querySelector('[data-purchase-form]');
  const productById = new Map();
  const shopEmail = 'admin@sweetfix.nz';
  let purchaseOpenedAt = 0;
  if (!root || !filters) return;

  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character]);
  const imageUrl = (source = '') => /^https?:\/\//.test(source) ? source : `/${source.replace(/^\//, '')}`;
  const detailUrl = (product) => `/shop/item?id=${encodeURIComponent(product.id)}`;

  function shippingAdvice(product) {
    if (product.category === 'Charging') return {
      label: 'Local pickup or specialist courier',
      note: 'NZ Post does not accept standalone power banks. Choose local pickup, or ask SWEETFIX to check an approved specialist courier before payment.',
      pickupOnly: true
    };
    if (product.category === 'Computers') return {
      label: 'Courier quoted after packing',
      note: 'Tracked delivery with signature will be quoted from the packed size and destination. Computers with an installed battery require careful compliant packaging.',
      pickupOnly: false
    };
    if (['cf2060l', 'tbb-combi-1225', 'tbb-sti500'].includes(product.id)) return {
      label: 'Freight quoted after packing',
      note: 'This is a larger or heavier item. SWEETFIX will confirm packed dimensions, destination and the safest tracked freight option before payment.',
      pickupOnly: false
    };
    return {
      label: 'Tracked NZ delivery available',
      note: 'NZ Post tracked delivery starts at about $9 for a small parcel. Rural delivery adds $6 and signature adds $3. Final postage is confirmed from the packed size and destination.',
      pickupOnly: false
    };
  }

  function productCard(product) {
    const specs = product.specifications.map((specification) => `<li>${escapeHtml(specification)}</li>`).join('');
    const documents = product.documents.length ? `<div class="catalog-documents"><strong>Manufacturer information</strong>${product.documents.map((document) => `<a href="${escapeHtml(document.url)}" target="_blank" rel="noreferrer">${escapeHtml(document.label)} <span aria-hidden="true">↗</span></a>`).join('')}</div>` : '';
    return `<article class="catalog-card product-card live-product reveal is-visible" data-catalog-category="${escapeHtml(product.category)}" data-product-id="${escapeHtml(product.id)}">
      <a class="catalog-product-media product-detail-link" href="${detailUrl(product)}" aria-label="View ${escapeHtml(product.title)} details">
        <img class="card-media" src="${escapeHtml(imageUrl(product.image))}" alt="${escapeHtml(product.imageAlt || product.title)}" decoding="async" />
      </a>
      <div class="card-body">
        <div class="card-kicker"><span>${escapeHtml(product.category)}</span></div>
        <h3><a class="product-title-link" href="${detailUrl(product)}">${escapeHtml(product.title)}</a></h3>
        <p class="product-model">${escapeHtml(product.model)}</p>
        <ul class="spec-list">${specs}</ul>
        <p class="small-note">${product.quantity > 1 ? `${product.quantity} available · ` : ''}${escapeHtml(product.condition)} · Pickup: ${escapeHtml(product.location)}</p>
        <details class="product-details"><summary>Full details &amp; documents</summary><p>${escapeHtml(product.description)}</p>${documents}</details>
        <div class="card-action product-card-action"><span class="price"><small>${product.quantity > 1 ? 'Price per item' : 'Asking price'}</small><strong>NZ$${Number(product.priceNzd || 0).toLocaleString('en-NZ')}</strong></span><button class="button button-small buy-button" type="button" data-buy-product="${escapeHtml(product.id)}">Buy now</button></div>
      </div>
    </article>`;
  }

  function applyFilter(filter) {
    document.querySelectorAll('[data-catalog-category]').forEach((card) => {
      card.hidden = filter !== 'All' && card.dataset.catalogCategory !== filter;
    });
    filters.querySelectorAll('button').forEach((button) => button.classList.toggle('is-active', button.dataset.filter === filter));
  }

  filters.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-filter]');
    if (button) applyFilter(button.dataset.filter || 'All');
  });

  function openPurchase(product) {
    if (!purchaseDialog || !purchaseForm) return;
    const advice = shippingAdvice(product);
    const summary = purchaseDialog.querySelector('[data-purchase-summary]');
    const shipping = purchaseDialog.querySelector('[data-shipping-note]');
    const courierOption = purchaseForm.querySelector('option[value="courier"]');
    purchaseDialog.querySelector('[data-purchase-confirmation]')?.remove();
    purchaseForm.hidden = false;
    purchaseForm.reset();
    purchaseForm.elements.product_id.value = product.id;
    if (summary) summary.innerHTML = `<img src="${escapeHtml(imageUrl(product.image))}" alt="" /><span><small>${escapeHtml(product.category)}</small><strong>${escapeHtml(product.title)}</strong><em>${escapeHtml(product.model)} · NZ$${Number(product.priceNzd || 0).toLocaleString('en-NZ')}</em></span>`;
    if (shipping) shipping.innerHTML = `<strong>${escapeHtml(advice.label)}</strong><span>${escapeHtml(advice.note)}</span>`;
    if (courierOption) courierOption.disabled = advice.pickupOnly;
    purchaseForm.elements.delivery.value = advice.pickupOnly ? 'pickup' : '';
    const status = purchaseForm.querySelector('[data-purchase-status]');
    if (status) status.textContent = '';
    purchaseOpenedAt = Date.now();
    purchaseDialog.showModal();
  }

  function showPurchaseConfirmation({ reference, title, message, emailHref = '', emailLabel = 'Email this order' }) {
    purchaseForm.hidden = true;
    purchaseDialog.querySelector('[data-purchase-confirmation]')?.remove();
    const panel = document.createElement('section');
    panel.className = 'purchase-confirmation';
    panel.dataset.purchaseConfirmation = '';
    panel.innerHTML = `<span class="purchase-confirmation-mark" aria-hidden="true">✓</span><p class="eyebrow">${escapeHtml(reference)}</p><h3>${escapeHtml(title)}</h3><p>${escapeHtml(message)}</p><div class="purchase-confirmation-actions">${emailHref ? `<a class="button" href="${escapeHtml(emailHref)}">${escapeHtml(emailLabel)}</a>` : ''}<button class="button button-ghost" type="button" data-purchase-done>Continue shopping</button></div>`;
    purchaseForm.insertAdjacentElement('afterend', panel);
    panel.querySelector('[data-purchase-done]')?.addEventListener('click', () => purchaseDialog.close());
  }

  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-buy-product]');
    if (button) {
      const product = productById.get(button.dataset.buyProduct);
      if (product) openPurchase(product);
      return;
    }
    if (event.target.closest('a,button,summary,details')) return;
    const card = event.target.closest('[data-product-id]');
    if (card) window.location.href = `/shop/item?id=${encodeURIComponent(card.dataset.productId)}`;
  });

  purchaseDialog?.querySelector('[data-purchase-close]')?.addEventListener('click', () => purchaseDialog.close());
  purchaseDialog?.addEventListener('click', (event) => {
    if (event.target === purchaseDialog) purchaseDialog.close();
  });

  purchaseForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!purchaseForm.reportValidity()) return;
    const data = new FormData(purchaseForm);
    const product = productById.get(String(data.get('product_id')));
    if (!product) return;
    const advice = shippingAdvice(product);
    const button = purchaseForm.querySelector('button[type="submit"]');
    const status = purchaseForm.querySelector('[data-purchase-status]');
    const original = button.textContent;
    button.disabled = true;
    button.textContent = product.paymentUrl ? 'Opening secure payment...' : 'Saving your order...';
    if (status) status.textContent = '';
    try {
      const orderLines = [`Item: ${product.title}`, `Model: ${product.model}`, `Listed price: NZ$${Number(product.priceNzd || 0).toLocaleString('en-NZ')}`, `Delivery preference: ${data.get('delivery')}`, `Name: ${data.get('name')}`, `Email: ${data.get('email')}`, `Phone: ${data.get('phone')}`, `Address: ${data.get('address') || 'Pickup or address to confirm'}`, `Buyer note: ${data.get('note') || 'None'}`];
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'), email: data.get('email'), phone: data.get('phone'), address: data.get('address'), area: '',
          service: 'Refurbished device or item', device: `${product.title} · ${product.model}`,
          problem: [`Purchase request: ${product.title} (${product.model})`, `Listed price: NZ$${Number(product.priceNzd || 0).toLocaleString('en-NZ')}`, `Delivery preference: ${data.get('delivery')}`, `Shipping guidance: ${advice.note}`, `Buyer note: ${data.get('note') || 'None'}`].join('\n'),
          agreement: data.get('agreement') === 'on', websiteAddress: data.get('website_address'), formStartedAt: purchaseOpenedAt, photos: []
        })
      });
      const responseType = response.headers.get('content-type') || '';
      if (!responseType.includes('application/json')) throw Object.assign(new Error('The hosted order service is not connected yet.'), { checkoutUnavailable: true });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Your purchase request could not be saved.');
      if (product.paymentUrl) {
        const paymentUrl = new URL(product.paymentUrl);
        if (paymentUrl.hostname.endsWith('stripe.com')) paymentUrl.searchParams.set('prefilled_email', String(data.get('email') || ''));
        window.location.assign(paymentUrl.href);
        return;
      }
      showPurchaseConfirmation({ reference: `Order ${result.ticketCode}`, title: 'Your order request is saved.', message: 'Matt will confirm availability, delivery and the secure payment link by email.' });
    } catch (error) {
      if (error.checkoutUnavailable) {
        const draftReference = `SF-WEB-${Date.now().toString(36).toUpperCase()}`;
        const draft = { reference: draftReference, productId: product.id, createdAt: new Date().toISOString(), details: Object.fromEntries(data.entries()) };
        try { localStorage.setItem('sweetfix-order-draft', JSON.stringify(draft)); } catch {}
        const subject = `${draftReference}: ${product.title}`;
        const body = [`SWEETFIX order draft ${draftReference}`, '', ...orderLines, '', 'Please confirm availability, delivery and payment details.'].join('\n');
        const emailHref = `mailto:${shopEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        showPurchaseConfirmation({ reference: draftReference, title: 'One last step to send your order.', message: `Your order draft is saved in this browser. Email it to ${shopEmail} so Matt can confirm availability, delivery and payment.`, emailHref });
      } else if (status) status.textContent = error.message || 'Your purchase request could not be saved.';
    } finally {
      button.disabled = false;
      button.textContent = original;
    }
  });

  try {
    const catalogue = window.SWEETFIX_SHOP_CATALOG;
    if (!catalogue || !Array.isArray(catalogue.products)) throw new Error('The current catalogue could not be loaded.');
      catalogue.products.forEach((product) => productById.set(product.id, product));
      root.innerHTML = catalogue.products.map(productCard).join('');
      const requestedProduct = new URLSearchParams(window.location.search).get('buy');
      if (requestedProduct && productById.has(requestedProduct)) openPurchase(productById.get(requestedProduct));
      root.querySelectorAll('img').forEach((image) => image.addEventListener('error', () => {
        const media = image.closest('.catalog-product-media');
        image.remove();
        if (media) media.insertAdjacentHTML('afterbegin', '<div class="catalog-image-missing"><span aria-hidden="true">?</span><small>Product photo being checked</small></div>');
      }, { once: true }));
  } catch (error) {
    root.innerHTML = `<div class="catalogue-loading"><strong>Current stock is being updated.</strong><span>${escapeHtml(error.message)}</span></div>`;
  }
})();
