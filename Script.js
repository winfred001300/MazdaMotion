"use strict";

const CART_STORAGE_KEY = "mazdaMotionCart";
const ORDER_STORAGE_KEY = "mazdaMotionOrder";

const DELIVERY_FEE = 0;

function formatPrice(price) {
    return Number(price || 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => {
        const characters = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return characters[character];
    });
}

function getElement(id) {
    return document.getElementById(id);
}

function resolveImagePath(imagePath, sourcePage = document.baseURI) {

    if (!imagePath || typeof imagePath !== "string") {
        return "";
    }

    const path = imagePath.trim();

    if (!path) return "";

    
    if (/^(data:|blob:|https?:\/\/)/i.test(path)) {
        return path;
    }

    try {

        
        return new URL(path, sourcePage).href;

    } catch (error) {

        console.error("Unable to resolve image path:", path);

        return "";

    }
}

function createProductImage(imagePath, productName, className = "") {

    const imageURL = resolveImagePath(imagePath);

    if (!imageURL) {

        return `
            <div class="cart-image-placeholder">
                No Image Available
            </div>
        `;

    }

    return `
        <img
            src="${escapeHTML(imageURL)}"
            alt="${escapeHTML(productName)}"
            class="${escapeHTML(className)}"
            onerror="
                this.style.display='none';
                this.nextElementSibling.style.display='flex';
            "
        >

        <div
            class="cart-image-placeholder"
            style="display:none;"
        >
            Image Unavailable
        </div>
    `;
}

function getCart() {

    try {

        const cart = JSON.parse(
            localStorage.getItem(CART_STORAGE_KEY) || "[]"
        );

        if (!Array.isArray(cart)) return [];

        return cart.filter(item => {

            return (
                item &&
                typeof item.name === "string" &&
                item.name.trim() !== "" &&
                Number.isFinite(Number(item.price)) &&
                Number(item.price) >= 0 &&
                Number.isFinite(Number(item.quantity)) &&
                Number(item.quantity) >= 1
            );

        }).map(item => ({

            name: item.name.trim(),

            price: Number(item.price),

            quantity: Math.max(
                1,
                Math.floor(Number(item.quantity))
            ),

            image: typeof item.image === "string"
                ? item.image
                : ""

        }));

    } catch (error) {

        console.error("Unable to retrieve cart:", error);

        return [];

    }

}

function saveCart(cart) {

    localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cart)
    );

}

function initializeNavigation() {

    const menuToggle = getElement("menuToggle");
    const mainNav = getElement("mainNav");

    if (!menuToggle || !mainNav) return;

    menuToggle.addEventListener("click", function () {

        const isOpen = mainNav.classList.toggle("show");

        menuToggle.setAttribute(
            "aria-expanded",
            String(isOpen)
        );

    });

    mainNav.querySelectorAll("a").forEach(link => {

        link.addEventListener("click", function () {

            mainNav.classList.remove("show");

            menuToggle.setAttribute(
                "aria-expanded",
                "false"
            );

        });

    });

}

function updateCartCounter() {

    const cartCount = getElement("cartCount");

    if (!cartCount) return;

    const totalItems = getCart().reduce(
        (total, item) => total + item.quantity,
        0
    );

    cartCount.textContent = totalItems;

}

function displayCart() {

    const cartItems = getElement("cart-items");
    const cartTotal = getElement("cart-total");
    const cartSubtotal = getElement("cart-subtotal");
    const summaryItems = getElement("summaryItems");
    const checkoutButton = getElement("checkoutButton");

    if (!cartItems || !cartTotal) return;

    const cart = getCart();

    let total = 0;
    let totalItems = 0;

    if (cart.length === 0) {

        cartItems.innerHTML = `
            <div class="empty-cart">

                <h3>Your Shopping Cart is Empty</h3>

                <p>
                    You haven't added any automotive parts yet.
                    Explore our collection and find what you need.
                </p>

                <a href="Products.html" class="button">
                    Explore Products
                </a>

            </div>
        `;

        cartTotal.textContent = "0.00";

        if (cartSubtotal) {
            cartSubtotal.textContent = "0.00";
        }

        if (summaryItems) {
            summaryItems.textContent = "0";
        }

        if (checkoutButton) {

            checkoutButton.disabled = true;

            checkoutButton.classList.add("disabled");

            checkoutButton.setAttribute("aria-disabled", "true");

        }

        return;

    }

    if (checkoutButton) {

        checkoutButton.disabled = false;

        checkoutButton.classList.remove("disabled");

        checkoutButton.removeAttribute("aria-disabled");

    }

    cartItems.innerHTML = cart.map((item, index) => {

        const subtotal = item.price * item.quantity;

        total += subtotal;

        totalItems += item.quantity;

        const imageHTML = item.image
            ? createProductImage(
                item.image,
                item.name,
                "cart-product-image"
            )
            : `
                <div class="cart-image-placeholder">
                    No Image Available
                </div>
            `;

        return `

            <div class="cart-item">

                <div class="cart-item-image">

                    ${imageHTML}

                </div>

                <div class="cart-item-info">

                    <h3>
                        ${escapeHTML(item.name)}
                    </h3>

                    <p class="cart-item-price">
                        ₱${formatPrice(item.price)}
                    </p>

                    <div class="cart-item-actions">

                        <div class="quantity-controls">

                            <button
                                type="button"
                                class="quantity-button"
                                data-action="decrease"
                                data-index="${index}">
                                −
                            </button>

                            <span class="quantity-value">
                                ${item.quantity}
                            </span>

                            <button
                                type="button"
                                class="quantity-button"
                                data-action="increase"
                                data-index="${index}">
                                +
                            </button>

                        </div>

                        <button
                            type="button"
                            class="remove-item-button"
                            data-action="remove"
                            data-index="${index}">
                            Remove Item
                        </button>

                    </div>

                </div>

                <div class="cart-item-subtotal">

                    <span>Subtotal</span>

                    <strong>
                        ₱${formatPrice(subtotal)}
                    </strong>

                </div>

            </div>

        `;

    }).join("");

    cartTotal.textContent = formatPrice(total);

    if (cartSubtotal) {
        cartSubtotal.textContent = formatPrice(total);
    }

    if (summaryItems) {
        summaryItems.textContent = totalItems;
    }

}

