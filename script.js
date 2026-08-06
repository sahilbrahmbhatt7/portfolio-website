"use strict";

/*=========================================
            PORTFOLIO SCRIPT
            Author : Sahil Brahmbhatt
            Version : 2.0.0 - Production Ready
=========================================*/

/*=========================================
        CONFIGURATION
=========================================*/

const CONFIG = {
    SCROLL_THRESHOLD: 80,
    MENU_BREAKPOINT: 992,
    CURSOR_TRAIL_LENGTH: 12,
    RIPPLE_DURATION: 600,
    COUNTER_DURATION: 2000,
    DEBOUNCE_DELAY: 200,
    THROTTLE_LIMIT: 100,
    MOBILE_BREAKPOINT: 768
};

/*=========================================
        DOM CACHE
=========================================*/

const DOM = {
    body: document.body,
    html: document.documentElement,
    
    // Navigation
    header: document.querySelector("header"),
    navbar: document.querySelector(".navbar"),
    navLinks: document.querySelectorAll(".nav-link"),
    navMenu: document.querySelector(".nav-menu"),
    menuBtn: document.querySelector(".menu-btn"),
    overlay: document.querySelector(".nav-overlay"),
    
    // Cursor
    cursor: document.querySelector(".cursor"),
    cursorDot: document.querySelector(".cursor-dot"),
    glow: null,
    trail: [],
    
    // Buttons
    buttons: document.querySelectorAll(".primary-btn, .secondary-btn, .resume-btn"),
    magneticBtns: document.querySelectorAll(".primary-btn, .secondary-btn, .resume-btn, .hire-btn"),
    
    // Sections
    sections: [...document.querySelectorAll("section")],
    hero: document.querySelector(".hero"),
    about: document.querySelector(".about"),
    skills: document.querySelector(".skills"),
    projects: document.querySelector(".projects"),
    education: document.querySelector(".education"),
    certificates: document.querySelector(".certificates"),
    achievements: document.querySelector(".achievements"),
    stats: document.querySelector(".stats"),
    contact: document.querySelector(".contact"),
    
    // Progress
    progressBar: document.querySelector(".scroll-progress"),
    scrollTopBtn: document.getElementById("scrollTop"),
    
    // Loader
    loader: document.querySelector(".loader"),
    
    // Typewriter
    typewriter: document.querySelector(".typing-text"),
    
    // Stats
    counters: document.querySelectorAll(".counter"),
    statBoxes: document.querySelectorAll(".stat-box"),
    
    // Cards
    allCards: document.querySelectorAll(
        ".service-card, .project-card, .highlight-card, .skill-category, .achievement-card, .certificate-card, .stat-box"
    ),
    timelineItems: document.querySelectorAll(".timeline-item"),
    timelineContent: document.querySelectorAll(".timeline-content"),
    timelineDots: document.querySelectorAll(".timeline-dot"),
    
    // Contact
    contactCards: document.querySelectorAll(".contact-card"),
    inputGroups: document.querySelectorAll(".input-group"),
    contactForm: document.querySelector(".contact-right"),
    
    // Social
    socialLinks: document.querySelectorAll(".social-links a"),
    heroSocial: document.querySelectorAll(".hero-social a"),
    
    // Featured
    featuredProject: document.querySelector(".featured-project"),
    featuredImage: document.querySelector(".featured-project .project-image"),
    projectCards: document.querySelectorAll(".project-card"),
    projectImages: document.querySelectorAll(".project-card img"),
    
    // Footer
    footer: document.querySelector("footer"),
    footerLinks: document.querySelectorAll(".footer-links a"),
    
    // Misc
    allImages: [...document.images],
    allButtons: document.querySelectorAll(".primary-btn, .secondary-btn, .resume-btn, .hire-btn, #theme-toggle"),
};

/*=========================================
        UTILITY FUNCTIONS
=========================================*/

const Utils = {
    clamp: (value, min, max) => Math.min(Math.max(value, min), max),
    
    lerp: (start, end, amount) => start + (end - start) * amount,
    
    random: (min, max) => Math.random() * (max - min) + min,
    
    map: (value, inMin, inMax, outMin, outMax) => 
        (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin,
    
    debounce: (callback, delay = CONFIG.DEBOUNCE_DELAY) => {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => callback(...args), delay);
        };
    },
    
    throttle: (callback, limit = CONFIG.THROTTLE_LIMIT) => {
        let waiting = false;
        return (...args) => {
            if (waiting) return;
            callback(...args);
            waiting = true;
            setTimeout(() => { waiting = false; }, limit);
        };
    },
    
    rafThrottle: (callback) => {
        let running = false;
        return (...args) => {
            if (running) return;
            running = true;
            requestAnimationFrame(() => {
                callback(...args);
                running = false;
            });
        };
    },
    
    isMobile: () => window.innerWidth < CONFIG.MOBILE_BREAKPOINT,
    
    isTablet: () => window.innerWidth < CONFIG.MENU_BREAKPOINT,
    
    getScrollPercent: () => {
        const scrollTop = window.scrollY;
        const height = document.documentElement.scrollHeight - window.innerHeight;
        return height > 0 ? (scrollTop / height) * 100 : 0;
    }
};

/*=========================================
        GSAP CONFIGURATION
=========================================*/

gsap.config({
    force3D: true,
    nullTargetWarn: false
});

gsap.registerPlugin(ScrollTrigger);

/*=========================================
        APP STATE
=========================================*/

const State = {
    scrollY: 0,
    lastScroll: 0,
    ticking: false,
    isMenuOpen: false,
    isDark: true,
    width: window.innerWidth,
    height: window.innerHeight,
    mouseX: window.innerWidth / 2,
    mouseY: window.innerHeight / 2,
    currentX: window.innerWidth / 2,
    currentY: window.innerHeight / 2,
    scrollTriggers: [],
    timelines: [],
    animations: [],
    intervals: [],
    timeouts: []
};

/*=========================================
        LOADER
=========================================*/

const Loader = {
    hide: () => {
        const loader = DOM.loader;
        if (!loader) return;
        
        gsap.to(loader, {
            opacity: 0,
            duration: 0.8,
            ease: "power2.out",
            onComplete: () => {
                loader.style.display = "none";
                ScrollTrigger.refresh();
            }
        });
    },
    
    preloadImages: () => {
        const images = DOM.allImages;
        if (images.length === 0) {
            Loader.hide();
            return;
        }
        
        let loaded = 0;
        const total = images.length;
        
        const checkComplete = () => {
            loaded++;
            if (loaded === total) {
                Loader.hide();
            }
        };
        
        images.forEach(img => {
            if (img.complete) {
                checkComplete();
            } else {
                img.onload = checkComplete;
                img.onerror = checkComplete;
            }
        });
        
        // Safety timeout
        State.timeouts.push(setTimeout(() => {
            if (loaded < total) {
                Loader.hide();
            }
        }, 3000));
    }
};

