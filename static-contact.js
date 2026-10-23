(() => {
  const phone = '64220945745';
  const openWhatsApp = (message) => {
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || (!form.matches('#service-request-form') && !form.matches('[data-purchase-form]'))) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    if (form.matches('[data-purchase-form]')) {
      const product = window.SWEETFIX_SHOP_CATALOG?.products?.find((item) => item.id === data.get('product_id'));
      openWhatsApp([
        'Hi Matt, this is a SWEETFIX shop enquiry.',
        product ? `Item: ${product.title} (${product.model})` : 'Item: Shop item',
        `Name: ${data.get('name') || ''}`,
        `Email: ${data.get('email') || ''}`,
        `Phone: ${data.get('phone') || ''}`,
        `Delivery: ${data.get('delivery') || ''}`,
        data.get('address') ? `Address: ${data.get('address')}` : '',
        data.get('note') ? `Note: ${data.get('note')}` : ''
      ].filter(Boolean).join('\n'));
      return;
    }

    openWhatsApp([
      'Hi Matt, I am contacting SWEETFIX from the website.',
      `Name: ${data.get('name') || ''}`,
      `Email: ${data.get('email') || ''}`,
      `Phone: ${data.get('phone') || ''}`,
      data.get('area') ? `Area: ${data.get('area')}` : '',
      data.get('service') ? `Service: ${data.get('service')}` : '',
      data.get('device') ? `Device: ${data.get('device')}` : '',
      data.get('problem') ? `What is happening: ${data.get('problem')}` : ''
    ].filter(Boolean).join('\n'));
  }, true);
})();
