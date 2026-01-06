/*
 * YUCA CORE JS
 * Version: 1.0
 * 
 * Ce fichier gère :
 * - Navigation (scroll effect + mobile toggle)
 * - Formulaire de contact (envoi vers Brevo)
 * - Chatbot Yuca (API Claude)
 * 
 * VARIABLES À DÉFINIR AVANT CE SCRIPT :
 * - SITE_CONFIG.businessName
 * - SITE_CONFIG.chatbotPrompt
 * - SITE_CONFIG.chatbotWelcome
 * - SITE_CONFIG.chatbotSuggestions
 * - SITE_CONFIG.avatarLetter
 */

(function() {
    'use strict';

    // ========================================
    // NAVIGATION
    // ========================================
    const nav = document.getElementById('nav');
    const burger = document.getElementById('navBurger');
    const mobileNav = document.getElementById('navMobile');
    const overlay = document.getElementById('navOverlay');

    // Scroll effect
    if (nav) {
        window.addEventListener('scroll', function() {
            nav.classList.toggle('scrolled', window.scrollY > 50);
        });
    }

    // Mobile nav toggle
    function toggleMobileNav() {
        if (mobileNav && overlay) {
            mobileNav.classList.toggle('open');
            overlay.classList.toggle('visible');
            document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
        }
    }

    if (burger) burger.addEventListener('click', toggleMobileNav);
    if (overlay) overlay.addEventListener('click', toggleMobileNav);
    if (mobileNav) {
        mobileNav.querySelectorAll('a').forEach(function(link) {
            link.addEventListener('click', toggleMobileNav);
        });
    }

    // ========================================
    // FORM SUBMISSION
    // ========================================
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const btn = this.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.textContent = 'Envoi...';
            btn.disabled = true;

            const formData = {
                name: document.getElementById('name')?.value || '',
                email: document.getElementById('email')?.value || '',
                phone: document.getElementById('phone')?.value || '',
                business: window.SITE_CONFIG?.businessName || 'Site Yuca',
                project: document.getElementById('message')?.value || '',
                source: 'site-' + (window.SITE_CONFIG?.businessName?.toLowerCase().replace(/\s+/g, '-') || 'client')
            };

            try {
                await fetch('https://yuca-api.vercel.app/api/lead', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                
                btn.textContent = 'Envoyé';
                btn.style.background = '#4ade80';
                this.reset();
            } catch (err) {
                btn.textContent = 'Erreur';
                btn.style.background = '#ef4444';
            }

            setTimeout(function() {
                btn.textContent = originalText;
                btn.style.background = '';
                btn.disabled = false;
            }, 3000);
        });
    }

    // ========================================
    // CHATBOT YUCA
    // ========================================
    const trigger = document.getElementById('yucaTrigger');
    const chatWindow = document.getElementById('yucaWindow');
    const closeBtn = document.getElementById('yucaClose');
    const messagesBox = document.getElementById('yucaMessages');
    const input = document.getElementById('yucaInput');
    const sendBtn = document.getElementById('yucaSend');

    let messages = [];
    let isOpen = false;

    function toggleChat() {
        isOpen = !isOpen;
        if (chatWindow) {
            chatWindow.classList.toggle('open', isOpen);
            
if (isOpen && messages.length === 0) {
  const config = window.SITE_CONFIG || {};

  messages.push({
    role: "system",
    content: config.chatbotPrompt
  });

  addBotMessage(
    config.chatbotWelcome,
    config.chatbotSuggestions
  );
}

    if (trigger) trigger.addEventListener('click', toggleChat);
    if (closeBtn) closeBtn.addEventListener('click', toggleChat);

    function addBotMessage(text, suggestions) {
        if (!messagesBox) return;
        
        const div = document.createElement('div');
        div.className = 'yuca-message yuca-message--bot';
        
        let html = text;
        if (suggestions && suggestions.length > 0) {
            html += '<div class="yuca-quick-replies">';
            suggestions.forEach(function(s) {
                html += '<button class="yuca-quick-reply" data-value="' + s + '">' + s + '</button>';
            });
            html += '</div>';
        }
        
        div.innerHTML = html;
        messagesBox.appendChild(div);
        messagesBox.scrollTop = messagesBox.scrollHeight;
        
        // Quick reply handlers
        div.querySelectorAll('.yuca-quick-reply').forEach(function(btn) {
            btn.addEventListener('click', function() {
                sendMessage(this.dataset.value);
            });
        });
        
        messages.push({ role: 'assistant', content: text });
    }

    function addUserMessage(text) {
        if (!messagesBox) return;
        
        const div = document.createElement('div');
        div.className = 'yuca-message yuca-message--user';
        div.textContent = text;
        messagesBox.appendChild(div);
        messagesBox.scrollTop = messagesBox.scrollHeight;
        
        messages.push({ role: 'user', content: text });
    }

    function showTyping() {
        if (!messagesBox) return;
        
        const div = document.createElement('div');
        div.className = 'yuca-typing';
        div.id = 'yucaTyping';
        div.innerHTML = '<span></span><span></span><span></span>';
        messagesBox.appendChild(div);
        messagesBox.scrollTop = messagesBox.scrollHeight;
    }

    function hideTyping() {
        const typing = document.getElementById('yucaTyping');
        if (typing) typing.remove();
    }

    async function sendMessage(text) {
        const content = text || (input ? input.value.trim() : '');
        if (!content) return;
        
        if (input) input.value = '';
        addUserMessage(content);
        showTyping();

        const config = window.SITE_CONFIG || {};
        
try {
    const response = await fetch('https://yuca-api.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            messages: [
                {
                    role: 'system',
                    content: config.chatbotPrompt || 'Tu es l’assistant du restaurant.'
                },
                ...messages.map(function(m) {
                    return { role: m.role, content: m.content };
                })
            ]
        })
    });

            
            const data = await response.json();
            hideTyping();
            
            let respText = data.content[0].text;
            let suggestions = null;
            
            // Extract suggestions from response
            const match = respText.match(/\[SUGGESTIONS:(.+?)\]/);
            if (match) {
                suggestions = match[1].split('|').map(function(s) { return s.trim(); });
                respText = respText.replace(match[0], '').trim();
            }
            
            addBotMessage(respText, suggestions);
            
        } catch (err) {
            hideTyping();
            addBotMessage(
                'Désolé, je rencontre un problème technique. Veuillez nous contacter directement.',
                ['Appeler', 'Email']
            );
        }
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', function() {
            sendMessage();
        });
    }
    
    if (input) {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') sendMessage();
        });
    }

})();