/*=========================================
        NAVIGATION
=========================================*/

const Navigation = {
    init: () => {
        Navigation.updateActive();
        Navigation.setupScrollListeners();
        Navigation.setupClickListeners();
    },
    
    updateActive: () => {
        let current = "";
        DOM.sections.forEach(section => {
            const top = section.offsetTop - 150;
            const height = section.offsetHeight;
            if (window.scrollY >= top && window.scrollY < top + height) {
                current = section.id;
            }
        });
        
        DOM.navLinks.forEach(link => {
            link.classList.remove("active");
            if (link.getAttribute("href") === "#" + current) {
                link.classList.add("active");
            }
        });
    },
    
    setupScrollListeners: () => {
        const handleScroll = Utils.rafThrottle(() => {
            Navigation.updateActive();
            Navigation.updateProgress();
            Navigation.handleStickyNav();
        });
        
        window.addEventListener("scroll", handleScroll, { passive: true });
    },
    
    setupClickListeners: () => {
        DOM.navLinks.forEach(link => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute("href"));
                if (target) {
                    window.scrollTo({
                        top: target.offsetTop - 80,
                        behavior: "smooth"
                    });
                }
                if (State.isMenuOpen) {
                    MobileMenu.close();
                }
            });
        });
    },
    
    handleStickyNav: () => {
        const scroll = window.scrollY;
        const navbar = DOM.navbar;
        if (!navbar) return;
        
        if (scroll > CONFIG.SCROLL_THRESHOLD) {
            navbar.classList.add("sticky");
        } else {
            navbar.classList.remove("sticky");
        }
        
        if (scroll > 20) {
            navbar.classList.add("nav-blur");
        } else {
            navbar.classList.remove("nav-blur");
        }
    },
    
    updateProgress: () => {
        const progress = DOM.progressBar;
        if (!progress) return;
        progress.style.width = Utils.getScrollPercent() + "%";
    }
};

/*=========================================
        MOBILE MENU
=========================================*/

