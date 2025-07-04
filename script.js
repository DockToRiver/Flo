// ================================================================================================================
// Firebase Initialization (MUST be at the top of the file for module imports and global access)
// ================================================================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDthoHN8UKVn_ahseGGP8O7uA8TT9uOxX8", // <<< MAKE SURE THIS IS YOUR ACTUAL API KEY
    authDomain: "swancommunitymural.firebaseapp.com",
    projectId: "swancommunitymural",
    storageBucket: "swancommunitymural.appspot.com",
    messagingSenderId: "631621436747",
    appId: "1:631621436747:web:4f91af3706cbe8e8b894ce",
    measurementId: "G-K0EZ1B2WBP"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// This is the correct reference for saving/loading the combined mural image
const communityMuralDocRef = doc(db, "communityMural", "masterWall");


// ================================================================================================================
// DOM Content Loaded - All main script logic that depends on the DOM goes inside this SINGLE listener.
// ================================================================================================================

window.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded and parsed. Initializing all script features."); // For debugging

    // --- Gallery Filter Buttons ---
    const filterButtons = document.querySelectorAll('.filter-buttons button');
    const galleryItems = document.querySelectorAll('.gallery .item');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filter = button.getAttribute('data-filter');

            galleryItems.forEach(item => {
                item.style.display = 'none';
                item.classList.remove('animate-in');
            });

            setTimeout(() => {
                let delay = 0;
                galleryItems.forEach(item => {
                    if (filter === 'all' || item.classList.contains(filter)) {
                        setTimeout(() => {
                            item.style.display = 'block';
                            item.classList.add('animate-in');
                        }, delay);
                        delay += 50;
                    }
                });
            }, 50);
        });
    });

    // --- Smooth Scroll ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const section = document.querySelector(this.getAttribute('href'));
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // --- Lightbox Preview ---
    const photoLightbox = document.createElement("div");
    photoLightbox.id = "photo-lightbox";
    Object.assign(photoLightbox.style, {
        display: "none",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.8)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        cursor: "pointer"
    });
    document.body.appendChild(photoLightbox);

    const gallery = document.querySelector(".gallery");

    gallery.querySelectorAll("img.photo").forEach(photo => {
        photo.style.cursor = "pointer";
        photo.addEventListener("click", (e) => {
            e.stopPropagation();

            const clone = document.createElement("img");
            clone.src = photo.getAttribute("data-full") || photo.src;
            Object.assign(clone.style, {
                maxWidth: "90%",
                maxHeight: "90%",
                boxShadow: "0 0 20px rgba(255,255,255,0.7)"
            });

            photoLightbox.innerHTML = "";
            photoLightbox.appendChild(clone);
            photoLightbox.style.display = "flex";
            document.body.style.overflow = "hidden";
        });
    });

    photoLightbox.addEventListener("click", () => {
        photoLightbox.style.display = "none";
        document.body.style.overflow = "auto";
    });

    // --- Project Immersive View ---
    document.querySelectorAll('.project').forEach(thumbnail => {
        thumbnail.addEventListener('click', () => {
            const projectId = thumbnail.dataset.project;
            const projectDetail = document.getElementById(projectId);

            document.querySelectorAll('.project-immersive').forEach(detail => {
                detail.style.display = 'none';
            });

            projectDetail.style.display = 'block';
            document.body.style.overflow = 'hidden';

            const skuttler = document.getElementById("skuttler");
            if (skuttler) skuttler.style.display = "none";

            projectDetail.scrollIntoView({ behavior: 'smooth' });
        });
    });

    document.querySelectorAll('.close-project').forEach(button => {
        button.addEventListener('click', () => {
            button.closest('.project-immersive').style.display = 'none';
            document.body.style.overflow = 'auto';

            const skuttler = document.getElementById("skuttler");
            if (skuttler) skuttler.style.display = "block";
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.project-immersive').forEach(detail => {
                detail.style.display = 'none';
            });
            document.body.style.overflow = 'auto';

            const skuttler = document.getElementById("skuttler");
            if (skuttler) skuttler.style.display = "block";
        }
    });

    // --- Parallax background effect ---
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const bg = document.getElementById('parallax-bg');
        if (bg) {
            bg.style.transform = `translateY(${scrollY * 0.2}px)`;
        }
    });










    
    // ========== SKUTTLER INTERACTIVE ANIMATION ==========

    let isSkuttling = false;
    let midAnimationHoverCount = 0;
    let skuttlerScore = 0;
    let lastEdge = null;
    let lastPosition = { left: 0, top: 0 };
    let moveCount = 0;
    let movesBeforeOffscreen = Math.floor(Math.random() * 6) + 5;
    const scoreEl = document.getElementById("skuttler-score"); 

    const skuttler = document.getElementById("skuttler");
    if (skuttler) {
        const skuttlerImg = skuttler.querySelector("img");
        
        const runFrames = [
            "images/Run 1.png",
            "images/Run 2.png",
            "images/Run 3.png"
        ];

        function placeAtRandomEdge() {
            const edges = ["top", "right", "bottom", "left"];
            const edge = edges[Math.floor(Math.random() * edges.length)];
            lastEdge = edge;

            const viewW = window.innerWidth;
            const viewH = window.innerHeight;

            let x, y;

            switch (edge) {
                case "top":
                    x = Math.random() * (viewW - skuttler.offsetWidth);
                    y = 0 + window.scrollY;
                    break;
                case "bottom":
                    x = Math.random() * (viewW - skuttler.offsetWidth);
                    y = viewH - skuttler.offsetHeight + window.scrollY;
                    break;
                case "left":
                    x = 0 + window.scrollX;
                    y = Math.random() * (viewH - skuttler.offsetHeight) + window.scrollY;
                    break;
                case "right":
                    x = viewW - skuttler.offsetWidth + window.scrollX;
                    y = Math.random() * (viewH - skuttler.offsetHeight) + window.scrollY;
                    break;
            }

            lastPosition.left = x;
            lastPosition.top = y;

            skuttler.style.left = `${x}px`;
            skuttler.style.top = `${y}px`;

            skuttlerImg.src = "images/PeekingFace.png";
        }

        let skuttlerLastOffscreenTime = null;
        let skuttlerPeekCooldown = Math.random() * (8000 - 3000) + 3000;

        function maybePeekBack() {
            const rect = skuttler.getBoundingClientRect();
            const scrollY = window.scrollY || window.pageYOffset;
            const scrollX = window.scrollX || window.pageXOffset;

            const offTop = rect.bottom < 0;
            const offBottom = rect.top > window.innerHeight;
            const offLeft = rect.right < 0;
            const offRight = rect.left > window.innerWidth;

            const isOffscreen = offTop || offBottom || offLeft || offRight;

            if (!isOffscreen) {
                skuttlerLastOffscreenTime = null;
                return;
            }

            const now = Date.now();

            if (!skuttlerLastOffscreenTime) {
                skuttlerLastOffscreenTime = now;
                skuttlerPeekCooldown = Math.random() * (8000 - 3000) + 3000;
                return;
            }

            const timeGone = now - skuttlerLastOffscreenTime;
            if (timeGone < skuttlerPeekCooldown) return;

            skuttlerLastOffscreenTime = null;

            const peekOffset = 20;
            let targetLeft = lastPosition.left;
            let targetTop = lastPosition.top;

            if (lastEdge === "top" || offTop) {
                targetTop = scrollY + peekOffset;
            } else if (lastEdge === "bottom" || offBottom) {
                targetTop = window.scrollY + window.innerHeight - skuttler.offsetHeight - peekOffset;
            } else if (lastEdge === "left" || offLeft) {
                targetLeft = scrollX + peekOffset;
            } else if (lastEdge === "right" || offRight) {
                targetLeft = scrollX + window.innerWidth - skuttler.offsetWidth - peekOffset;
            }

            const distX = Math.abs(skuttler.offsetLeft - targetLeft);
            const distY = Math.abs(skuttler.offsetTop - targetTop);
            const maxDist = Math.max(distX, distY);
            const duration = Math.min(Math.max(maxDist * 0.008, 1.5), 4);

            skuttler.style.transition = `top ${duration}s ease, left ${duration}s ease`;
            skuttler.style.left = `${targetLeft}px`;
            skuttler.style.top = `${targetTop}px`;
        }

        function schedulePeekBack() {
            const delay = Math.random() * (8000 - 3000) + 3000;
            setTimeout(() => {
                maybePeekBack();
                schedulePeekBack();
            }, delay);
        }

        schedulePeekBack();

        function startSkuttle(force = false) {
            if (isSkuttling && !force) return;

            if (force) {
                if (skuttler.__moveTimeout) {
                    clearTimeout(skuttler.__moveTimeout);
                    skuttler.__moveTimeout = null;
                }
                if (skuttler.__runInterval) {
                    clearInterval(skuttler.__runInterval);
                    skuttler.__runInterval = null;
                }
                skuttlerImg.src = "images/PeekingFace.png";
                isSkuttling = false;
            }

            if (isSkuttling) return;
            isSkuttling = true;

            const currentX = skuttler.offsetLeft;
            const currentY = skuttler.offsetTop;
            const pageHeight = document.body.scrollHeight;
            const screenWidth = window.innerWidth;
            const maxX = screenWidth - skuttler.offsetWidth;

            const biasChance = Math.random();
            let targetX;

            if (biasChance < 0.35) {
                targetX = Math.random() * (screenWidth * 0.4);
            } else if (biasChance < 0.7) {
                targetX = screenWidth * 0.6 + Math.random() * (screenWidth * 0.4);
            } else {
                targetX = screenWidth * 0.4 + Math.random() * (screenWidth * 0.2);
            }

            targetX = Math.max(0, Math.min(maxX, targetX));

            const deltaY = (Math.random() - 0.4) * 600;
            let targetY = currentY + deltaY;
            targetY = Math.max(0, Math.min(pageHeight - skuttler.offsetHeight, targetY));

            skuttlerImg.style.transform = targetX > currentX ? "scaleX(-1)" : "scaleX(1)";

            let i = 0;
            skuttler.__runInterval = setInterval(() => {
                skuttlerImg.src = runFrames[i % runFrames.length];
                i++;
            }, 100);

            const duration = 1.5;
            skuttler.style.transition = `top ${duration}s ease, left ${duration}s ease`;
            skuttler.style.left = `${targetX}px`;
            skuttler.style.top = `${targetY}px`;

            if (skuttler.__moveTimeout) {
                clearTimeout(skuttler.__moveTimeout);
            }
            skuttler.__moveTimeout = setTimeout(() => {
                if (skuttler.__runInterval) {
                    clearInterval(skuttler.__runInterval);
                    skuttler.__runInterval = null;
                }
                skuttlerImg.src = "images/PeekingFace.png";
                lastPosition.left = targetX;
                lastPosition.top = targetY;

                // Logic to potentially move offscreen
                moveCount++;
                if (moveCount >= movesBeforeOffscreen) {
                    movesBeforeOffscreen = Math.floor(Math.random() * 6) + 5;
                    moveCount = 0;

                    const exitEdge = Math.random() < 0.5 ? "horizontal" : "vertical";
                    let finalX, finalY;
                    let exitDuration = Math.random() * (2 - 0.5) + 0.5;

                    if (exitEdge === "horizontal") {
                        finalX = Math.random() < 0.5 ? -skuttler.offsetWidth : screenWidth + skuttler.offsetWidth;
                        finalY = skuttler.offsetTop;
                        skuttlerImg.style.transform = finalX > skuttler.offsetLeft ? "scaleX(-1)" : "scaleX(1)";
                    } else {
                        finalY = Math.random() < 0.5 ? -skuttler.offsetHeight : pageHeight + skuttler.offsetHeight;
                        finalX = skuttler.offsetLeft;
                    }
                    skuttler.style.transition = `top ${exitDuration}s ease, left ${exitDuration}s ease`;
                    skuttler.style.left = `${finalX}px`;
                    skuttler.style.top = `${finalY}px`;

                    setTimeout(() => {
                        isSkuttling = false;
                    }, exitDuration * 1000 + 100);
                } else {
                    setTimeout(() => {
                        isSkuttling = false;
                    }, 10);
                }
            }, duration * 1000);
        }

        skuttler.addEventListener("mouseenter", () => {
            console.log('Mouse ENTER. isSkuttling:', isSkuttling);
            const isMidRun = isSkuttling;
            if (isMidRun) {
                midAnimationHoverCount++;
                updateskuttlerScore(2);
            } else {
                updateskuttlerScore(1);
            }
            startSkuttle(true);
        });

        skuttler.addEventListener("touchstart", () => {
            console.log('Touch START. isSkuttling:', isSkuttling);
            const isMidRun = isSkuttling;
            if (isMidRun) {
                midAnimationHoverCount++;
                updateskuttlerScore(2);
            } else {
                updateskuttlerScore(1);
            }
            startSkuttle(true);
        });

        placeAtRandomEdge();
        setTimeout(() => startSkuttle(), 2000);
    } // End of if (skuttler)

    function updateskuttlerScore(points) {
        skuttlerScore += points;
        const scoreEl = document.getElementById("skuttler-score");
        if (scoreEl) {
            scoreEl.textContent = `${skuttlerScore} pts`;
            if (points >= 2) {
                scoreEl.classList.add("pulse");
                setTimeout(() => scoreEl.classList.remove("pulse"), 600);
            }
        }
    }

    if (scoreEl) {
        scoreEl.addEventListener('click', () => {
            if (scoreEl.classList.contains('poof-away') || scoreEl.classList.contains('fading-in')) {
                return;
            }
            scoreEl.classList.add('poof-away');
            setTimeout(() => {
                scoreEl.classList.remove('poof-away');
                scoreEl.classList.add('hidden');
                scoreEl.style.transform = '';

                setTimeout(() => {
                    const corners = [
                        { bottom: '20px', right: '20px', top: '', left: '' },
                        { bottom: '20px', left: '20px', top: '', right: '' },
                        { top: '20px', right: '20px', bottom: '', left: '' },
                        { top: '20px', left: '20px', bottom: '', right: '' }
                    ];

                    const currentPosition = {
                        bottom: scoreEl.style.bottom,
                        right: scoreEl.style.right,
                        top: scoreEl.style.top,
                        left: scoreEl.style.left
                    };

                    let newCorner;
                    do {
                        newCorner = corners[Math.floor(Math.random() * corners.length)];
                    } while (
                        (newCorner.bottom === currentPosition.bottom && newCorner.right === currentPosition.right && newCorner.top === currentPosition.top && newCorner.left === currentPosition.left)
                    );

                    scoreEl.style.bottom = '';
                    scoreEl.style.right = '';
                    scoreEl.style.top = '';
                    scoreEl.style.left = '';

                    scoreEl.style.bottom = newCorner.bottom;
                    scoreEl.style.right = newCorner.right;
                    scoreEl.style.top = newCorner.top;
                    scoreEl.style.left = newCorner.left;

                    void scoreEl.offsetWidth;

                    scoreEl.classList.remove('hidden');
                    scoreEl.classList.add('fading-in');

                    setTimeout(() => {
                        scoreEl.classList.remove('fading-in');
                    }, 800);

                }, 2000);
            }, 400);
        });
    }












    // ========== MURAL CANVAS INTERACTION ==========
    const canvasContainer = document.getElementById("canvas-container");
    const muralCanvas = document.getElementById("mural-canvas");
    const userCanvas = document.getElementById("user-canvas");
    const muralCtx = muralCanvas.getContext("2d");
    const userCtx = userCanvas.getContext("2d");
    const communityWall = document.getElementById('community-wall');

    const colorPicker = document.getElementById("color-picker");
    const opacityRange = document.getElementById("opacity-range");
    const sizeRange = document.getElementById("size-range");

    const undoBtn = document.getElementById("undo-btn");
    const saveBtn = document.getElementById("save-btn");
    const clearBtn = document.getElementById("clear-btn");
    const fullscreenBtn = document.getElementById("fullscreen-btn");
    const redoBtn = document.getElementById("redo-btn"); // Get the new redo button

    console.log("Mural buttons initialized:");
    console.log("undoBtn:", undoBtn);
    console.log("redoBtn:", redoBtn); // Log the redo button
    console.log("saveBtn:", saveBtn);
    console.log("clearBtn:", clearBtn);
    console.log("fullscreenBtn:", fullscreenBtn);

    const offCanvas = document.createElement("canvas");
    const offCtx = offCanvas.getContext("2d");

    let strokes = []; // Stores {image, opacity} for undo functionality (local to user's session)
    let redoStack = []; // Stores undone strokes for redo functionality
    let lastLoadedMuralImage = null; // Stores the base image from Firebase

    function resizeCanvas() {
        const rect = canvasContainer.getBoundingClientRect();
        [muralCanvas, userCanvas].forEach(c => {
            c.width = rect.width;
            c.height = rect.height;
        });
        offCanvas.width = muralCanvas.width;
        offCanvas.height = muralCanvas.height;

        redrawCombinedMural(); 
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let painting = false;
    let lastX = 0;
    let lastY = 0;

    // Default values
    let color = colorPicker ? colorPicker.value : "#000000";
    let brushOpacity = opacityRange ? parseFloat(opacityRange.value) : 1;
    let size = sizeRange ? parseInt(sizeRange.value) : 5;

    // Event listeners for controls - added checks for element existence
    if (colorPicker) colorPicker.addEventListener("input", e => color = e.target.value);
    if (opacityRange) opacityRange.addEventListener("input", e => brushOpacity = parseFloat(e.target.value));
    if (sizeRange) sizeRange.addEventListener("input", e => size = parseInt(e.target.value));

    function startDraw(e) {
        painting = true;
        const rect = userCanvas.getBoundingClientRect();
        lastX = e.clientX - rect.left;
        lastY = e.clientY - rect.top;

        offCtx.clearRect(0, 0, offCanvas.width, offCanvas.height);
        offCtx.strokeStyle = color;
        offCtx.lineWidth = size;
        offCtx.lineCap = "round";
        offCtx.lineJoin = "round";
        offCtx.beginPath();
        offCtx.moveTo(lastX, lastY);
    }

    // MODIFIED draw
    function draw(e) {
        if (!painting) return;

        const rect = userCanvas.getBoundingClientRect();
        
        // Calculate scaling factors for current event
        const scaleX = userCanvas.width / rect.width;
        const scaleY = userCanvas.height / rect.height;

        // Apply scaling to get correct canvas coordinates
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        offCtx.lineTo(x, y);
        offCtx.stroke();

        userCtx.clearRect(0, 0, userCanvas.width, userCanvas.height);
        userCtx.globalAlpha = brushOpacity;
        userCtx.drawImage(offCanvas, 0, 0);
        userCtx.globalAlpha = 1;

        lastX = x;
        lastY = y;
    }

    // !!! IMPORTANT CHANGE IN stopDraw !!!
    function stopDraw() {
        if (!painting) return;
        painting = false;

        // Convert the completed stroke from offCanvas into an image
        const img = new Image();
        img.onload = () => {
            strokes.push({ image: img, opacity: brushOpacity }); // Add to local undo history
            redoStack = []; // Clear redoStack when a new stroke is drawn, as any future undone actions are now invalid
            redrawCombinedMural(); // Redraw the main canvas to include this new stroke
        };
        img.src = offCanvas.toDataURL();

        // Clear preview layer and offscreen layer for next stroke
        userCtx.clearRect(0, 0, userCanvas.width, userCanvas.height);
        offCtx.clearRect(0, 0, offCanvas.width, offCanvas.height);
    }

    // Function to combine the base mural from Firebase with the local, unsaved strokes
    function redrawCombinedMural() {
        muralCtx.clearRect(0, 0, muralCanvas.width, muralCanvas.height); // Clear everything on main canvas

        // First, draw the BASE mural image that came from Firebase (if it exists)
        if (lastLoadedMuralImage) {
            muralCtx.drawImage(lastLoadedMuralImage, 0, 0, muralCanvas.width, muralCanvas.height);
        }

        // Now, draw all the local, unsaved strokes on top
        for (const s of strokes) {
            muralCtx.globalAlpha = s.opacity;
            muralCtx.drawImage(s.image, 0, 0);
        }
        muralCtx.globalAlpha = 1;
    }

    // Mouse events for drawing
    userCanvas.addEventListener("mousedown", startDraw);
    userCanvas.addEventListener("mousemove", draw);
    userCanvas.addEventListener("mouseup", stopDraw);
    userCanvas.addEventListener("mouseout", stopDraw);

    // Touch events for drawing
    userCanvas.addEventListener("touchstart", e => {
        e.preventDefault();
        startDraw(e.touches[0]);
    });
    userCanvas.addEventListener("touchmove", e => {
        e.preventDefault();
        draw(e.touches[0]);
    });
    userCanvas.addEventListener("touchend", stopDraw);
    userCanvas.addEventListener("touchcancel", stopDraw);

    // --- Mural Control Buttons ---
    if (undoBtn) {
        undoBtn.addEventListener("click", () => {
            if (strokes.length > 0) {
                const undoneStroke = strokes.pop(); // Remove from strokes
                redoStack.push(undoneStroke);      // Add to redoStack
                redrawCombinedMural();             // Redraw
                console.log("Undo: strokes length", strokes.length, "redoStack length", redoStack.length);
            } else {
                console.log("No local strokes to undo.");
            }
        });
    }

    // New Redo button logic
    if (redoBtn) {
        redoBtn.addEventListener("click", () => {
            if (redoStack.length > 0) {
                const redoneStroke = redoStack.pop(); // Remove from redoStack
                strokes.push(redoneStroke);          // Add back to strokes
                redrawCombinedMural();               // Redraw
                console.log("Redo: strokes length", strokes.length, "redoStack length", redoStack.length);
            } else {
                console.log("No strokes to redo.");
            }
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            saveMuralToFirebase();
        });
    }

   // Modified clearBtn to also clear redoStack
    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to clear your current unsaved drawing?")) {
                userCtx.clearRect(0, 0, userCanvas.width, userCanvas.height); 
                strokes = [];      // Clear all local strokes
                redoStack = [];    // Clear redoStack as well
                redrawCombinedMural(); 
                console.log("Clear: All local history cleared.");
            }
        });
    }

    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            communityWall.classList.toggle('fullscreen');
            
            if (communityWall.classList.contains('fullscreen')) {
                fullscreenBtn.textContent = 'Exit Immersive View';
                document.body.style.overflow = 'hidden';
            } else {
                fullscreenBtn.textContent = 'Immersive View';
                document.body.style.overflow = '';
            }
        });
    }

   // Modified saveMuralToFirebase to also clear redoStack
    function saveMuralToFirebase() {
        const dataUrl = muralCanvas.toDataURL("image/png");
        setDoc(communityMuralDocRef, {
            image: dataUrl,
            timestamp: Date.now()
        })
        .then(() => {
            alert("Your contribution has been saved to the community wall!");
            strokes = [];      // Clear local strokes
            redoStack = [];    // Clear redoStack after saving, as the work is now part of the base mural
            redrawCombinedMural(); 
            console.log("Saved: Local history cleared.");
        })
        .catch((error) => {
            console.error("Error saving mural: ", error);
            alert("Failed to save your contribution. Please try again.");
        });
    }

   // Modified onSnapshot to also clear redoStack
    onSnapshot(communityMuralDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const img = new Image();
            img.onload = () => {
                lastLoadedMuralImage = img; 
                strokes = [];      // Clear local strokes
                redoStack = [];    // Clear redoStack on new mural load, as it's a new base state
                redrawCombinedMural(); 
                console.log("Mural updated from Firebase. Local history cleared.");
            };
            img.src = data.image;
        } else {
            console.log("No existing mural found. Starting fresh.");
            muralCtx.clearRect(0, 0, muralCanvas.width, muralCanvas.height);
            userCtx.clearRect(0, 0, userCanvas.width, userCanvas.height);
            lastLoadedMuralImage = null;
            strokes = [];
            redoStack = []; // Clear redoStack on fresh start
        }
    }, (error) => {
        console.error("Error listening to mural updates: ", error);
    });

}); // End of the SINGLE window.addEventListener("DOMContentLoaded")