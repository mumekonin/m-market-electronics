document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.getElementById('menu-btn');
  const navWrapper = document.getElementById('nav-wrapper');
  const toggleMenu = () => {
    const isOpen = navWrapper.classList.toggle('is-open');
    menuBtn.classList.toggle('is-active');
    menuBtn.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : 'auto';
  };
  menuBtn.addEventListener('click', toggleMenu);
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (navWrapper.classList.contains('is-open')) {
        toggleMenu();
      }
    });
  });
});

