document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    setupMobileMenu();
    setupCustomCursor();
});

async function fetchData() {
    try {
        const response = await fetch('assets/data.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        renderSite(data);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

async function renderSite(data) {
    renderMeta(data.site);
    renderNavigation(data.navigation);
    renderHome(data.home);
    renderAbout(data.about);
    renderTimeline(data.timeline);
    renderSkills(data.skills);
    renderProjects(data.projects);
    if(data.certificates) renderCertificates(data.certificates); // Render Certificates
    renderContact(data.contact);
    renderFooter(data.site);
    
    // Init Visuals
    setupScrollReveal();
    setupProjectSlider();
    setupFormSubmission(data.site.contactKey);

    // WAIT for critical images before hiding preloader
    await loadCriticalAssets(data);

    // Hide Preloader
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.classList.add('fade-out');
        document.body.style.overflow = 'auto'; // Re-enable scroll
        document.body.style.overflowX = 'hidden';
    }
}

// ... (Meta, Nav, Home render functions similar to before, adapted slightly) ...
function renderMeta(siteData) {
    document.title = siteData.title;
    document.getElementById('logo').textContent = siteData.logoText;
}

function renderNavigation(navData) {
    const navList = document.getElementById('nav-list');
    navData.forEach(item => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = item.link;
        a.textContent = item.label;
        a.addEventListener('click', () => {
             document.getElementById('main-nav').classList.remove('active');
             document.getElementById('menu-toggle').classList.remove('active');
        });
        li.appendChild(a);
        navList.appendChild(li);
        
        // Populate Section Title
        const sectionId = item.link.substring(1);
        const titleEl = document.getElementById(`title-${sectionId}`);
        if(titleEl) titleEl.textContent = item.label;
    });
}

function renderHome(homeData) {
    document.getElementById('hero-name').textContent = homeData.name;
    document.getElementById('hero-tagline').textContent = homeData.tagline;
    // Buttons
    const btnContainer = document.getElementById('hero-buttons');
    homeData.buttons.forEach(btn => {
        const a = document.createElement('a');
        a.href = btn.link;
        a.className = 'btn';
        a.textContent = btn.text;
        btnContainer.appendChild(a);
    });
    // Particle Background
    setupParticles();
}


// Removed Image Slider in favor of CSS Particles
function setupParticles() {
    const container = document.getElementById('slider-container');
    container.id = 'particles-container'; // Rename for clarity
    
    // Create random particles
    for (let i = 0; i < 25; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        
        // Random Properties
        const size = Math.random() * 8 + 4 + 'px';
        const x = Math.random() * 100 + '%';
        const delay = Math.random() * 15 + 's';
        const duration = Math.random() * 10 + 10 + 's';
        
        p.style.width = size;
        p.style.height = size;
        p.style.left = x;
        p.style.animationDelay = delay;
        p.style.animationDuration = duration;
        
        container.appendChild(p);
    }
}


function renderAbout(aboutData) {
    const aboutSection = document.getElementById('about');
    // Find content container (assumed simply inside the section-container)
    // To support the new structure, we might need to clear existing hardcoded HTML or target specific containers.
    // The current HTML has <div class="about-content">...<div class="bio-card"><p id="about-bio">...
    
    // Let's replace the inner HTML of .about-content to be safer and cleaner
    const aboutContent = aboutSection.querySelector('.about-content');
    if (aboutContent) {
        let imageHtml = '';
        if (aboutData.image) {
            imageHtml = `
                <div class="about-image-wrapper">
                    <img src="${aboutData.image}" alt="Profile" class="profile-image">
                </div>
            `;
        }

        aboutContent.innerHTML = `
            ${imageHtml}
            <div class="about-text-wrapper">
                <div class="bio-card">
                    <p class="bio-text">${aboutData.bio}</p>
                    ${(aboutData.resumeLink && aboutData.resumeLink !== '#') ? `<a href="${aboutData.resumeLink}" class="resume-btn" download>📄 Download Resume</a>` : ''}
                </div>
                <div class="objective-card">
                    <p class="objective-text">${aboutData.objective}</p>
                </div>
            </div>
        `;
        // Apply new class for flex layout
        aboutContent.classList.add('about-split-layout');
    }
}

// NEW: Timeline Renderer
function renderTimeline(timelineData) {
    const container = document.getElementById('merged-timeline');
    if(!container) return; // Guard clause
    
    timelineData.forEach(item => {
        const div = document.createElement('div');
        div.className = 'timeline-item';
        div.innerHTML = `
            <div class="timeline-content">
                <span class="t-icon">${item.icon}</span>
                <span class="t-date">${item.year}</span>
                <h4>${item.title}</h4>
                <p class="t-org">${item.org}</p>
            </div>
        `;
        container.appendChild(div);
    });
}

function renderSkills(skillsData) {
    const wrapper = document.getElementById('skills-wrapper');
    if (!wrapper || !skillsData) return;
    
    wrapper.innerHTML = ''; // Clear existing
    
    Object.keys(skillsData).forEach(cat => {
        const safeId = cat.replace(/\s+/g, '-').toLowerCase();
        const div = document.createElement('div');
        div.className = 'skill-category';
        div.innerHTML = `<h3>${cat}</h3><div class="skill-list" id="skill-${safeId}"></div>`;
        wrapper.appendChild(div);
        
        const list = div.querySelector(`#skill-${safeId}`);
        skillsData[cat].forEach(skill => {
            const badge = document.createElement('span');
            badge.className = 'skill-badge';
            badge.textContent = skill.name;
            list.appendChild(badge);
        });
    });
}

// NEW: Project Slider Renderer (Single Card with Image)
function renderProjects(projectsData) {
    const slider = document.getElementById('projects-slider');
    if(!slider) return;

    const createCard = (proj) => {
        const card = document.createElement('div');
        card.className = 'project-card single-mode';
        const imgPath = proj.image || 'https://placehold.co/600x400/2E6F40/CFFFDC?text=Project';
        card.innerHTML = `
            <div class="project-image-container">
                <img src="${imgPath}" alt="${proj.title}" loading="lazy">
            </div>
            <div class="project-content">
                <h3>${proj.title}</h3>
                <p>${proj.description}</p>
                <div class="project-links-wrapper">
                    ${proj.link ? `<a href="${proj.link}" target="_blank" class="project-link">GitHub ↗</a>` : ''}
                    ${proj.liveLink ? `<a href="${proj.liveLink}" target="_blank" class="project-link live-demo">Live Demo ↗</a>` : ''}
                    ${proj.liveLinks ? proj.liveLinks.map(l => `<a href="${l.link}" target="_blank" class="project-link live-demo">${l.text} ↗</a>`).join('') : ''}
                </div>
            </div>
        `;
        return card;
    };

    // Render Real Cards
    projectsData.forEach(proj => {
        slider.appendChild(createCard(proj));
    });

    // Clone first few and prepend last few for infinite loop
    const clonesCount = 3;
    const cards = Array.from(slider.children);
    
    // Append clones of first few
    for(let i=0; i<clonesCount; i++) {
        slider.appendChild(cards[i].cloneNode(true));
    }
    
    // Prepend clones of last few
    for(let i=0; i<clonesCount; i++) {
        slider.insertBefore(cards[cards.length - 1 - i].cloneNode(true), slider.firstChild);
    }
}

// Helper to convert GDrive View link to Direct Image Preview
function googleDrivePreview(url) {
    if (!url || url === '#' || url.includes('mailto:')) return url;
    if (!url.includes('drive.google.com') || url.includes('/folders/')) return url;

    try {
        // Handle various GDrive link formats (open?id=, d/FILE_ID/view, etc.)
        let fileId = '';
        if (url.includes('id=')) {
            fileId = url.split('id=')[1].split('&')[0];
        } else if (url.includes('/d/')) {
            fileId = url.split('/d/')[1].split('/')[0];
        }
        return fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000` : url;
    } catch (e) {
        return url;
    }
}

// NEW: Certificates Renderer
function renderCertificates(certData) {
    const grid = document.getElementById('certificate-grid');
    if (!grid || !certData) return;

    grid.innerHTML = certData.map(cert => {
        const previewImg = googleDrivePreview(cert.link);
        return `
            <div class="certificate-card" onclick="window.openCertModal('${previewImg}')">
                <div class="cert-image-wrapper">
                     <img src="${previewImg}" alt="${cert.title}" loading="lazy" 
                          onerror="this.src='https://placehold.co/600x400/0f1c13/68ba7f/png?text=Achievement'; this.onerror=null;">
                    <div class="cert-overlay">
                        <span class="cert-icon">${cert.icon === 'award' ? '🏆' : '📜'}</span>
                    </div>
                </div>
                <div class="cert-content">
                    <h3>${cert.title}</h3>
                    <p class="cert-issuer">Issued by <strong>${cert.issuer}</strong></p>
                    <div class="cert-footer">
                        <span class="cert-date">${cert.date}</span>
                        <div class="cert-btns">
                            <button class="cert-verify-btn" onclick="event.stopPropagation(); window.open('${cert.link}', '_blank')">View</button>
                            ${cert.verifyLink ? `<a href="${cert.verifyLink}" target="_blank" class="cert-verify-link" onclick="event.stopPropagation()">Verify ↗</a>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    setupCertificateModal();
}

function setupCertificateModal() {
    const modal = document.getElementById('cert-modal');
    const modalImg = document.getElementById('modal-img');
    const closeBtn = document.querySelector('.close-modal');
    
    if(!modal || !closeBtn) return;

    window.openCertModal = (imgSrc) => {
        // Only open modal if it's a valid preview image
        if (!imgSrc || imgSrc === '#' || imgSrc.includes('mailto:')) return;
        
        modal.style.display = "flex";
        modalImg.src = imgSrc;
        document.body.style.overflow = "hidden"; // Stop scrolling
    };

    closeBtn.onclick = () => {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    };

    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = "none";
            document.body.style.overflow = "auto";
        }
    };
}

function renderContact(contactData) {
    const infoContainer = document.querySelector('.contact-info');
    const form = document.querySelector('.royal-form');
    
    if (infoContainer) {
        let socialHtml = '';
        if (contactData.social) {
            const socialIcons = contactData.social.map(s => {
                let svg = '';
                if(s.icon === 'linkedin') {
                    svg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>';
                } else if (s.icon === 'github') {
                    svg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>';
                }
                return `<a href="${s.link}" target="_blank" class="social-icon" aria-label="${s.name}">${svg}</a>`;
            }).join('');
            socialHtml = `<div class="social-links">${socialIcons}</div>`;
        }

        infoContainer.innerHTML = `
            <div class="info-item"><span class="icon">📧</span>${contactData.email}</div>
            <div class="info-item"><span class="icon">📞</span>${contactData.phone}</div>
            <div class="info-item"><span class="icon">📍</span>${contactData.location}</div>
            ${socialHtml}
        `;
    }

    if (form) {
        form.id = "contact-form"; // Ensure ID is set
        const nameInput = form.querySelector('input[name="name"]') || form.querySelector('input[type="text"]');
        const emailInput = form.querySelector('input[name="email"]') || form.querySelector('input[type="email"]');
        const messageInput = form.querySelector('textarea');
        const submitBtn = form.querySelector('button');

        if(nameInput) {
            nameInput.name = "name";
            nameInput.placeholder = contactData.form.nameLabel;
        }
        if(emailInput) {
            emailInput.name = "email";
            emailInput.placeholder = contactData.form.emailLabel;
        }
        if(messageInput) {
            messageInput.name = "message";
            messageInput.placeholder = contactData.form.messageLabel;
        }
        if(submitBtn) submitBtn.textContent = contactData.form.submitText;
    }
}

function renderFooter(siteData) {
    const footer = document.getElementById('main-footer') || document.querySelector('footer'); // Fallback
    if(footer) footer.innerHTML = `<p>${siteData.footerText}</p>`;
}

// NEW: Canvas Particles (Interactive Firefly System)
function setupParticles() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width, height;
    let particles = [];
    let trailParticles = []; // Separate array for mouse trail
    
    // Mouse State
    let mouse = { x: null, y: null, radius: 150 };
    let isMobile = window.innerWidth < 768;

    window.addEventListener('mousemove', (e) => {
        if (!isMobile) {
            mouse.x = e.x;
            mouse.y = e.y;
            
            // Spawn Trail Particles on Move
            for(let i=0; i<2; i++) {
                trailParticles.push(new TrailParticle(e.x, e.y));
            }
        }
    });
    
    // Resize
    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        isMobile = width < 768;
        initParticles();
    }
    window.addEventListener('resize', resize);
    
    // Background Particle Class
    class Particle {
        constructor() {
            this.init();
        }

        init() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            
            const typeRandom = Math.random();
            if (typeRandom < 0.6) {
                this.type = 'dust';
                this.size = Math.random() * 1.5 + 0.5;
                this.baseColor = 'rgba(255, 255, 255,'; 
                this.opacity = Math.random() * 0.2 + 0.05;
                this.speedX = Math.random() * 0.2 - 0.1;
                this.speedY = Math.random() * 0.2 - 0.1;
            } else if (typeRandom < 0.9) {
                this.type = 'spore';
                this.size = Math.random() * 2.5 + 1;
                this.baseColor = 'rgba(104, 186, 127,'; 
                this.opacity = Math.random() * 0.4 + 0.2;
                this.speedX = Math.random() * 0.6 - 0.3;
                this.speedY = Math.random() * 0.6 - 0.3;
            } else {
                this.type = 'orb';
                this.size = Math.random() * 4 + 2;
                this.baseColor = 'rgba(242, 208, 107,'; 
                this.opacity = Math.random() * 0.15 + 0.05;
                this.speedX = Math.random() * 0.4 - 0.2;
                this.speedY = Math.random() * 0.4 - 0.2;
            }
            this.density = (Math.random() * 30) + 1;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            // Mouse Repulsion
            if (!isMobile && mouse.x != null) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < mouse.radius) {
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (mouse.radius - distance) / mouse.radius;
                    const directionX = forceDirectionX * force * this.density;
                    const directionY = forceDirectionY * force * this.density;
                    this.x -= directionX;
                    this.y -= directionY;
                }
            }
            
            // Wrap
            if(this.x > width + 20) this.x = -10;
            if(this.x < -20) this.x = width + 10;
            if(this.y > height + 20) this.y = -10;
            if(this.y < -20) this.y = height + 10;
        }

        draw() {
            ctx.fillStyle = `${this.baseColor} ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Trail Particle Class (Short-lived)
    class TrailParticle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 3 + 1; // 1-4px
            this.speedX = Math.random() * 2 - 1; // Spread
            this.speedY = Math.random() * 2 - 1;
            this.color = Math.random() > 0.5 ? 'rgba(242, 208, 107,' : 'rgba(104, 186, 127,'; // Gold or Green
            this.life = 1.0; // Life starts at 100%
            this.decay = Math.random() * 0.03 + 0.02; // Fade speed
        }
        
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.size *= 0.95; // Shrink
            this.life -= this.decay;
        }
        
        draw() {
            ctx.fillStyle = `${this.color} ${this.life})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    function initParticles() {
        particles = [];
        const particleCount = isMobile ? 35 : 80; 
        for(let i=0; i<particleCount; i++) {
            particles.push(new Particle());
        }
    }
    
    // Initial Start
    resize();
    
    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        // Background Particles
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        
        // Trail Particles
        for (let i = 0; i < trailParticles.length; i++) {
            trailParticles[i].update();
            trailParticles[i].draw();
            // Remove dead particles
            if (trailParticles[i].life <= 0 || trailParticles[i].size <= 0.2) {
                trailParticles.splice(i, 1);
                i--;
            }
        }
        
        requestAnimationFrame(animate);
    }
    animate();
}

// === INTERACTION LOGIC ===

function setupMobileMenu() {
    const toggle = document.getElementById('menu-toggle');
    const nav = document.getElementById('main-nav');
    toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        nav.classList.toggle('active');
    });
}

function setupScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if(entry.isIntersecting) entry.target.classList.add('active');
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.section-title, .bio-card, .objective-card, .timeline-content, .skill-category, .project-card').forEach(el => {
        el.classList.add('reveal');
        observer.observe(el);
    });
}

// NEW: Advanced Project Slider (Arrows + Dots)
function setupProjectSlider() {
    const slider = document.getElementById('projects-slider');
    const dotsContainer = document.getElementById('slider-dots');
    const prevBtn = document.querySelector('.slider-arrow.prev');
    const nextBtn = document.querySelector('.slider-arrow.next');
    
    if(!slider) return;
    
    const clonesCount = 3;
    const cards = Array.from(slider.children);
    if(cards.length === 0) return;
    
    const cardWidth = cards[0].offsetWidth + 32; // width + gap
    const realCardsCount = cards.length - (clonesCount * 2);

    // Initial Scroll Position (Skip initial clones)
    slider.scrollLeft = cardWidth * clonesCount;
    
    // Create Dots for REAL projects only
    dotsContainer.innerHTML = '';
    for(let i=0; i<realCardsCount; i++) {
        const dot = document.createElement('div');
        dot.className = i === 0 ? 'dot active' : 'dot';
        dot.addEventListener('click', () => {
             slider.scrollTo({ left: cardWidth * (i + clonesCount), behavior: 'smooth' });
             resetAutoPlay();
        });
        dotsContainer.appendChild(dot);
    }
    
    // Seamless Jump Logic
    let isJumping = false;
    slider.addEventListener('scroll', () => {
        if (isJumping) return;

        const currentScroll = slider.scrollLeft;
        const maxScroll = slider.scrollWidth - slider.clientWidth;

        // Jump from beginning (clones) to end (real)
        if (currentScroll <= cardWidth * (clonesCount - 2)) {
            isJumping = true;
            slider.scrollLeft = currentScroll + (cardWidth * realCardsCount);
            setTimeout(() => isJumping = false, 50);
        } 
        // Jump from end (clones) to beginning (real)
        else if (currentScroll >= maxScroll - cardWidth * (clonesCount - 2)) {
            isJumping = true;
            slider.scrollLeft = currentScroll - (cardWidth * realCardsCount);
            setTimeout(() => isJumping = false, 50);
        }

        // Sync Dots
        const realIndex = Math.round((slider.scrollLeft / cardWidth) - clonesCount);
        const activeIndex = (realIndex % realCardsCount + realCardsCount) % realCardsCount;
        
        document.querySelectorAll('.dot').forEach((d, i) => {
            d.classList.toggle('active', i === activeIndex);
        });
    });
    
    // Arrow Logic
    if(prevBtn) prevBtn.addEventListener('click', () => {
        slider.scrollBy({ left: -cardWidth, behavior: 'smooth' });
        resetAutoPlay();
    });

    if(nextBtn) nextBtn.addEventListener('click', () => {
        slider.scrollBy({ left: cardWidth, behavior: 'smooth' });
        resetAutoPlay();
    });
    
    // Drag Logic
    let isDown = false;
    let startX;
    let scrollLeft;

    slider.addEventListener('mousedown', (e) => {
        isDown = true;
        slider.classList.add('active');
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
        stopAutoPlay();
    });
    slider.addEventListener('mouseleave', () => {
        isDown = false;
        slider.classList.remove('active');
        startAutoPlay();
    });
    slider.addEventListener('mouseup', () => {
        isDown = false;
        slider.classList.remove('active');
        startAutoPlay();
    });
    slider.addEventListener('mousemove', (e) => {
        if(!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 2;
        slider.scrollLeft = scrollLeft - walk;
    });

    // Auto Play Logic
    let autoPlayInterval;
    
    function startAutoPlay() {
        stopAutoPlay();
        autoPlayInterval = setInterval(() => {
            slider.scrollBy({ left: cardWidth, behavior: 'smooth' });
        }, 4000); 
    }

    function stopAutoPlay() {
        clearInterval(autoPlayInterval);
    }

    function resetAutoPlay() {
        stopAutoPlay();
        startAutoPlay();
    }

    startAutoPlay();
    slider.addEventListener('mouseenter', stopAutoPlay);
}

// NEW: Custom Cursor Logic
function setupCustomCursor() {
    const cursor = document.getElementById('custom-cursor');
    const follower = document.getElementById('cursor-follower');
    
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
        
        // Slight delay for follower
        setTimeout(() => {
            follower.style.left = e.clientX + 'px';
            follower.style.top = e.clientY + 'px';
        }, 80);
    });

    // Hover effects
    document.querySelectorAll('a, button, .project-card, .timeline-content, .skill-badge, .certificate-card, .close-modal').forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
    });
}

// NEW: Contact Form AJAX Handler
function setupFormSubmission(accessKey) {
    const form = document.getElementById('contact-form');
    if(!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const btn = form.querySelector('button');
        const originalBtnText = btn.textContent;

        // Client-Side hCaptcha Validation
        const hCaptcha = form.querySelector('textarea[name=h-captcha-response]')?.value;
        if (!hCaptcha) {
            e.preventDefault();
            alert("Please complete the captcha challenge.");
            return;
        }

        btn.textContent = "Sending...";
        btn.disabled = true;

        const formData = new FormData(form);
        const object = Object.fromEntries(formData);
        
        // Inject keys
        object.access_key = accessKey;

        const json = JSON.stringify(object);

        fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: json
        })
        .then(async (response) => {
            let json = await response.json();
            if (response.status == 200) {
                btn.textContent = "Sent!";
                btn.style.background = "var(--forest-accent)";
                btn.style.color = "#000";
                form.reset();
                setTimeout(() => {
                    btn.textContent = originalBtnText;
                    btn.style.background = "";
                    btn.style.color = "";
                    btn.disabled = false;
                }, 5000);
            } else {
                console.log(response);
                btn.textContent = "Error!";
                setTimeout(() => {
                    btn.textContent = originalBtnText;
                    btn.disabled = false;
                }, 3000);
            }
        })
        .catch(error => {
            console.log(error);
            btn.textContent = "Error!";
            setTimeout(() => {
                btn.textContent = originalBtnText;
                btn.disabled = false;
            }, 3000);
        });
    });
}

// NEW: Scroll Reveal Logic
function setupScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    reveals.forEach(el => observer.observe(el));
}

/**
 * ASYNC IMAGE LOADING UTILITY
 * Ensures images are cached by the browser before showing the page
 */
function loadImage(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(src);
        img.onerror = () => resolve(src); // Resolve even on error to avoid blocking site
    });
}

/**
 * FETCH CRITICAL ASSETS EFFICIENTLY
 * Parallelizes loading of essential UI images
 */
async function loadCriticalAssets(data) {
    const criticalUrls = [];

    // Home & About images (Highest priority)
    if (data.home?.image) criticalUrls.push(data.home.image);
    if (data.about?.image) criticalUrls.push(data.about.image);

    // First row of projects (Visible at start or early scroll)
    if (data.projects) {
        data.projects.slice(0, 3).forEach(p => {
            if (p.image) criticalUrls.push(p.image);
        });
    }

    // First row of certs (Visible early)
    if (data.certificates) {
        data.certificates.slice(0, 3).forEach(c => {
            if (c.link) criticalUrls.push(googleDrivePreview(c.link));
        });
    }

    // Use Promise.all to fetch in parallel for maximum efficiency
    await Promise.all(criticalUrls.map(url => loadImage(url)));
}