const MobileMenu = {
    init: () => {
        if (!DOM.menuBtn || !DOM.navMenu) return;
        
        DOM.menuBtn.addEventListener("click", MobileMenu.toggle);
        document.addEventListener("click", MobileMenu.handleClickOutside);
        document.addEventListener("keydown", MobileMenu.handleKeydown);
        DOM.navLinks.forEach(link => {
            link.addEventListener("click", MobileMenu.close);
        });
        
        // GSAP entrance animation
        gsap.from(DOM.navbar, {
            y: -80,
            opacity: 0,
            duration: 1,
            ease: "power3.out"
        });
    },
    
    open: () => {
        if (State.isMenuOpen) return;
        
        DOM.navMenu.classList.add("active");
        DOM.menuBtn.classList.add("active");
        if (DOM.overlay) DOM.overlay.classList.add("active");
        DOM.body.style.overflow = "hidden";
        State.isMenuOpen = true;
        
        gsap.fromTo(
            ".nav-menu .nav-link",
            { x: 40, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power3.out" }
        );
    },
    
    close: () => {
        if (!State.isMenuOpen) return;
        
        DOM.navMenu.classList.remove("active");
        DOM.menuBtn.classList.remove("active");
        if (DOM.overlay) DOM.overlay.classList.remove("active");
        DOM.body.style.overflow = "";
        State.isMenuOpen = false;
    },
    
    toggle: () => {
        State.isMenuOpen ? MobileMenu.close() : MobileMenu.open();
    },
    
    handleClickOutside: (e) => {
        if (!State.isMenuOpen) return;
        if (!DOM.navMenu || !DOM.menuBtn) return;
        
        const insideMenu = DOM.navMenu.contains(e.target);
        const onButton = DOM.menuBtn.contains(e.target);
        
        if (!insideMenu && !onButton) {
            MobileMenu.close();
        }
    },
    
    handleKeydown: (e) => {
        if (e.key === "Escape" && State.isMenuOpen) {
            MobileMenu.close();
        }
    }
};

/*=========================================
        CUSTOM CURSOR
=========================================*/

const CustomCursor = {
    init: () => {
        if (!DOM.cursor || !DOM.cursorDot || Utils.isMobile()) {
            CustomCursor.hide();
            return;
        }
        
        DOM.cursor.style.display = "";
        DOM.cursorDot.style.display = "";
        
        document.addEventListener("mousemove", CustomCursor.handleMove);
        
        // Hover effects
        DOM.allButtons.forEach(el => {
            el.addEventListener("mouseenter", CustomCursor.hoverIn);
            el.addEventListener("mouseleave", CustomCursor.hoverOut);
        });
        
        document.addEventListener("mousedown", CustomCursor.clickDown);
        document.addEventListener("mouseup", CustomCursor.clickUp);
        
        // Start animation loop
        CustomCursor.animate();
        
        // Handle resize
        window.addEventListener("resize", Utils.debounce(() => {
            if (Utils.isMobile()) {
                CustomCursor.hide();
            } else {
                CustomCursor.show();
            }
        }, 200));
    },
    
    handleMove: (e) => {
        State.mouseX = e.clientX;
        State.mouseY = e.clientY;
        gsap.set(DOM.cursorDot, { x: State.mouseX, y: State.mouseY });
    },
    
    animate: () => {
        State.currentX += (State.mouseX - State.currentX) * 0.15;
        State.currentY += (State.mouseY - State.currentY) * 0.15;
        
        gsap.set(DOM.cursor, {
            x: State.currentX,
            y: State.currentY
        });
        
        requestAnimationFrame(CustomCursor.animate);
    },
    
    hoverIn: () => {
        gsap.to(DOM.cursor, { scale: 2, duration: 0.25, ease: "power2.out" });
        gsap.to(DOM.cursorDot, { scale: 0.5, duration: 0.25 });
    },
    
    hoverOut: () => {
        gsap.to(DOM.cursor, { scale: 1, duration: 0.25 });
        gsap.to(DOM.cursorDot, { scale: 1, duration: 0.25 });
    },
    
    clickDown: () => {
        gsap.to(DOM.cursor, { scale: 0.8, duration: 0.12 });
    },
    
    clickUp: () => {
        gsap.to(DOM.cursor, { scale: 1, duration: 0.18 });
    },
    
    hide: () => {
        if (DOM.cursor) DOM.cursor.style.display = "none";
        if (DOM.cursorDot) DOM.cursorDot.style.display = "none";
    },
    
    show: () => {
        if (DOM.cursor) DOM.cursor.style.display = "";
        if (DOM.cursorDot) DOM.cursorDot.style.display = "";
    }
};

/*=========================================
        MOUSE GLOW & TRAIL
=========================================*/

const MouseEffects = {
    init: () => {
        if (Utils.isMobile()) return;
        
        MouseEffects.createGlow();
        MouseEffects.createTrail();
        MouseEffects.setupListeners();
    },
    
    createGlow: () => {
        DOM.glow = document.createElement("div");
        DOM.glow.className = "mouse-glow";
        document.body.appendChild(DOM.glow);
        
        document.addEventListener("mousemove", (e) => {
            gsap.to(DOM.glow, {
                x: e.clientX,
                y: e.clientY,
                duration: 0.35,
                ease: "power2.out"
            });
        });
    },
    
    createTrail: () => {
        for (let i = 0; i < CONFIG.CURSOR_TRAIL_LENGTH; i++) {
            const dot = document.createElement("div");
            dot.className = "trail-dot";
            document.body.appendChild(dot);
            DOM.trail.push({ x: 0, y: 0, node: dot });
        }
        
        document.addEventListener("mousemove", (e) => {
            DOM.trail[0].x = e.clientX;
            DOM.trail[0].y = e.clientY;
        });
        
        MouseEffects.animateTrail();
    },
    
    animateTrail: () => {
        for (let i = 1; i < DOM.trail.length; i++) {
            DOM.trail[i].x += (DOM.trail[i - 1].x - DOM.trail[i].x) * 0.35;
            DOM.trail[i].y += (DOM.trail[i - 1].y - DOM.trail[i].y) * 0.35;
        }
        
        DOM.trail.forEach((item, index) => {
            gsap.set(item.node, {
                x: item.x,
                y: item.y,
                scale: 1 - index * 0.05,
                opacity: 1 - index * 0.08
            });
        });
        
        requestAnimationFrame(MouseEffects.animateTrail);
    },
    
    setupListeners: () => {
        window.addEventListener("resize", Utils.debounce(() => {
            const isMobile = Utils.isMobile();
            if (DOM.glow) DOM.glow.style.display = isMobile ? "none" : "block";
            DOM.trail.forEach(item => {
                item.node.style.display = isMobile ? "none" : "block";
            });
        }, 200));
    }
};

/*=========================================
        BUTTON EFFECTS
=========================================*/

const ButtonEffects = {
    init: () => {
        ButtonEffects.setupMagnetic();
        ButtonEffects.setupRipple();
        ButtonEffects.setupPress();
        ButtonEffects.setupHover();
    },
    
    setupMagnetic: () => {
        DOM.magneticBtns.forEach(btn => {
            btn.addEventListener("mousemove", (e) => {
                if (Utils.isMobile()) return;
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                gsap.to(btn, {
                    x: x * 0.25,
                    y: y * 0.25,
                    duration: 0.35,
                    ease: "power2.out"
                });
            });
            
            btn.addEventListener("mouseleave", () => {
                gsap.to(btn, {
                    x: 0,
                    y: 0,
                    duration: 0.45,
                    ease: "elastic.out(1, 0.4)"
                });
            });
        });
    },
    
    setupRipple: () => {
        DOM.allButtons.forEach(btn => {
            btn.addEventListener("click", function(e) {
                const circle = document.createElement("span");
                const diameter = Math.max(this.clientWidth, this.clientHeight);
                circle.style.width = diameter + "px";
                circle.style.height = diameter + "px";
                circle.style.left = e.offsetX - diameter / 2 + "px";
                circle.style.top = e.offsetY - diameter / 2 + "px";
                circle.classList.add("ripple");
                
                const existing = this.querySelector(".ripple");
                if (existing) existing.remove();
                this.appendChild(circle);
                
                setTimeout(() => circle.remove(), CONFIG.RIPPLE_DURATION);
            });
        });
    },
    
    setupPress: () => {
        DOM.allButtons.forEach(btn => {
            btn.addEventListener("mousedown", () => {
                gsap.to(btn, { scale: 0.96, duration: 0.08 });
            });
            
            btn.addEventListener("mouseup", () => {
                gsap.to(btn, { scale: 1, duration: 0.2, ease: "power2.out" });
            });
            
            btn.addEventListener("mouseleave", () => {
                gsap.to(btn, { scale: 1, duration: 0.2 });
            });
        });
    },
    
    setupHover: () => {
        DOM.allButtons.forEach(btn => {
            btn.addEventListener("mouseenter", () => {
                gsap.to(btn, { scale: 1.05, y: -4, duration: 0.25, ease: "power2.out" });
            });
            
            btn.addEventListener("mouseleave", () => {
                gsap.to(btn, { scale: 1, y: 0, duration: 0.25 });
            });
        });
    }
};

/*=========================================
        TYPEWRITER EFFECT
=========================================*/

const Typewriter = {
    roles: [
        "Software Engineer",
        "Full Stack Developer",
        "MERN Stack Developer",
        "Java Developer",
        "Problem Solver"
    ],
    roleIndex: 0,
    charIndex: 0,
    deleting: false,
    timer: null,
    
    init: () => {
        const element = DOM.typewriter;
        if (!element) return;
        
        Typewriter.element = element;
        Typewriter.typeEffect();
    },
    
    typeEffect: () => {
        const current = Typewriter.roles[Typewriter.roleIndex];
        const element = Typewriter.element;
        
        if (!Typewriter.deleting) {
            element.textContent = current.substring(0, Typewriter.charIndex + 1);
            Typewriter.charIndex++;
            
            if (Typewriter.charIndex === current.length) {
                Typewriter.deleting = true;
                Typewriter.timer = setTimeout(Typewriter.typeEffect, 1800);
                return;
            }
        } else {
            element.textContent = current.substring(0, Typewriter.charIndex - 1);
            Typewriter.charIndex--;
            
            if (Typewriter.charIndex === 0) {
                Typewriter.deleting = false;
                Typewriter.roleIndex = (Typewriter.roleIndex + 1) % Typewriter.roles.length;
            }
        }
        
        const delay = Typewriter.deleting ? 45 : 90;
        Typewriter.timer = setTimeout(Typewriter.typeEffect, delay);
    },
    
    destroy: () => {
        if (Typewriter.timer) {
            clearTimeout(Typewriter.timer);
            Typewriter.timer = null;
        }
    }
};

/*=========================================
        HERO SECTION
=========================================*/

const Hero = {
    init: () => {
        Hero.setupTimeline();
        Hero.setupParallax();
        Hero.setupFloating();
        Hero.setupMouseParallax();
        Hero.setupBadgePulse();
    },
    
    setupTimeline: () => {
        const tl = gsap.timeline({
            defaults: { ease: "power4.out", duration: 1 }
        });
        
        tl.from(".hero-badge", { y: 40, opacity: 0 })
            .from(".hero-title", { y: 70, opacity: 0, duration: 1.2 }, "-=0.6")
            .from(".hero-subtitle", { y: 50, opacity: 0 }, "-=0.8")
            .from(".hero-description", { y: 40, opacity: 0 }, "-=0.7")
            .from(".hero-buttons .primary-btn", { x: -40, opacity: 0, duration: 0.8 }, "-=0.6")
            .from(".hero-buttons .secondary-btn", { x: 40, opacity: 0, duration: 0.8 }, "-=0.7")
            .from(".social-links a", { y: 25, opacity: 0, stagger: 0.08, duration: 0.5 }, "-=0.6")
            .from(".photo-card", { scale: 0.8, opacity: 0, rotate: 5, duration: 1.2 }, "-=1.2")
            .from(".floating-ribbon", { y: -20, opacity: 0, duration: 0.7 }, "-=0.7")
            .from(".scroll-indicator", { opacity: 0, y: 25 }, "-=0.5");
        
        State.timelines.push(tl);
    },
    
    setupParallax: () => {
        gsap.to(".hero-content", {
            yPercent: 20,
            ease: "none",
            scrollTrigger: {
                trigger: ".hero",
                start: "top top",
                end: "bottom top",
                scrub: 1
            }
        });
        
        gsap.to(".photo-card", {
            scale: 1.08,
            ease: "none",
            scrollTrigger: {
                trigger: ".hero",
                start: "top top",
                end: "bottom top",
                scrub: 1
            }
        });
    },
    
    setupFloating: () => {
        gsap.to(".photo-card", {
            y: -15,
            duration: 3,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true
        });
        
        gsap.to(".scroll-indicator", {
            y: 15,
            repeat: -1,
            yoyo: true,
            duration: 1,
            ease: "power1.inOut"
        });
    },
    
    setupMouseParallax: () => {
        const hero = DOM.hero;
        if (!hero || Utils.isMobile()) return;
        
        hero.addEventListener("mousemove", (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 20;
            const y = (e.clientY / window.innerHeight - 0.5) * 20;
            gsap.to(".photo-card", {
                x,
                y,
                rotateY: x,
                rotateX: -y,
                duration: 0.6,
                ease: "power2.out"
            });
        });
        
        hero.addEventListener("mouseleave", () => {
            gsap.to(".photo-card", {
                x: 0,
                y: 0,
                rotateX: 0,
                rotateY: 0,
                duration: 0.8
            });
        });
    },
    
    setupBadgePulse: () => {
        gsap.to(".hero-badge", {
            scale: 1.05,
            repeat: -1,
            yoyo: true,
            duration: 1.5,
            ease: "sine.inOut"
        });
    }
};

/*=========================================
        ABOUT SECTION
=========================================*/

const About = {
    init: () => {
        About.setupTimeline();
        About.setupParallax();
        About.setupCardHover();
        About.setupCounters();
        About.setup3DCards();
        About.setupFloatingShapes();
    },
    
    setupTimeline: () => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: ".about",
                start: "top 75%",
                end: "bottom 20%",
                toggleActions: "play none none reverse"
            }
        });
        
        tl.from(".about-badge", { y: 40, opacity: 0, duration: 0.7, ease: "power3.out" })
            .from(".about-title", { y: 60, opacity: 0, duration: 0.8 }, "-=0.45")
            .from(".about-description", { y: 40, opacity: 0, duration: 0.8, stagger: 0.15 }, "-=0.4")
            .from(".about-image", { x: -70, opacity: 0, scale: 0.92, duration: 1 }, "-=0.7")
            .from(".about-card", { y: 50, opacity: 0, stagger: 0.15, duration: 0.7 }, "-=0.55");
        
        State.timelines.push(tl);
    },
    
    setupParallax: () => {
        gsap.to(".about-image", {
            yPercent: -18,
            ease: "none",
            scrollTrigger: {
                trigger: ".about",
                start: "top bottom",
                end: "bottom top",
                scrub: 1
            }
        });
    },
    
    setupCardHover: () => {
        document.querySelectorAll(".about-card").forEach(card => {
            card.addEventListener("mouseenter", () => {
                gsap.to(card, { y: -12, scale: 1.03, duration: 0.3, ease: "power2.out" });
            });
            card.addEventListener("mouseleave", () => {
                gsap.to(card, { y: 0, scale: 1, duration: 0.3 });
            });
        });
    },
    
    setupCounters: () => {
        document.querySelectorAll(".about-count").forEach(counter => {
            const target = +counter.dataset.count;
            gsap.fromTo(counter,
                { innerText: 0 },
                {
                    innerText: target,
                    duration: 2,
                    ease: "power2.out",
                    snap: { innerText: 1 },
                    scrollTrigger: {
                        trigger: counter,
                        start: "top 85%"
                    },
                    onUpdate: function() {
                        counter.innerText = Math.floor(counter.innerText);
                    }
                }
            );
        });
    },
    
    setup3DCards: () => {
        if (Utils.isMobile()) return;
        
        document.querySelectorAll(".about-card").forEach(card => {
            card.addEventListener("mousemove", (e) => {
                const rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width;
                const y = (e.clientY - rect.top) / rect.height;
                
                gsap.to(card, {
                    rotateY: (x - 0.5) * 10,
                    rotateX: (0.5 - y) * 10,
                    transformPerspective: 1000,
                    duration: 0.3,
                    ease: "power2.out"
                });
            });
            
            card.addEventListener("mouseleave", () => {
                gsap.to(card, {
                    rotateX: 0,
                    rotateY: 0,
                    duration: 0.5,
                    ease: "power2.out"
                });
            });
        });
    },
    
    setupFloatingShapes: () => {
        document.querySelectorAll(".about-shape").forEach((shape, index) => {
            gsap.to(shape, {
                y: Utils.random(-30, 30),
                x: Utils.random(-20, 20),
                rotation: Utils.random(-15, 15),
                duration: Utils.random(4, 8),
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                delay: index * 0.3
            });
        });
    }
};

