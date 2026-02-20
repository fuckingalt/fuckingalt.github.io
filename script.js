document.addEventListener('DOMContentLoaded', () => {

    // Configuration
    const AUDIO_BOOST_PERCENT = 500; // Setting to 500 means 5x louder than normal (500%).

    // Logic State
    let cart = [];
    let isPromoApplied = false;
    let requiredPromo = ""; // Expected promo code from the user, set empty initially but updated later.
    let cartTotal = 0;

    // Security Hardening (Sanitization)
    function sanitizeInput(str) {
        if (!str) return "";
        // Strip out HTML tags and special characters that could be used for XSS
        return str.replace(/[<>&'"]/g, "").trim();
    }

    // DOM Elements - Cart Triggers
    const cartOverlay = document.getElementById('cart-overlay');
    const openCartBtn = document.getElementById('cart-btn');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartCountDisplay = document.getElementById('cart-count');
    const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');

    // DOM Elements - Cart Content
    const cartItemsContainer = document.getElementById('cart-items-container');
    const subtotalPrice = document.getElementById('subtotal-price');
    const discountRow = document.getElementById('discount-row');
    const discountPrice = document.getElementById('discount-price');
    const totalPrice = document.getElementById('total-price');
    const checkoutBtn = document.getElementById('checkout-btn');

    // Promo Elements
    const promoInput = document.getElementById('promo-input');
    const applyPromoBtn = document.getElementById('apply-promo-btn');
    const promoMessage = document.getElementById('promo-message');

    // DOM Elements - Checkout Flow
    const checkoutOverlay = document.getElementById('checkout-overlay');
    const closeCheckoutBtn = document.getElementById('close-checkout-btn');
    const ccForm = document.getElementById('cc-form');
    const freeMsg = document.getElementById('free-checkout-msg');
    const mcUsernameInput = document.getElementById('mc-username');
    const readonlyInputs = document.querySelectorAll('.readonly-if-free');
    const finalCheckoutTotal = document.getElementById('final-checkout-total');
    const finalizeOrderBtn = document.getElementById('finalize-order-btn');

    // DOM Elements - Media Troll
    const trollModal = document.getElementById('troll-modal');
    const trollGif = document.getElementById('troll-gif');
    const trollAudio = document.getElementById('troll-audio');

    // ----------------------------
    // CART LOGIC
    // ----------------------------
    function toggleCart() {
        cartOverlay.classList.toggle('hidden');
    }

    openCartBtn.addEventListener('click', toggleCart);
    closeCartBtn.addEventListener('click', toggleCart);
    cartOverlay.addEventListener('click', (e) => {
        if (e.target === cartOverlay) toggleCart();
    });

    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            const id = card.getAttribute('data-id');
            const name = card.getAttribute('data-name');
            const price = parseFloat(card.getAttribute('data-price'));

            // Check if already in cart
            if (cart.find(item => item.id === id)) {
                btn.textContent = "Already Added!";
                setTimeout(() => btn.textContent = "Add to Cart", 1500);
                return;
            }

            cart.push({ id, name, price });
            updateCartUI();

            // Visual feedback
            btn.textContent = "Added ✓";
            btn.style.background = "var(--success-color)";
            btn.style.color = "white";
            btn.style.borderColor = "var(--success-color)";
            setTimeout(() => {
                btn.textContent = "Add to Cart";
                btn.style.background = "";
                btn.style.color = "";
                btn.style.borderColor = "";
            }, 1000);

            if (cartOverlay.classList.contains('hidden')) toggleCart();
        });
    });

    function removeFromCart(id) {
        cart = cart.filter(item => item.id !== id);
        updateCartUI();
    }

    function updateCartUI() {
        cartCountDisplay.textContent = cart.length;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<div class="empty-cart-msg">Your cart is empty.</div>';
            checkoutBtn.disabled = true;
            cartTotal = 0;
            renderPrices();
            return;
        }

        checkoutBtn.disabled = false;
        cartItemsContainer.innerHTML = '';
        cartTotal = 0;

        cart.forEach(item => {
            cartTotal += item.price;

            const itemEl = document.createElement('div');
            itemEl.className = 'cart-item';
            itemEl.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>$${item.price.toFixed(2)}</p>
                </div>
                <button class="remove-item-btn" data-id="${item.id}">×</button>
            `;
            cartItemsContainer.appendChild(itemEl);
        });

        renderPrices();

        document.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                removeFromCart(id);
            });
        });
    }

    function renderPrices() {
        subtotalPrice.textContent = `$${cartTotal.toFixed(2)}`;

        let finalTotal = cartTotal;

        if (isPromoApplied) {
            discountRow.classList.remove('hidden');
            discountPrice.textContent = `-$${cartTotal.toFixed(2)}`;
            finalTotal = 0;
        } else {
            discountRow.classList.add('hidden');
        }

        totalPrice.textContent = `$${finalTotal.toFixed(2)}`;
        finalCheckoutTotal.textContent = `$${finalTotal.toFixed(2)}`;

        // Adjust checkout forms based on price
        if (finalTotal === 0 && isPromoApplied) {
            ccForm.classList.add('hidden');
            freeMsg.classList.remove('hidden');
            readonlyInputs.forEach(input => input.disabled = true);
        } else {
            ccForm.classList.remove('hidden');
            freeMsg.classList.add('hidden');
            readonlyInputs.forEach(input => input.disabled = false); // Let them pretend they have to put it in
        }
    }

    // ----------------------------
    // PROMO REVEAL LOGIC
    // ----------------------------
    const promoRevealOverlay = document.getElementById('promo-reveal-modal');
    const closePromoBtn = document.getElementById('close-promo-btn');
    const claimPromoBtn = document.getElementById('claim-promo-btn');

    function closePromo() {
        promoRevealOverlay.classList.add('hidden');
    }

    closePromoBtn.addEventListener('click', closePromo);
    claimPromoBtn.addEventListener('click', closePromo);

    // ----------------------------
    // PROMO LOGIC
    // ----------------------------
    applyPromoBtn.addEventListener('click', () => {
        // Sanitize the code to prevent XSS if we ever log it or render it
        const code = sanitizeInput(promoInput.value).toUpperCase();

        if (code === "") {
            promoMessage.textContent = "Please enter a code.";
            promoMessage.className = "promo-message error";
            promoMessage.classList.remove('hidden');
            isPromoApplied = false;
        } else if (code === "ONE100") {
            promoMessage.textContent = "100% OFF Discount applied successfully!";
            promoMessage.className = "promo-message success";
            promoMessage.classList.remove('hidden');
            isPromoApplied = true;
        } else {
            promoMessage.textContent = "Invalid or expired promo code.";
            promoMessage.className = "promo-message error";
            promoMessage.classList.remove('hidden');
            isPromoApplied = false;
        }

        renderPrices();
    });

    // ----------------------------
    // CHECKOUT LOGIC & MEDIA TROLL
    // ----------------------------

    checkoutBtn.addEventListener('click', () => {
        cartOverlay.classList.add('hidden');
        checkoutOverlay.classList.remove('hidden');
    });

    closeCheckoutBtn.addEventListener('click', () => {
        checkoutOverlay.classList.add('hidden');
    });

    finalizeOrderBtn.addEventListener('click', () => {
        // Sanitize username input to prevent XSS payloads
        const username = sanitizeInput(mcUsernameInput.value);
        if (!username) {
            mcUsernameInput.style.borderColor = 'red';
            setTimeout(() => mcUsernameInput.style.borderColor = '', 1000);
            return;
        }

        // TRIGGER THE TROLL
        checkoutOverlay.classList.add('hidden');
        trollModal.classList.remove('hidden');

        // Apply audio boost (Web Audio API) to go beyond 100% volume
        if (!window.audioCtx) {
            window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            window.audioTrack = window.audioCtx.createMediaElementSource(trollAudio);
            window.audioGainNode = window.audioCtx.createGain();

            // Convert percentage to multiplier (e.g. 500% = 5.0)
            window.audioGainNode.gain.value = AUDIO_BOOST_PERCENT / 100; // lazy to use this btw

            window.audioTrack.connect(window.audioGainNode).connect(window.audioCtx.destination);
        }

        // Resume context if suspended by browser autoplay policies
        if (window.audioCtx.state === 'suspended') {
            window.audioCtx.resume();
        }

        // Play the custom audio immediately
        trollAudio.currentTime = 0;
        trollAudio.play().catch(e => {
            console.log("Audio playback was prevented by the browser. Requires manual interaction.", e);
        });
    });

    // Just in case they click the troll screen, play it if autoplay was blocked
    trollModal.addEventListener('click', () => {
        trollAudio.play();
    });

});