function changeQuantity(index, action) {

    const cart = getCart();

    if (!cart[index]) return;

    if (action === "increase") {

        cart[index].quantity++;

    } else if (action === "decrease") {

        if (cart[index].quantity > 1) {

            cart[index].quantity--;

        } else {

            alert("Minimum product quantity is 1.");

            return;

        }

    } else {

        return;

    }

    try {

        saveCart(cart);

        refreshCart();

    } catch (error) {

        console.error("Unable to update quantity:", error);

        alert("Unable to update your cart.");

    }

}

function removeCartItem(index) {

    const cart = getCart();

    if (!cart[index]) return;

    const productName = cart[index].name;

    cart.splice(index, 1);

    try {

        saveCart(cart);

        refreshCart();

        alert(productName + " has been removed from your cart.");

    } catch (error) {

        console.error("Unable to remove product:", error);

        alert("Unable to remove this product.");

    }

}

function initializeCartButtons() {

    const cartItems = getElement("cart-items");

    if (!cartItems) return;

    cartItems.addEventListener("click", function (event) {

        const button = event.target.closest("button[data-action]");

        if (!button) return;

        const action = button.dataset.action;

        const index = Number(button.dataset.index);

        if (!Number.isInteger(index) || index < 0) return;

        if (action === "increase" || action === "decrease") {

            changeQuantity(index, action);

        } else if (action === "remove") {

            removeCartItem(index);

        }

    });

}

function clearCart() {

    if (getCart().length === 0) {

        alert("Your shopping cart is already empty.");

        return;

    }

    if (!confirm("Are you sure you want to clear your shopping cart?")) {
        return;
    }

    try {

        localStorage.removeItem(CART_STORAGE_KEY);

        refreshCart();

        alert("Your shopping cart has been cleared!");

    } catch (error) {

        console.error("Unable to clear cart:", error);

        alert("Unable to clear your shopping cart.");

    }

}

function refreshCart() {

    updateCartCounter();

    displayCart();

    displayCheckoutOrder();

}

function addProductToCart(button) {

    const productCard = button.closest(".product-card");

    const productName =

        button.dataset.name ||

        productCard?.querySelector("h3")?.textContent.trim() ||

        "";

    const productPrice = Number(

        button.dataset.price ||

        productCard?.dataset.price

    );

    const imageElement =

        productCard?.querySelector("img") ||

        getElement("productImage");

    const rawImagePath =

        button.dataset.image ||

        imageElement?.getAttribute("src") ||

        imageElement?.getAttribute("data-src") ||

        imageElement?.currentSrc ||

        "";

    const productImage = resolveImagePath(
        rawImagePath,
        document.baseURI
    );

    if (

        !productName ||

        !Number.isFinite(productPrice) ||

        productPrice <= 0

    ) {

        alert("Unable to add product. Please check its information.");

        return;

    }

    try {

        const cart = getCart();

        const existingProduct = cart.find(item => {

            return item.name.toLowerCase() === productName.toLowerCase();

        });

        if (existingProduct) {

            existingProduct.quantity++;

            if (productImage) {

                existingProduct.image = productImage;

            }

        } else {

            cart.push({

                name: productName,

                price: productPrice,

                quantity: 1,

                image: productImage

            });

        }

        saveCart(cart);

        refreshCart();

        alert(productName + " has been added to your cart!");

    } catch (error) {

        console.error("Unable to add product:", error);

        alert("Unable to save your cart. Please try again.");

    }

}