/*=========================================
        SKILLS SECTION
=========================================*/

const Skills = {
    init: () => {
        Skills.setupTimeline();
        Skills.setupProgressBars();
        Skills.setupCardHover();
        Skills.setup3DCards();
        Skills.setupFloatingIcons();
        Skills.setupPercentageCounters();
    },
    
    setupTimeline: () => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: ".skills",
                start: "top 75%",
                end: "bottom 20%",
                toggleActions: "play none none reverse"
            }
        });
        
        tl.from(".skills-badge", { y: 40, opacity: 0, duration: 0.7 })
            .from(".skills-title", { y: 60, opacity: 0, duration: 0.8 }, "-=0.4")
            .from(".skills-description", { y: 40, opacity: 0, duration: 0.8 }, "-=0.5")
            .from(".skill-category", {
                y: 70,
                opacity: 0,
                stagger: 0.15,
                duration: 0.8,
                ease: "power3.out"
            }, "-=0.4");
        
        State.timelines.push(tl);
    },
    
    setupProgressBars: () => {
        document.querySelectorAll(".skill-progress-fill").forEach(bar => {
            const width = bar.dataset.width;
            gsap.fromTo(bar,
                { width: "0%" },
                {
                    width: width + "%",
                    duration: 1.6,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: bar,
                        start: "top 90%"
                    }
                }
            );
        });
    },
    
    setupCardHover: () => {
        document.querySelectorAll(".skill-category").forEach(card => {
            card.addEventListener("mouseenter", () => {
                gsap.to(card, { y: -12, scale: 1.03, duration: 0.3, ease: "power2.out" });
            });
            card.addEventListener("mouseleave", () => {
                gsap.to(card, { y: 0, scale: 1, duration: 0.3 });
            });
        });
    },
    
    setup3DCards: () => {
        if (Utils.isMobile()) return;
        
        document.querySelectorAll(".skill-category").forEach(card => {
            card.addEventListener("mousemove", (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const rotateY = ((x / rect.width) - 0.5) * 18;
                const rotateX = ((rect.height / 2 - y) / rect.height) * 18;
                
                gsap.to(card, {
                    rotateX,
                    rotateY,
                    transformPerspective: 1000,
                    duration: 0.35,
                    ease: "power2.out"
                });
            });
            
            card.addEventListener("mouseleave", () => {
                gsap.to(card, {
                    rotateX: 0,
                    rotateY: 0,
                    duration: 0.5,
                    ease: "power3.out"
                });
            });
        });
    },
    
    setupFloatingIcons: () => {
        document.querySelectorAll(".skill-icon").forEach(icon => {
            gsap.to(icon, {
                y: Utils.random(-8, 8),
                duration: Utils.random(2, 4),
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
            
            icon.addEventListener("mouseenter", () => {
                gsap.to(icon, {
                    rotation: 360,
                    scale: 1.18,
                    duration: 0.6,
                    ease: "back.out(1.7)"
                });
            });
            
            icon.addEventListener("mouseleave", () => {
                gsap.to(icon, {
                    rotation: 0,
                    scale: 1,
                    duration: 0.35
                });
            });
        });
    },
    
    setupPercentageCounters: () => {
        document.querySelectorAll(".skill-percent").forEach(counter => {
            const target = parseInt(counter.dataset.percent);
            gsap.fromTo(counter,
                { innerText: 0 },
                {
                    innerText: target,
                    duration: 2,
                    snap: { innerText: 1 },
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: counter,
                        start: "top 90%"
                    },
                    onUpdate() {
                        counter.innerText = Math.floor(counter.innerText) + "%";
                    }
                }
            );
        });
    }
};

