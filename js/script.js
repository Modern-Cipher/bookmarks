document.addEventListener('DOMContentLoaded', function() {
    
    // --- Kunin lahat ng elements ---
    const bookmarkContainer = document.getElementById('bookmark-container');
    const bookmarkImage = document.getElementById('bookmark-image');
    const magnifier = document.getElementById('magnifier');
    const magnifierImage = document.getElementById('magnifier-image');
    
    // --- STORY STEPPER ELEMENTS ---
    let storyTextWrapperCurrent = document.querySelector('.story-text-wrapper.current-story'); // USE LET
    let storyTextWrapperNext = document.querySelector('.story-text-wrapper.next-story'); // USE LET
    let storyTitleCurrent = document.getElementById('story-title'); // USE LET
    let storyDescriptionCurrent = document.getElementById('story-description'); // USE LET
    let storyTitleNext = document.getElementById('story-title-next'); // USE LET
    let storyDescriptionNext = document.getElementById('story-description-next'); // USE LET
    const btnPrev = document.getElementById('story-prev');
    const btnNext = document.getElementById('story-next');
    
    // --- BUTTONS ---
    const printButton = document.getElementById('print-button');
    const downloadButton = document.getElementById('download-button');
    const shareButton = document.getElementById('share-button'); // Share Button
    
    // --- TOAST ELEMENT ---
    const actionToastEl = document.getElementById('actionToast');
    const actionToast = new bootstrap.Toast(actionToastEl);
    
    // --- Variables ---
    let zoomFactor = 5; 
    let currentStoryIndex = 0;
    let isMagnifierActive = false; // BAGO: State para malaman kung naka-on
    let isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // --- BAGO: ANG MGA PINAGANDANG KWENTO ---
    const stories = [
        { 
            title: 'Kabanata 1: Pundasyon ng Pangarap', 
            description: 'Sa murang isipan, ang bawat titik ay binhi. Ang pagbabasa\'y dilig sa uhaw na diwa, nagpapatibay ng ugat ng kaalaman. Dito nagsisimula ang paghabi ng mga pangarap, sa mga pahinang kandungan ng musmos na kamalayan.' 
        },
        { 
            title: 'Kabanata 2: Tulay ng Karunungan', 
            description: 'Mula sa binhi, sumisibol ang tulay – mga aklat na nag-uugnay sa kahapon, ngayon, at bukas. Bawat kwento\'y hakbang, bawat aral ay lakas, itinatawid ang mambabasa sa malawak na karagatan ng karunungan patungo sa pampang ng pag-unawa.' 
        },
        { 
            title: 'Kabanata 3: Liwanag sa Dako Pa Roon', 
            description: 'Sa dulo ng tulay, natatanaw ang maningning na liwanag. Ang pagbabasa ang tanglaw sa landas patungo sa kinabukasang may pag-asa. Dala ang natutunan, hinaharap ang bukas nang may tapang at tiwala, handang abutin ang mga bituin.' 
        }
    ];

    // --- Function para IPAKITA/I-UPDATE ang Magnifier (ACCURATE at WALANG DELAY) ---
    function updateMagnifier(x, y) {
        let bookmarkRect = bookmarkImage.getBoundingClientRect();
        if (bookmarkRect.width === 0 || bookmarkRect.height === 0) return; 

        let magSize = parseFloat(getComputedStyle(magnifier).width);
        let displayedImgWidth = bookmarkRect.width;
        let displayedImgHeight = bookmarkRect.height;
        
        let bgWidth = displayedImgWidth * zoomFactor;
        let bgHeight = displayedImgHeight * zoomFactor;
        
        // ACCURATE LOGIC. WALANG PUTOL.
        let bgPosX = -(x * zoomFactor) + (magSize / 2);
        let bgPosY = -(y * zoomFactor) + (magSize / 2);

        // INSTANT UPDATE gamit ang GSAP.set
        gsap.set(magnifierImage, {
            width: bgWidth,
            height: bgHeight,
            backgroundSize: `${bgWidth}px ${bgHeight}px`,
            left: `${bgPosX}px`,
            top: `${bgPosY}px`,
        });

        let percentX = (x / displayedImgWidth) * 100;
        let percentY = (y / displayedImgHeight) * 100;

        // INSTANT UPDATE sa pwesto ng magnifier
        gsap.set(magnifier, {
            left: `${percentX}%`,
            top: `${percentY}%`,
        });
        
        // Ipakita 'yung magnifier kung nakatago (animation)
        showMagnifierAnimation();
    }

    // --- Function para ITAGO ang Magnifier (MAY DELAY NA TAMA) ---
    function hideMagnifier() {
        gsap.to(magnifier, {
            opacity: 0,
            scale: 0.5,
            duration: 0.2, 
            ease: 'power2.in'
        });
    }
    
    // --- Function para IPAKITA ang Magnifier (ANIMATION LANG) ---
    function showMagnifierAnimation() {
         gsap.to(magnifier, {
            opacity: 1,
            scale: 1,
            duration: 0.3, 
            ease: 'power2.out'
        });
    }
    
    // --- Function para i-update 'yung Story Stepper (SLIDING FADE FIXED) ---
    function updateStory(index, direction) { 
        let story = stories[index];
        
        let slideOutX = (direction === 'next') ? -20 : 20; // Shorter slide
        let slideInX = (direction === 'next') ? 20 : -20;

        // Prepare next slide content
        storyTitleNext.textContent = story.title;
        storyDescriptionNext.textContent = story.description;
        gsap.set(storyTextWrapperNext, { x: slideInX, opacity: 0, display: 'block', position: 'absolute', top: 0, left: 0, width: '100%' }); 

        // Slide out current
        gsap.to(storyTextWrapperCurrent, {
            opacity: 0,
            x: slideOutX,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => {
                 gsap.set(storyTextWrapperCurrent, { display: 'none', position: 'absolute' }); // Move inactive off-stage
                 storyTextWrapperCurrent.classList.remove('current-story');
                 storyTextWrapperCurrent.classList.add('next-story'); // Mark as inactive/next
            }
        });
        
        // Slide in next
        gsap.to(storyTextWrapperNext, {
            opacity: 1,
            x: 0,
            duration: 0.3,
            delay: 0.1, 
            ease: 'power2.out',
            onComplete: () => {
                 // Make the newly visible wrapper relative again
                 gsap.set(storyTextWrapperNext, { position: 'relative' }); 
                 storyTextWrapperNext.classList.remove('next-story');
                 storyTextWrapperNext.classList.add('current-story'); 

                 // Swap element variables for next time
                 [storyTextWrapperCurrent, storyTextWrapperNext] = [storyTextWrapperNext, storyTextWrapperCurrent];
                 [storyTitleCurrent, storyTitleNext] = [storyTitleNext, storyTitleCurrent];
                 [storyDescriptionCurrent, storyDescriptionNext] = [storyDescriptionNext, storyDescriptionCurrent];

            }
        });
        
        // Ayusin 'yung buttons
        btnPrev.disabled = (index === 0);
        btnNext.disabled = (index === stories.length - 1);
    }
    
    // --- 1. & 2. BAGO: LOGIC PARA SA CLICK-TO-ACTIVATE (Desktop at Mobile) ---

    // Click listener sa mismong image para i-toggle
    bookmarkImage.addEventListener('click', function(event) {
        event.preventDefault(); // Para 'di mag-drag or what
        isMagnifierActive = !isMagnifierActive; // Toggles true/false
        
        if (!isMagnifierActive) {
            // Kung kaka-off lang, itago
            hideMagnifier();
        } else {
            // Kung kaka-on lang, kunin 'yung current mouse/touch position at ipakita agad
            let rect = bookmarkImage.getBoundingClientRect();
            let x, y;
            
            if (isTouchDevice && event.touches) {
                // Kung touch, kunin sa touch data
                 x = event.touches[0].clientX - rect.left;
                 y = event.touches[0].clientY - rect.top;
            } else {
                 // Kung mouse, kunin sa mouse data
                 x = event.clientX - rect.left;
                 y = event.clientY - rect.top;
            }
            
            x = Math.max(0, Math.min(x, rect.width));
            y = Math.max(0, Math.min(y, rect.height));
            updateMagnifier(x, y);
        }
    });

    // MouseMove listener para sa Desktop
    if (!isTouchDevice) {
        bookmarkContainer.addEventListener('mousemove', function(event) {
            // Kung hindi active, huwag pansinin
            if (!isMagnifierActive) return;

            let rect = bookmarkImage.getBoundingClientRect();
            let x = event.clientX - rect.left;
            let y = event.clientY - rect.top;
            
            // I-check kung 'yung mouse ay nasa loob mismo ng image
            if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
                // Kung nasa loob, i-update
                x = Math.max(0, Math.min(x, rect.width)); // Siguraduhin na nasa loob pa rin
                y = Math.max(0, Math.min(y, rect.height));
                updateMagnifier(x, y); 
            } else {
                // Kung wala (nasa container pero wala sa image), itago
                hideMagnifier(); 
            }
        });

        bookmarkContainer.addEventListener('mouseleave', function() {
            // Itago kapag umalis sa buong container, pero active pa rin
            if (isMagnifierActive) {
                hideMagnifier(); 
            }
        });
    }

    // TouchMove listener para sa Mobile
    if (isTouchDevice) {
         bookmarkContainer.addEventListener('touchmove', function(event) {
            event.preventDefault(); 
            // Kung hindi active, huwag pansinin
            if (!isMagnifierActive) return;

            let rect = bookmarkImage.getBoundingClientRect();
            let touch = event.touches[0];
            let x = touch.clientX - rect.left;
            let y = touch.clientY - rect.top;
            
            if (x >= -10 && x <= rect.width + 10 && y >= -10 && y <= rect.height + 10) { // Maluwag na boundary
                 x = Math.max(0, Math.min(x, rect.width));
                 y = Math.max(0, Math.min(y, rect.height));
                 updateMagnifier(x, y); 
            } else {
                 hideMagnifier(); 
            }
        }, { passive: false });
        
        bookmarkContainer.addEventListener('touchend', function() {
            // Itago kapag binitawan, pero active pa rin
            if (isMagnifierActive) {
                hideMagnifier(); 
            }
        });
        bookmarkContainer.addEventListener('touchcancel', function() {
             if (isMagnifierActive) {
                hideMagnifier(); 
            }
        });
    }


    // --- 3. LOGIC PARA SA STORY STEPPER (PREV/NEXT) ---
    btnNext.addEventListener('click', function() {
        if (currentStoryIndex < stories.length - 1) {
            currentStoryIndex++;
            updateStory(currentStoryIndex, 'next');
        }
    });
    
    btnPrev.addEventListener('click', function() {
        if (currentStoryIndex > 0) {
            currentStoryIndex--;
            updateStory(currentStoryIndex, 'prev');
        }
    });

    // --- 4. LOGIC PARA SA PRINT BUTTON ---
    printButton.addEventListener('click', function() {
        const toastBody = actionToastEl.querySelector('.toast-body');
        toastBody.textContent = 'Preparing print preview... Please check browser settings.';
        actionToastEl.classList.remove('text-bg-success', 'text-bg-primary'); // Reset color
        actionToastEl.classList.add('text-bg-primary'); // Use primary color
        actionToast.show();
        
        setTimeout(() => {
             window.print(); 
        }, 500);
    });

    // --- 5. LOGIC PARA SA DOWNLOAD BUTTON ---
     downloadButton.addEventListener('click', function() {
        const toastBody = actionToastEl.querySelector('.toast-body');
        toastBody.textContent = 'Bookmark download started!';
        actionToastEl.classList.remove('text-bg-success', 'text-bg-primary');
        actionToastEl.classList.add('text-bg-success');
        actionToast.show();
    });

    // --- 6. LOGIC PARA SA SHARE BUTTON (COPY + NATIVE) ---
    shareButton.addEventListener('click', async function() {
        const shareData = {
            url: window.location.href // Current URL
        };
        const toastBody = actionToastEl.querySelector('.toast-body');

        try {
            // Check if Web Share API is available
            if (navigator.share) {
                await navigator.share(shareData);
                toastBody.textContent = 'Shared successfully!';
                actionToastEl.classList.remove('text-bg-success', 'text-bg-primary');
                actionToastEl.classList.add('text-bg-success');
                actionToast.show();
            } else {
                // Fallback: Copy to clipboard
                await navigator.clipboard.writeText(shareData.url);
                toastBody.textContent = 'Link copied to clipboard!';
                actionToastEl.classList.remove('text-bg-success', 'text-bg-primary');
                actionToastEl.classList.add('text-bg-success');
                actionToast.show();
            }
        } catch (err) {
            console.error('Share failed:', err);
            toastBody.textContent = 'Could not share or copy link.';
            actionToastEl.classList.remove('text-bg-success', 'text-bg-primary');
        }
    });

    // --- 7. ANIMATION SA PAG-LOAD ---
    gsap.from("[data-animate='fade-in']", {
        opacity: 0,
        y: 30,
        duration: 0.8,
        stagger: 0.2,
        delay: 0.3,
        ease: 'power2.out'
    });
    
    // --- INITIAL STATE ---
    storyTitleCurrent.textContent = stories[0].title;
    storyDescriptionCurrent.textContent = stories[0].description;
    btnPrev.disabled = true; 
    btnNext.disabled = (stories.length <= 1); 

});