function initializeAddToCartButtons() {

    document.addEventListener("click", function (event) {

        const button = event.target.closest(".add-to-cart");

        if (!button) return;

        event.preventDefault();

        addProductToCart(button);

    });

}


function initializeProductFilters() {

    const productSearch = getElement("productSearch");

    const categoryFilter = getElement("categoryFilter");

    const productCards = document.querySelectorAll(
        ".shop-page .product-card"
    );

    if (!productCards.length) return;

    function filterProducts() {

        const searchValue = productSearch
            ? productSearch.value.toLowerCase().trim()
            : "";

        const selectedCategory = categoryFilter
            ? categoryFilter.value.toLowerCase().trim()
            : "all";

        productCards.forEach(card => {

            const productName =

                card.querySelector("h3")?.textContent.toLowerCase() ||

                card.dataset.name?.toLowerCase() ||

                "";

            const productCategory =

                (card.dataset.category || "").toLowerCase().trim();

            const matchesSearch = productName.includes(searchValue);

            const matchesCategory =

                selectedCategory === "all" ||

                productCategory === selectedCategory;

            card.style.display =

                matchesSearch && matchesCategory ? "" : "none";

        });

    }

    productSearch?.addEventListener("input", filterProducts);

    categoryFilter?.addEventListener("change", filterProducts);

    filterProducts();

}

function displayCheckoutOrder() {

    const checkoutItems = getElement("checkoutItems");

    const checkoutItemCount = getElement("checkoutItemCount");

    const checkoutSubtotal = getElement("checkoutSubtotal");

    const checkoutDelivery = getElement("checkoutDelivery");

    const checkoutTotal = getElement("checkoutTotal");

    const placeOrderButton = getElement("placeOrderButton");

    if (!checkoutItems) return;

    const cart = getCart();

    let subtotal = 0;

    let totalItems = 0;

    if (cart.length === 0) {

        checkoutItems.innerHTML = `

            <div class="empty-checkout">

                <h3>Your cart is empty.</h3>

                <p>
                    Please add products before proceeding to checkout.
                </p>

                <a href="Products.html" class="button">
                    Explore Products
                </a>

            </div>

        `;

        if (checkoutItemCount) {
            checkoutItemCount.textContent = "0";
        }

        if (checkoutSubtotal) {
            checkoutSubtotal.textContent = "0.00";
        }

        if (checkoutDelivery) {
            checkoutDelivery.textContent = "0.00";
        }

        if (checkoutTotal) {
            checkoutTotal.textContent = "0.00";
        }

        if (placeOrderButton) {

            placeOrderButton.disabled = true;

            placeOrderButton.textContent = "Cart is Empty";

        }

        return;

    }

    checkoutItems.innerHTML = cart.map(item => {

        const itemSubtotal = item.price * item.quantity;

        subtotal += itemSubtotal;

        totalItems += item.quantity;

        const imageHTML = item.image

            ? createProductImage(
                item.image,
                item.name,
                "checkout-product-image"
            )

            : `
                <div class="checkout-image-placeholder">
                    No Image Available
                </div>
            `;

        return `

            <div class="checkout-product">

                <div class="checkout-product-image-wrapper">

                    ${imageHTML}

                </div>

                <div class="checkout-product-info">

                    <strong>
                        ${escapeHTML(item.name)}
                    </strong>

                    <small>
                        Quantity: ${item.quantity}
                    </small>

                    <small>
                        ₱${formatPrice(item.price)} each
                    </small>

                </div>

                <strong>
                    ₱${formatPrice(itemSubtotal)}
                </strong>

            </div>

        `;

    }).join("");

    const grandTotal = subtotal + DELIVERY_FEE;

    if (checkoutItemCount) {
        checkoutItemCount.textContent = totalItems;
    }

    if (checkoutSubtotal) {
        checkoutSubtotal.textContent = formatPrice(subtotal);
    }

    if (checkoutDelivery) {
        checkoutDelivery.textContent = formatPrice(DELIVERY_FEE);
    }

    if (checkoutTotal) {
        checkoutTotal.textContent = formatPrice(grandTotal);
    }

    if (placeOrderButton) {

        placeOrderButton.disabled = false;

        placeOrderButton.textContent = "Place Order";

    }

}

function initializeCheckoutButton() {

    const checkoutButton = getElement("checkoutButton");

    if (!checkoutButton) return;

    checkoutButton.disabled = getCart().length === 0;

    checkoutButton.addEventListener("click", function (event) {

        event.preventDefault();

        if (getCart().length === 0) {

            alert("Your shopping cart is empty.");

            return;

        }

        window.location.href = "Checkout.html";

    });

}