/*=========================================
        PROJECTS SECTION
=========================================*/

const Projects = {
    init: () => {
        Projects.setupTimeline();
        Projects.setupFeatured();
        Projects.setupGrid();
        Projects.setupCardHover();
        Projects.setup3DCards();
        Projects.setupImageParallax();
        Projects.setupTechTags();
        Projects.setupFloating();
    },
    
    setupTimeline: () => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: ".projects",
                start: "top 75%",
                toggleActions: "play none none reverse"
            }
        });
        
        tl.from(".section-badge", { opacity: 0, y: 40, duration: 0.7 })
            .from(".section-title", { opacity: 0, y: 60, duration: 0.8 }, "-=0.4")
            .from(".section-description", { opacity: 0, y: 40, duration: 0.7 }, "-=0.4")
            .from(".featured-project", {
                opacity: 0,
                y: 80,
                scale: 0.96,
                duration: 1,
                ease: "power3.out"
            }, "-=0.2");
        
        State.timelines.push(tl);
    },
    
    setupFeatured: () => {
        // Featured image reveal
        gsap.from(".featured-project .project-image", {
            x: -80,
            opacity: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
                trigger: ".featured-project",
                start: "top 75%"
            }
        });
        
        // Featured content reveal
        gsap.from(".featured-project .project-content > *", {
            opacity: 0,
            y: 25,
            stagger: 0.12,
            duration: 0.7,
            ease: "power2.out",
            scrollTrigger: {
                trigger: ".featured-project",
                start: "top 75%"
            }
        });
        
        // Featured image float
        gsap.to(".featured-project .project-image", {
            y: 12,
            duration: 3,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });
    },
    
    setupGrid: () => {
        // Grid cards reveal
        gsap.from(".project-card", {
            opacity: 0,
            y: 70,
            stagger: 0.18,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
                trigger: ".projects-grid",
                start: "top 80%"
            }
        });
        
        // Mini tech tags
        gsap.from(".mini-tech span", {
            opacity: 0,
            scale: 0.6,
            y: 15,
            stagger: 0.06,
            duration: 0.45,
            ease: "back.out(1.7)",
            scrollTrigger: {
                trigger: ".projects-grid",
                start: "top 85%"
            }
        });
    },
    
    setupCardHover: () => {
        DOM.projectCards.forEach(card => {
            card.addEventListener("mouseenter", () => {
                gsap.to(card, {
                    y: -15,
                    scale: 1.02,
                    boxShadow: "0 25px 60px rgba(139,92,246,.18)",
                    duration: 0.35,
                    ease: "power2.out"
                });
            });
            
            card.addEventListener("mouseleave", () => {
                gsap.to(card, {
                    y: 0,
                    scale: 1,
                    boxShadow: "0 0 0 rgba(0,0,0,0)",
                    duration: 0.35
                });
            });
        });
    },
    
    setup3DCards: () => {
        if (Utils.isMobile()) return;
        
        DOM.projectCards.forEach(card => {
            card.addEventListener("mousemove", (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const rotateY = ((x / rect.width) - 0.5) * 16;
                const rotateX = ((rect.height / 2 - y) / rect.height) * 16;
                
                gsap.to(card, {
                    rotateX,
                    rotateY,
                    transformPerspective: 1000,
                    transformOrigin: "center",
                    duration: 0.35,
                    ease: "power2.out"
                });
            });
            
            card.addEventListener("mouseleave", () => {
                gsap.to(card, {
                    rotateX: 0,
                    rotateY: 0,
                    duration: 0.5,
                    ease: "power3.out"
                });
            });
        });
    },
    
    setupImageParallax: () => {
        DOM.projectCards.forEach(card => {
            const image = card.querySelector("img");
            if (!image) return;
            
            card.addEventListener("mousemove", (e) => {
                const rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                
                gsap.to(image, {
                    x: x * 18,
                    y: y * 18,
                    scale: 1.08,
                    duration: 0.35
                });
            });
            
            card.addEventListener("mouseleave", () => {
                gsap.to(image, {
                    x: 0,
                    y: 0,
                    scale: 1,
                    duration: 0.45
                });
            });
        });
    },
    
    setupTechTags: () => {
        document.querySelectorAll(".project-tech span, .mini-tech span").forEach(tag => {
            tag.addEventListener("mouseenter", () => {
                gsap.to(tag, { y: -5, scale: 1.08, duration: 0.25 });
            });
            tag.addEventListener("mouseleave", () => {
                gsap.to(tag, { y: 0, scale: 1, duration: 0.25 });
            });
        });
    },
    
    setupFloating: () => {
        DOM.projectCards.forEach((card, index) => {
            gsap.to(card, {
                y: index % 2 === 0 ? 8 : -8,
                duration: 4 + index,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
        });
    }
};

/*=========================================
        EDUCATION SECTION
=========================================*/

const Education = {
    init: () => {
        Education.setupTimeline();
        Education.setupItems();
        Education.setupDots();
        Education.setupCardHover();
        Education.setup3DCards();
    },
    
    setupTimeline: () => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: ".education",
                start: "top 75%",
                toggleActions: "play none none reverse"
            }
        });
        
        tl.from(".education .section-header span", { opacity: 0, y: 30, duration: 0.6 })
            .from(".education .section-header h2", { opacity: 0, y: 40, duration: 0.7 }, "-=0.3")
            .from(".education .section-header p", { opacity: 0, y: 30, duration: 0.7 }, "-=0.3")
            .from(".timeline", { opacity: 0, y: 50, duration: 0.8 }, "-=0.2");
        
        State.timelines.push(tl);
    },
    
    setupItems: () => {
        DOM.timelineItems.forEach((item, index) => {
            gsap.from(item, {
                opacity: 0,
                y: 70,
                duration: 0.8,
                delay: index * 0.15,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: item,
                    start: "top 85%"
                }
            });
        });
    },
    
    setupDots: () => {
        DOM.timelineDots.forEach(dot => {
            gsap.from(dot, {
                scale: 0,
                rotation: 180,
                duration: 0.7,
                ease: "back.out(2)",
                scrollTrigger: {
                    trigger: dot,
                    start: "top 90%"
                }
            });
        });
        
        // Dot pulse
        gsap.to(".timeline-dot", {
            scale: 1.15,
            repeat: -1,
            yoyo: true,
            duration: 1.2,
            ease: "sine.inOut",
            stagger: 0.15
        });
    },
    
    setupCardHover: () => {
        DOM.timelineContent.forEach(card => {
            card.addEventListener("mouseenter", () => {
                gsap.to(card, {
                    y: -10,
                    boxShadow: "0 20px 55px rgba(139,92,246,.20)",
                    duration: 0.35
                });
            });
            
            card.addEventListener("mouseleave", () => {
                gsap.to(card, {
                    y: 0,
                    boxShadow: "0 0 0 rgba(0,0,0,0)",
                    duration: 0.35
                });
            });
        });
    },
    
    setup3DCards: () => {
        if (Utils.isMobile()) return;
        
        DOM.timelineContent.forEach(card => {
            card.addEventListener("mousemove", (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const rotateY = ((x / rect.width) - 0.5) * 10;
                const rotateX = ((rect.height / 2 - y) / rect.height) * 10;
                
                gsap.to(card, {
                    rotateY,
                    rotateX,
                    transformPerspective: 900,
                    duration: 0.3,
                    ease: "power2.out"
                });
            });
            
            card.addEventListener("mouseleave", () => {
                gsap.to(card, {
                    rotateX: 0,
                    rotateY: 0,
                    duration: 0.45,
                    ease: "power2.out"
                });
            });
        });
    }
};

