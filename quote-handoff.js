(() => {
  'use strict';
  // Keep native POST submission when these browser features are unavailable.
  if (!window.fetch || !window.FormData || !window.AbortController) return;

  document.querySelectorAll('form.contact-form[action="https://formspree.io/f/xnnyrbaa"]').forEach((form) => {
    const buttons = [...form.querySelectorAll('button[type="submit"], input[type="submit"]')];
    const original = buttons.map((button) => ({
      disabled: button.disabled,
      label: button.tagName === 'INPUT' ? button.value : button.textContent
    }));
    const status = document.createElement('p');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    status.tabIndex = -1;
    status.style.gridColumn = '1 / -1';
    status.style.margin = '0';
    form.append(status);
    let pending = false;

    const reset = () => {
      pending = false;
      form.removeAttribute('aria-busy');
      buttons.forEach((button, index) => {
        button.disabled = original[index].disabled;
        if (button.tagName === 'INPUT') button.value = original[index].label;
        else button.textContent = original[index].label;
      });
    };
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) { reset(); status.textContent = ''; }
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (pending || !form.reportValidity()) return;
      const data = new FormData(form);
      pending = true;
      form.setAttribute('aria-busy', 'true');
      buttons.forEach((button) => {
        button.disabled = true;
        if (button.tagName === 'INPUT') button.value = 'Sending…';
        else button.textContent = 'Sending…';
      });
      status.textContent = 'Sending your project request…';
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 30000);
      let confirmed = false;
      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: data,
          headers: { Accept: 'application/json' },
          signal: controller.signal,
          redirect: 'error'
        });
        const result = await response.json();
        // Never treat an HTML challenge, redirect or rejected response as success.
        if (response.ok && result && result.ok === true && !result.errors) {
          confirmed = true;
          status.textContent = 'Request received. Opening the next step…';
          window.location.assign('/thanks.html');
        } else {
          const errors = Array.isArray(result && result.errors)
            ? result.errors.map((error) => error && error.message).filter((message) => typeof message === 'string')
            : [];
          status.textContent = 'Your request was not confirmed. ' +
            (errors.length ? errors.join(' ') + ' ' : '') +
            'Please review your details and try again, or text Christopher at 513-656-8205.';
        }
      } catch (error) {
        status.textContent = "We couldn't confirm whether your request was received. Please check your connection and try again, or text Christopher at 513-656-8205 if you're unsure.";
      } finally {
        window.clearTimeout(timeout);
        if (!confirmed) { reset(); status.focus(); }
      }
    });
  });
})();
