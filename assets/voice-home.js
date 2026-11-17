// Page navigation keeps the existing #audit and /audit.html entry points working.
const landingPage = document.getElementById('page-landing');
const auditPage = document.getElementById('page-audit');
const navToggle = document.querySelector('.menu-toggle');
const navLinks = document.getElementById('main-nav');
function closeMenu() {
  navToggle.setAttribute('aria-expanded', 'false');
  navLinks.classList.remove('is-open');
}
function showAudit(updateHistory = true) {
  closeMenu();
  landingPage.style.display = 'none';
  auditPage.style.display = 'block';
  document.querySelector('.skip-link').href = '#audit-title';
  if (updateHistory && location.hash !== '#audit') history.pushState(null, '', '/#audit');
  if (!auditStarted) { renderStep(0); auditStarted = true; }
  window.scrollTo({top: 0, behavior: 'instant'});
  document.getElementById('audit-title').focus({preventScroll: true});
}
function showLanding(updateHistory = true, resetScroll = true) {
  landingPage.style.display = 'block';
  auditPage.style.display = 'none';
  document.querySelector('.skip-link').href = '#main';
  if (updateHistory && (location.hash === '#audit' || /^\/audit(?:\.html)?\/?$/.test(location.pathname))) {
    history.pushState(null, '', '/');
  }
  if (resetScroll) window.scrollTo({top: 0, behavior: 'instant'});
}
function syncPage() {
  if (['#audit', '#audit-title'].includes(location.hash) || (!location.hash && /^\/audit(?:\.html)?\/?$/.test(location.pathname))) showAudit(false);
  else {
    showLanding(false, false);
    const target = document.getElementById(location.hash.slice(1));
    if (target) target.scrollIntoView({behavior: 'instant'});
    else window.scrollTo({top: 0, behavior: 'instant'});
  }
}
window.addEventListener('hashchange', syncPage);
window.addEventListener('popstate', syncPage);
navToggle.addEventListener('click', () => {
  const open = navToggle.getAttribute('aria-expanded') !== 'true';
  navToggle.setAttribute('aria-expanded', String(open));
  navLinks.classList.toggle('is-open', open);
});
navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    navToggle.focus();
  }
});

// Clearly labelled, local examples. These controls never operate real agents.
const examples = {
  enquiries: {
    title: 'Enquiry captured. Next step ready.', person: 'A new customer needs a quote.',
    copy: 'Your agent could collect the job details and preferred callback time, then prepare a summary for your team.',
    rule: 'Your team confirms the quote and handles anything unusual.'
  },
  followup: {
    title: 'A timely follow-up, on your terms.', person: 'A customer asked you to call back.',
    copy: 'Your agent could make an agreed callback, check whether the customer needs more information and prepare the next step.',
    rule: 'Permission, approved scripts and a clear handoff come first.'
  },
  invoices: {
    title: 'The paperwork, ready for review.', person: 'A completed job needs an invoice.',
    copy: 'Your agent could gather the job details and prepare a draft using a validated accounting connection.',
    rule: 'You approve financial actions. Nothing is issued from this preview.'
  }
};
const tabs = Array.from(document.querySelectorAll('.agent-tab'));
function selectExample(tab) {
  const example = examples[tab.dataset.agent];
  tabs.forEach(item => {
    item.setAttribute('aria-selected', String(item === tab));
    item.tabIndex = item === tab ? 0 : -1;
  });
  document.getElementById('agent-panel').setAttribute('aria-labelledby', tab.id);
  for (const field of ['title', 'person', 'copy', 'rule']) {
    document.getElementById('example-' + field).textContent = example[field];
  }
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectExample(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) {
      event.preventDefault(); selectExample(tabs[next]); tabs[next].focus();
    }
  });
});

// Keep the existing endpoint and launch tag. Only confirmed responses show success.
const signupForm = document.getElementById('waitlist-form');
signupForm.addEventListener('submit', async event => {
  event.preventDefault();
  const button = signupForm.querySelector('button');
  if (button.disabled) return;
  const status = document.getElementById('signup-status');
  const nameInput = signupForm.elements.name;
  const name = nameInput.value.trim();
  const email = signupForm.elements.email.value.trim();
  if (!name) {
    nameInput.setCustomValidity('Please enter your name.'); nameInput.reportValidity(); return;
  }
  status.textContent = ''; status.className = 'form-status';
  button.disabled = true; button.textContent = 'Joining…';
  signupForm.setAttribute('aria-busy', 'true');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch('/api/waitlist', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({name, email, tag: 'voice-ai-management-waitlist'}), signal: controller.signal
    });
    if (!response.ok) throw new Error('Signup request failed');
    const result = await response.json();
    if (!result || result.success !== true) throw new Error('Signup not confirmed');
    signupForm.hidden = true;
    const success = document.createElement('div'); success.className = 'signup-success';
    const title = document.createElement('h3'); title.textContent = 'You’re on the list.';
    const description = document.createElement('p'); description.textContent = 'We’ll be in touch with voice AI launch news and relevant pilot opportunities.';
    success.append(title, description); status.append(success);
    signupForm.parentElement.querySelector('.signup-note').hidden = true;
  } catch (error) {
    status.classList.add('error');
    status.textContent = error.name === 'AbortError'
      ? 'We couldn’t confirm your signup in time. Please try again, or contact us if this keeps happening.'
      : 'We couldn’t confirm your signup. Your details are still here — please try again.';
    button.disabled = false; button.textContent = 'Try again ↗';
  } finally {
    clearTimeout(timeout); signupForm.removeAttribute('aria-busy');
  }
});
signupForm.elements.name.addEventListener('input', () => signupForm.elements.name.setCustomValidity(''));
syncPage();