/*=========================================
        CERTIFICATES & ACHIEVEMENTS
=========================================*/

const Certificates = {
    init: () => {
        Certificates.setupCards();
        Certificates.setupHover();
        Certificates.setup3DCards();
        Certificates.setupShineEffect();
        Certificates.setupFloating();
    },
    
    setupCards: () => {
        gsap.from(".certificate-card", {
            opacity: 0,
            y: 70,
            scale: 0.9,
            stagger: 0.18,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
                trigger: ".certificate-grid",
                start: "top 80%"
            }
        });
        
        gsap.from(".achievement-card", {
            opacity: 0,
            y: 70,
            scale: 0.9,
            stagger: 0.18,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
                trigger: ".achievement-grid",
                start: "top 80%"
            }
        });
    },
    
    setupHover: () => {
        document.querySelectorAll(".certificate-card, .achievement-card").forEach(card => {
            card.addEventListener("mouseenter", () => {
                gsap.to(card, {
                    y: -12,
                    scale: 1.03,
                    boxShadow: "0 25px 60px rgba(139,92,246,.18)",
                    duration: 0.35,
                    ease: "power2.out"
                });
            });
            
            card.addEventListener("mouseleave", () => {
                gsap.to(card, {
                    y: 0,
                    scale: 1,
                    boxShadow: "0 0 0 rgba(0,0,0,0)",
                    duration: 0.35
                });
            });
        });
    },
    
    setup3DCards: () => {
        if (Utils.isMobile()) return;
        
        document.querySelectorAll(".certificate-card, .achievement-card").forEach(card => {
            card.addEventListener("mousemove", (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const rotateY = ((x / rect.width) - 0.5) * 16;
                const rotateX = ((rect.height / 2 - y) / rect.height) * 16;
                
                gsap.to(card, {
                    rotateY,
                    rotateX,
                    transformPerspective: 1000,
                    duration: 0.35,
                    ease: "power2.out"
                });
            });
            
            card.addEventListener("mouseleave", () => {
                gsap.to(card, {
                    rotateX: 0,
                    rotateY: 0,
                    duration: 0.45,
                    ease: "power3.out"
                });
            });
        });
    },
    
    setupShineEffect: () => {
        document.querySelectorAll(".certificate-card, .achievement-card").forEach(card => {
            card.addEventListener("mouseenter", () => {
                const shine = document.createElement("span");
                shine.className = "card-shine";
                card.appendChild(shine);
                
                gsap.fromTo(
                    shine,
                    { x: "-120%", opacity: 0.8 },
                    {
                        x: "220%",
                        opacity: 0,
                        duration: 0.8,
                        ease: "power2.out",
                        onComplete: () => shine.remove()
                    }
                );
            });
        });
    },
    
    setupFloating: () => {
        document.querySelectorAll(".certificate-card, .achievement-card").forEach((card, index) => {
            gsap.to(card, {
                y: index % 2 === 0 ? 8 : -8,
                duration: 4 + index,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
        });
    }
};

/*=========================================
        STATS SECTION
=========================================*/

const Stats = {
    init: () => {
        Stats.setupReveal();
        Stats.setupCounters();
        Stats.setupHover();
        Stats.setup3D();
        Stats.setupFloating();
    },
    
    setupReveal: () => {
        gsap.from(".stat-box", {
            opacity: 0,
            y: 70,
            scale: 0.9,
            stagger: 0.15,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
                trigger: ".stats-grid",
                start: "top 80%"
            }
        });
    },
    
    setupCounters: () => {
        DOM.counters.forEach(counter => {
            const text = counter.textContent.trim();
            const value = parseInt(text.replace(/\D/g, ""));
            const suffix = text.replace(/[0-9]/g, "");
            
            gsap.fromTo(counter,
                { innerText: 0 },
                {
                    innerText: value,
                    duration: CONFIG.COUNTER_DURATION / 1000,
                    snap: { innerText: 1 },
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: counter,
                        start: "top 90%"
                    },
                    onUpdate() {
                        counter.innerHTML = Math.floor(counter.innerText) + suffix;
                    }
                }
            );
        });
    },
    
    setupHover: () => {
        DOM.statBoxes.forEach(box => {
            box.addEventListener("mouseenter", () => {
                gsap.to(box, {
                    y: -12,
                    scale: 1.05,
                    boxShadow: "0 25px 60px rgba(139,92,246,.22)",
                    duration: 0.35,
                    ease: "power2.out"
                });
            });
            
            box.addEventListener("mouseleave", () => {
                gsap.to(box, {
                    y: 0,
                    scale: 1,
                    boxShadow: "0 0 0 rgba(0,0,0,0)",
                    duration: 0.35
                });
            });
        });
    },
    
    setup3D: () => {
        if (Utils.isMobile()) return;
        
        DOM.statBoxes.forEach(box => {
            box.addEventListener("mousemove", (e) => {
                const rect = box.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                gsap.to(box, {
                    rotateY: ((x / rect.width) - 0.5) * 12,
                    rotateX: ((rect.height / 2 - y) / rect.height) * 12,
                    transformPerspective: 900,
                    duration: 0.3,
                    ease: "power2.out"
                });
            });
            
            box.addEventListener("mouseleave", () => {
                gsap.to(box, {
                    rotateX: 0,
                    rotateY: 0,
                    duration: 0.45
                });
            });
        });
    },
    
    setupFloating: () => {
        DOM.statBoxes.forEach((box, index) => {
            gsap.to(box, {
                y: index % 2 === 0 ? 8 : -8,
                duration: 4 + index,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
        });
    }
};

/*=========================================
        CONTACT SECTION
=========================================*/

const Contact = {
    init: () => {
        Contact.setupReveal();
        Contact.setupCards();
        Contact.setupForm();
        Contact.setupInputFocus();
        Contact.setupSocialHover();
        Contact.setup3DForm();
    },
    
    setupReveal: () => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: ".contact",
                start: "top 75%",
                toggleActions: "play none none reverse"
            }
        });
        
        tl.from(".contact .section-header > *", {
            opacity: 0,
            y: 40,
            stagger: 0.15,
            duration: 0.7,
            ease: "power3.out"
        })
        .from(".contact-left", {
            opacity: 0,
            x: -80,
            duration: 0.9,
            ease: "power3.out"
        }, "-=0.3")
        .from(".contact-right", {
            opacity: 0,
            x: 80,
            duration: 0.9,
            ease: "power3.out"
        }, "-=0.7");
        
        State.timelines.push(tl);
    },
    
    setupCards: () => {
        DOM.contactCards.forEach((card, index) => {
            gsap.from(card, {
                opacity: 0,
                x: -40,
                duration: 0.6,
                delay: index * 0.1,
                scrollTrigger: {
                    trigger: card,
                    start: "top 90%"
                }
            });
        });
        
        // Floating contact card
        gsap.to(".contact-left", {
            y: 10,
            repeat: -1,
            yoyo: true,
            duration: 4,
            ease: "sine.inOut"
        });
    },
    
    setupForm: () => {
        DOM.inputGroups.forEach((group, index) => {
            gsap.from(group, {
                opacity: 0,
                y: 30,
                duration: 0.6,
                delay: index * 0.08,
                scrollTrigger: {
                    trigger: group,
                    start: "top 90%"
                }
            });
        });
    },
    
    setupInputFocus: () => {
        document.querySelectorAll(".input-group input, .input-group textarea").forEach(input => {
            input.addEventListener("focus", () => {
                gsap.to(input, {
                    scale: 1.02,
                    duration: 0.25,
                    borderColor: "#8b5cf6"
                });
            });
            
            input.addEventListener("blur", () => {
                gsap.to(input, {
                    scale: 1,
                    duration: 0.25,
                    borderColor: ""
                });
            });
        });
    },
    
    setupSocialHover: () => {
        DOM.socialLinks.forEach(icon => {
            icon.addEventListener("mouseenter", () => {
                gsap.to(icon, {
                    y: -8,
                    rotation: 8,
                    scale: 1.15,
                    duration: 0.3
                });
            });
            
            icon.addEventListener("mouseleave", () => {
                gsap.to(icon, {
                    y: 0,
                    rotation: 0,
                    scale: 1,
                    duration: 0.3
                });
            });
        });
    },
    
    setup3DForm: () => {
        const form = DOM.contactForm;
        if (!form || Utils.isMobile()) return;
        
        form.addEventListener("mousemove", (e) => {
            const rect = form.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            gsap.to(form, {
                rotateY: ((x / rect.width) - 0.5) * 8,
                rotateX: ((rect.height / 2 - y) / rect.height) * 8,
                transformPerspective: 1000,
                duration: 0.3
            });
        });
        
        form.addEventListener("mouseleave", () => {
            gsap.to(form, {
                rotateX: 0,
                rotateY: 0,
                duration: 0.4
            });
        });
    }
};

