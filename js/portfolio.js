// --- 1. TYPEWRITER EFFECT (HEADER) ---
        const textToType = "JOHN LAWRENCE J. CANO";
        const typeWriterElement = document.getElementById('typewriter');
        let i = 0;

        function typeWriter() {
            if (i < textToType.length) {
                typeWriterElement.innerHTML += textToType.charAt(i);
                i++;
                setTimeout(typeWriter, 150);
            }
        }

        window.onload = function () {
            typeWriter();

            // Initial Bot Greeting after page load
            setTimeout(() => {
                typeBotText("Welcome, Traveler. I am your guide.");
            }, 2000);
        };

        // --- 2. SCROLL REVEAL ANIMATION ---
        const observerOptions = {
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.reveal').forEach(el => {
            observer.observe(el);
        });

        // --- 3. ACTIVE NAVIGATION LINK ---
        const sections = document.querySelectorAll("section");
        const navLi = document.querySelectorAll("nav ul li a");

        window.onscroll = () => {
            var current = "";
            sections.forEach((section) => {
                const sectionTop = section.offsetTop;
                if (pageYOffset >= sectionTop - 200) {
                    current = section.getAttribute("id");
                }
            });
            navLi.forEach((li) => {
                li.classList.remove("active-link");
                if (li.getAttribute("href").includes(current)) {
                    li.classList.add("active-link");
                }
            });
        };

        // --- 4. TABS & SLIDER ---
        function openTab(tabName) {
            const sliders = document.querySelectorAll('.slider-wrapper');
            sliders.forEach(slider => {
                slider.classList.remove('active');
                slider.style.display = "none";
            });

            const buttons = document.querySelectorAll('.tab-btn');
            buttons.forEach(btn => btn.classList.remove('active'));

            const activeSlider = document.getElementById(tabName);
            activeSlider.style.display = "block";
            setTimeout(() => {
                activeSlider.classList.add('active');
            }, 10);

            const clickedBtn = Array.from(buttons).find(btn => btn.onclick.toString().includes(tabName));
            if (clickedBtn) clickedBtn.classList.add('active');
        }

        function scrollSlider(id, amount) {
            const slider = document.getElementById(id);
            slider.scrollBy({
                left: amount,
                behavior: 'smooth'
            });
        }



        const botDialogues = [
            "Hello! I am Bot-Cano. I help John write code.",
            "Did you know? John specializes in Mobile Architecture.",
            "Click me again to hear a secret...",
            "John once debugged code for 12 hours straight (and won).",
            "We are currently running on HTML5 and Caffeine.",
            "Check out the 'Projects' tab to see my favorite mission.",
            "Need a developer? Click the Contact button below!",
            "MASTER SI HYA SA UI DESIGNING"
        ];

        let diagIndex = 0;
        let isBotTyping = false;
        const speechBubble = document.getElementById('botSpeech');
        const botText = document.getElementById('botText');

        function typeBotText(text) {
            if (isBotTyping) return; // Prevent clicking while typing
            isBotTyping = true;
            speechBubble.classList.remove('hidden');
            botText.innerHTML = "";

            let charIndex = 0;
            const typeInterval = setInterval(() => {
                if (charIndex < text.length) {
                    botText.innerHTML += text.charAt(charIndex);
                    charIndex++;
                } else {
                    clearInterval(typeInterval);
                    isBotTyping = false;

                    // Auto-hide after 5 seconds if not clicked
                    setTimeout(() => {
                        if (!isBotTyping) speechBubble.classList.add('hidden');
                    }, 5000);
                }
            }, 40); // Typing speed
        }

        function botNextDialogue() {
            if (isBotTyping) return;

            // Get next text
            const text = botDialogues[diagIndex];
            typeBotText(text);

            // Loop through array
            diagIndex = (diagIndex + 1) % botDialogues.length;
        }

        // Context Awareness (Comments based on scroll position)
        window.addEventListener('scroll', () => {
            let scrollPos = window.scrollY;

            const skillsSection = document.getElementById('skills').offsetTop;
            const projectsSection = document.getElementById('projects').offsetTop;
            const contactSection = document.getElementById('contact').offsetTop;

            // Only trigger if the bubble is hidden
            if (speechBubble.classList.contains('hidden')) {
                if (scrollPos >= contactSection - 300 && scrollPos < contactSection + 100) {
                    typeBotText("Ready to hire him? Good choice!");
                }
                else if (scrollPos >= projectsSection - 300 && scrollPos < projectsSection - 100) {
                    typeBotText("These are some high-level missions.");
                }
            }
        });


        // --- COIN INSERTION ANIMATION ---
        function insertCoin() {
            const overlay = document.getElementById('coinOverlay');
            const coin = document.getElementById('coin');
            const contactInfo = document.getElementById('contactInfo');
            const insertText = document.querySelector('.insert-coin-text');
            
            // Show overlay
            overlay.classList.remove('hidden');
            
            // Start coin animation after a brief delay
            setTimeout(() => {
                coin.classList.add('inserting');
                
                // Play coin drop sound effect (optional - can add audio later)
                
                // After coin drops, hide text and show contact info
                setTimeout(() => {
                    insertText.style.display = 'none';
                    contactInfo.classList.add('show');
                }, 1500); // Match coinDrop animation duration
                
            }, 500);
        }

        function closeCoinOverlay() {
            const overlay = document.getElementById('coinOverlay');
            const coin = document.getElementById('coin');
            const contactInfo = document.getElementById('contactInfo');
            const insertText = document.querySelector('.insert-coin-text');
            
            // Reset everything
            overlay.classList.add('hidden');
            coin.classList.remove('inserting');
            contactInfo.classList.remove('show');
            insertText.style.display = 'block';
        }
