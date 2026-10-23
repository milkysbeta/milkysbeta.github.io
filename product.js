(() => {
  const catalogue = window.SWEETFIX_SHOP_CATALOG;
  const id = new URLSearchParams(window.location.search).get('id');
  const product = catalogue?.products?.find((item) => item.id === id);
  const loading = document.querySelector('[data-product-loading]');
  const detail = document.querySelector('[data-product-detail]');
  const notFound = document.querySelector('[data-product-not-found]');
  if (!product) {
    if (loading) loading.hidden = true;
    if (notFound) notFound.hidden = false;
    return;
  }

  const setText = (selector, value) => { const element = document.querySelector(selector); if (element) element.textContent = value; };
  const escapeHtml = (value = '') => String(value).replace(/[&<>"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character]);
  const safeDocumentUrl = (value = '') => {
    try {
      const url = new URL(value, window.location.origin);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '#';
    } catch {
      return '#';
    }
  };
  const imageUrl = (source = '') => /^https?:\/\//.test(source) ? source : `/${source.replace(/^\//, '')}`;
  const money = `NZ$${Number(product.priceNzd || 0).toLocaleString('en-NZ')}`;
  const enquiry = `/?interest=${encodeURIComponent(`the ${product.title} (${product.model})`)}&service=${encodeURIComponent('Refurbished device or item')}`;
  const buy = `/shop?buy=${encodeURIComponent(product.id)}`;
  const comparisonByCategory = {
    Computers: { title: 'Checked, described and ready for a second life.', points: [['Compared with buying new', 'A refurbished business or gaming computer can offer much more performance for the money, without sending useful hardware to e-waste.'], ['SWEETFIX checks', 'The exact model, key specifications, ports, storage, battery and obvious faults are checked before handover.'], ['Good to know', 'Ask if you want setup, data transfer, a larger SSD or more memory included in the final quote.']] },
    Solar: { title: 'Match the controller or inverter to the system.', points: [['Compared with basic alternatives', 'The useful comparison is not only price. Voltage range, current rating, PV input, waveform, monitoring and battery compatibility all matter.'], ['Confirm before fitting', 'Send a photo of the battery bank, panel label, existing wiring and current controller so the model can be checked against the real system.'], ['Installation boundary', 'SWEETFIX can help with low-voltage equipment, setup and diagnosis. Prescribed or mains electrical work is referred to a licensed electrician.']] },
    Charging: { title: 'Capacity, output and safe transport matter.', points: [['Compared with smaller banks', 'A larger Wh rating gives more runtime, while USB-C power delivery and port limits determine how quickly devices charge.'], ['SWEETFIX checks', 'Ports, indicators and basic charging behaviour are checked before handover.'], ['Delivery note', 'NZ Post does not accept standalone power banks. Local pickup or an approved specialist courier must be arranged.']] },
    Photography: { title: 'Check format, seals and expiry first.', points: [['Compatibility', 'Instax Mini film works with Instax Mini cameras and printers, not Square or Wide models.'], ['SWEETFIX checks', 'The foil seals and printed expiry are checked before handover.'], ['Value', 'Compare by sheet count as well as pack price. This listing contains two sealed 10-sheet cartridges.']] }
  };
  const comparison = comparisonByCategory[product.category] || { title: 'Checked carefully before handover.', points: [['What you receive', 'The exact item shown, with condition and key details confirmed before payment.'], ['Need help choosing?', 'Ask SWEETFIX to compare compatibility, condition and total setup cost before deciding.']] };
  const shipping = product.category === 'Charging'
    ? { title: 'Local pickup or specialist courier.', copy: 'Standalone power banks cannot be sent through NZ Post. Choose local pickup, or ask SWEETFIX to check a suitable approved courier.' }
    : product.category === 'Computers'
      ? { title: 'Pickup, local delivery or tracked courier.', copy: 'Final delivery is quoted after the computer is packed and the destination is known. Signature and compliant battery packaging are used where required.' }
      : ['cf2060l', 'tbb-combi-provisional', 'sti500-24-230'].includes(product.id)
        ? { title: 'Freight confirmed from packed size and destination.', copy: 'This is a larger or heavier item, so the safest tracked freight option is confirmed before payment.' }
        : { title: 'Tracked delivery available around New Zealand.', copy: 'Small-parcel delivery starts at about $9. Rural delivery and signature cost extra, and the final amount is confirmed from the packed size and destination.' };

  document.title = `${product.title} | SWEETFIX Wānaka`;
  setText('[data-product-breadcrumb]', product.title);
  setText('[data-product-category]', product.category);
  setText('[data-product-title]', product.title);
  setText('[data-product-model]', product.model);
  setText('[data-product-description]', product.description);
  setText('[data-product-condition]', product.condition);
  setText('[data-product-location]', `Collection area: ${product.location}`);
  setText('[data-product-price]', money);
  setText('[data-comparison-title]', comparison.title);
  setText('[data-shipping-title]', shipping.title);
  setText('[data-shipping-copy]', shipping.copy);
  const image = document.querySelector('[data-product-image]');
  if (image) { image.src = imageUrl(product.image); image.alt = product.imageAlt || product.title; }
  document.querySelectorAll('[data-product-enquire]').forEach((link) => link.href = enquiry);
  document.querySelectorAll('[data-product-buy],[data-product-buy-secondary]').forEach((link) => link.href = buy);
  const specs = document.querySelector('[data-product-specifications]');
  if (specs) specs.innerHTML = product.specifications.map((specification) => `<li>${escapeHtml(specification)}</li>`).join('');
  const comparisons = document.querySelector('[data-product-comparisons]');
  if (comparisons) comparisons.innerHTML = comparison.points.map(([title, copy]) => `<section><h3>${escapeHtml(title)}</h3><p>${escapeHtml(copy)}</p></section>`).join('');
  const documents = document.querySelector('[data-product-documents]');
  const documentsSection = document.querySelector('[data-documents-section]');
  if (documents && product.documents?.length) {
    documents.innerHTML = product.documents.map((document) => `<a href="${escapeHtml(safeDocumentUrl(document.url))}" target="_blank" rel="noreferrer"><span>${escapeHtml(document.label)}</span><b aria-hidden="true">↗</b></a>`).join('');
    documentsSection.hidden = false;
  }
  if (loading) loading.hidden = true;
  if (detail) detail.hidden = false;
})();