/*=========================================
        FOOTER
=========================================*/

const Footer = {
    init: () => {
        Footer.setupReveal();
        Footer.setupSocialHover();
    },
    
    setupReveal: () => {
        const footer = DOM.footer;
        if (!footer) return;
        
        gsap.from("footer > *", {
            opacity: 0,
            y: 40,
            stagger: 0.12,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
                trigger: "footer",
                start: "top 90%"
            }
        });
    },
    
    setupSocialHover: () => {
        document.querySelectorAll("footer .social-links a").forEach(icon => {
            icon.addEventListener("mouseenter", () => {
                gsap.to(icon, {
                    y: -6,
                    rotation: 8,
                    scale: 1.15,
                    duration: 0.3
                });
            });
            
            icon.addEventListener("mouseleave", () => {
                gsap.to(icon, {
                    y: 0,
                    rotation: 0,
                    scale: 1,
                    duration: 0.3
                });
            });
        });
    }
};

/*=========================================
        SCROLL TO TOP
=========================================*/

const ScrollTop = {
    init: () => {
        const btn = DOM.scrollTopBtn;
        if (!btn) return;
        
        window.addEventListener("scroll", () => {
            if (window.scrollY > 500) {
                gsap.to(btn, { autoAlpha: 1, scale: 1, duration: 0.3 });
            } else {
                gsap.to(btn, { autoAlpha: 0, scale: 0.8, duration: 0.3 });
            }
        });
        
        btn.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }
};

