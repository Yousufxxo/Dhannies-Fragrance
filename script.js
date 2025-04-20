function toggleMenu() {
    document.querySelector('nav').classList.toggle('active');
  }

  window.addEventListener('load', () => {
    setTimeout(() => {
      document.getElementById('loader').classList.add('hidden');
      document.getElementById('main-content').classList.remove('hidden');
    }, 3000);
  });

        // Mobile Menu Toggle
        const hamburger = document.querySelector('.hamburger');
        const navLinks = document.querySelector('.nav-links');
        const navItems = document.querySelectorAll('.nav-links a');

        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
        });

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                navLinks.classList.remove('active');
                hamburger.classList.remove('active');
            });
        });

        // Toggle Cart Modal
        cartIcon.addEventListener('click', () => {
            cartModal.classList.toggle('active');
        });

        closeCart.addEventListener('click', () => {
            cartModal.classList.remove('active');
        });

       

                // Bounce animation
                cartIcon.classList.add('bounce');
                setTimeout(() => {
                    cartIcon.classList.remove('bounce');
                }, 1000);
    
      

            // Add event listeners to remove buttons
            document.querySelectorAll('.remove-item').forEach(button => {
                button.addEventListener('click', (e) => {
                    const id = e.target.getAttribute('data-id');
                    cart = cart.filter(item => item.id !== id);
                    updateCart();
                });
            });
    


        // Smooth Scrolling
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                document.querySelector(this.getAttribute('href')).scrollIntoView({
                    behavior: 'smooth'
                });
            });
        });