function initializeCheckoutForm() {

    const checkoutForm = getElement("checkoutForm");

    if (!checkoutForm) return;

    checkoutForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const cart = getCart();

        if (cart.length === 0) {

            alert("Your shopping cart is empty.");

            return;

        }

        if (!checkoutForm.checkValidity()) {

            checkoutForm.reportValidity();

            return;

        }

        const paymentMethod = document.querySelector(
            'input[name="paymentMethod"]:checked'
        );

        if (!paymentMethod) {

            alert("Please select a payment method.");

            return;

        }

        const customer = {

            fullName: getElement("customerName")?.value.trim() || "",

            email: getElement("customerEmail")?.value.trim() || "",

            phone: getElement("customerPhone")?.value.trim() || "",

            address: getElement("shippingAddress")?.value.trim() || "",

            city: getElement("shippingCity")?.value.trim() || "",

            province: getElement("shippingProvince")?.value.trim() || "",

            postalCode: getElement("postalCode")?.value.trim() || ""

        };

        const subtotal = cart.reduce((total, item) => {

            return total + item.price * item.quantity;

        }, 0);

        const order = {

            reference: "MM-" + Date.now().toString().slice(-10),

            date: new Date().toLocaleString("en-PH"),

            customer: customer,

            items: cart.map(item => ({

                name: item.name,

                price: item.price,

                quantity: item.quantity,

                image: item.image

            })),

            paymentMethod: paymentMethod.value,

            subtotal: subtotal,

            deliveryFee: DELIVERY_FEE,

            total: subtotal + DELIVERY_FEE

        };

        try {

            localStorage.setItem(
                ORDER_STORAGE_KEY,
                JSON.stringify(order)
            );

            const button = getElement("placeOrderButton");

            if (button) {

                button.disabled = true;

                button.textContent = "Processing Order...";

            }

            window.location.href = "OrderConfirmation.html";

        } catch (error) {

            console.error("Unable to process order:", error);

            alert("Unable to save your order. Please try again.");

            const button = getElement("placeOrderButton");

            if (button) {

                button.disabled = false;

                button.textContent = "Place Order";

            }

        }

    });

}

function getSavedOrder() {

    try {

        const order = JSON.parse(
            localStorage.getItem(ORDER_STORAGE_KEY) || "null"
        );

        if (

            !order ||

            typeof order.reference !== "string" ||

            !order.customer ||

            !Array.isArray(order.items)

        ) {

            return null;

        }

        return order;

    } catch (error) {

        console.error("Unable to retrieve saved order:", error);

        return null;

    }

}

function displayOrderConfirmation() {

    const order = getSavedOrder();

    if (!order) return;

    const customer = order.customer;

    const orderReference = getElement("orderReference");

    const orderDate = getElement("orderDate");

    const orderCustomer = getElement("orderCustomer");

    const orderEmail = getElement("orderEmail");

    const orderPayment = getElement("orderPayment");

    const orderItems = getElement("orderItems");

    const orderSubtotal = getElement("orderSubtotal");

    const orderDelivery = getElement("orderDelivery");

    const orderTotal = getElement("orderTotal");

    if (orderReference) {
        orderReference.textContent = order.reference;
    }

    if (orderDate) {
        orderDate.textContent = order.date || "";
    }

    if (orderCustomer) {
        orderCustomer.textContent = customer.fullName || "";
    }

    if (orderEmail) {
        orderEmail.textContent = customer.email || "";
    }

    if (orderPayment) {
        orderPayment.textContent = order.paymentMethod || "";
    }

    if (orderItems) {

        orderItems.innerHTML = order.items.map(item => `

            <div class="confirmation-product">

                <strong>
                    ${escapeHTML(item.name)}
                </strong>

                <span>
                    Quantity: ${Number(item.quantity) || 0}
                </span>

                <span>
                    ₱${formatPrice(
                        Number(item.price) * Number(item.quantity)
                    )}
                </span>

            </div>

        `).join("");

    }

    if (orderSubtotal) {
        orderSubtotal.textContent = formatPrice(order.subtotal);
    }

    if (orderDelivery) {
        orderDelivery.textContent = formatPrice(order.deliveryFee);
    }

    if (orderTotal) {
        orderTotal.textContent = formatPrice(order.total);
    }

}

function initializeMazdaMotion() {

    initializeNavigation();

    initializeCartButtons();

    initializeAddToCartButtons();

    initializeProductFilters();

    initializeCheckoutButton();

    initializeCheckoutForm();

    updateCartCounter();

    displayCart();

    displayCheckoutOrder();

    displayOrderConfirmation();

    console.log("MazdaMotion successfully initialized!");

}

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initializeMazdaMotion
    );

} else {

    initializeMazdaMotion();

}