/*=========================================
        THEME TOGGLE
=========================================*/

const ThemeToggle = {
    init: () => {
        const btn = document.getElementById("theme-toggle");
        if (!btn) return;
        
        btn.addEventListener("click", () => {
            DOM.body.classList.toggle("light");
        });
    }
};

/*=========================================
        RESPONSIVE HANDLER
=========================================*/

const Responsive = {
    init: () => {
        Responsive.setupResizeListeners();
    },
    
    setupResizeListeners: () => {
        const handleResize = Utils.debounce(() => {
            State.width = window.innerWidth;
            State.height = window.innerHeight;
            ScrollTrigger.refresh();
        }, CONFIG.DEBOUNCE_DELAY);
        
        window.addEventListener("resize", handleResize);
    }
};

/*=========================================
        PERFORMANCE MONITORING
=========================================*/

const Performance = {
    init: () => {
        if (typeof process !== "undefined" && process.env && process.env.NODE_ENV === "development") {
            Performance.monitorFPS();
        }
    },
    
    monitorFPS: () => {
        let frames = 0;
        let lastTime = performance.now();
        
        const measureFPS = () => {
            frames++;
            const now = performance.now();
            const delta = now - lastTime;
            
            if (delta >= 1000) {
                const fps = Math.round((frames * 1000) / delta);
                console.log(`🎮 FPS: ${fps}`);
                frames = 0;
                lastTime = now;
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        requestAnimationFrame(measureFPS);
    }
};

/*=========================================
        INITIALIZATION
=========================================*/

const App = {
    init: () => {
        try {
            // Hide loader and initialize
            Loader.preloadImages();
            
            // Core functionality
            Navigation.init();
            MobileMenu.init();
            
            // Effects
            CustomCursor.init();
            MouseEffects.init();
            ButtonEffects.init();
            
            // Sections
            Typewriter.init();
            Hero.init();
            About.init();
            Skills.init();
            Projects.init();
            Education.init();
            Certificates.init();
            Stats.init();
            Contact.init();
            Footer.init();
            
            // Utilities
            ScrollTop.init();
            ThemeToggle.init();
            Responsive.init();
            Performance.init();
            
            // Refresh ScrollTrigger
            window.addEventListener("load", () => {
                setTimeout(() => ScrollTrigger.refresh(), 500);
            });
            
            // Log success
            console.log(
                "%c🚀 Portfolio Loaded Successfully",
                "color:#8b5cf6;font-size:16px;font-weight:bold;"
            );
            
        } catch (error) {
            console.error("Portfolio Initialization Error:", error);
        }
    }
};

/*=========================================
        DOM READY
=========================================*/

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", App.init);
} else {
    App.init();
}

/*=========================================
        CLEANUP ON UNLOAD
=========================================*/

window.addEventListener("beforeunload", () => {
    // Destroy all ScrollTriggers
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    
    // Kill all GSAP animations
    gsap.globalTimeline.clear();
    
    // Clear intervals
    State.intervals.forEach(interval => clearInterval(interval));
    State.intervals = [];
    
    // Clear timeouts
    State.timeouts.forEach(timeout => clearTimeout(timeout));
    State.timeouts = [];
});



// ==========================
// EmailJS Contact Form
// ==========================

// Public Key
emailjs.init({
    publicKey: "noQcxlrUcquLc56t9"
});

const contactForm = document.getElementById("contactForm");

if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const btn = contactForm.querySelector("button[type='submit']");
        btn.disabled = true;
        btn.innerText = "Sending...";

        emailjs.send("service_l4vcs2y", "template_bc8abf8", {
            name: document.getElementById("name").value,
            email: document.getElementById("email").value,
            subject: document.getElementById("subject").value,
            message: document.getElementById("message").value
        })
        .then(() => {
            alert("✅ Message sent successfully!");
            contactForm.reset();
        })
        .catch((error) => {
            console.error(error);
            alert("❌ Failed to send message. Please try again.");
        })
        .finally(() => {
            btn.disabled = false;
            btn.innerText = "Send Message";
        });
    });
}