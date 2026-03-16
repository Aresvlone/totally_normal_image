/**
 * TotallyNormalImage — Main Application
 * Handles UI interactions, file handling, and orchestrates
 * the steganography and crypto modules.
 */

(function () {
    'use strict';

    // ============================================================
    //  DOM Elements
    // ============================================================
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // Navbar
    const navbar = $('#navbar');
    const mobileMenuBtn = $('#mobileMenuBtn');
    const navLinks = $('.nav-links');

    // Mode Toggle
    const modeToggle = $('#modeToggle');
    const encodeModeBtn = $('#encodeModeBtn');
    const decodeModeBtn = $('#decodeModeBtn');
    const encodePanel = $('#encodePanel');
    const decodePanel = $('#decodePanel');

    // Hide Type Toggle
    const hideTypeToggle = $('#hideTypeToggle');
    const hideMessageBtn = $('#hideMessageBtn');
    const hideFileBtn = $('#hideFileBtn');
    const messageInputGroup = $('#messageInputGroup');
    const fileInputGroup = $('#fileInputGroup');

    // Encode Elements
    const encodeUploadZone = $('#encodeUploadZone');
    const encodeImageInput = $('#encodeImageInput');
    const encodeUploadContent = $('#encodeUploadContent');
    const encodePreview = $('#encodePreview');
    const encodePreviewImg = $('#encodePreviewImg');
    const removeEncodeImage = $('#removeEncodeImage');
    const encodeImageInfo = $('#encodeImageInfo');
    const secretMessage = $('#secretMessage');
    const charCount = $('#charCount');
    const maxChars = $('#maxChars');
    const encodePassword = $('#encodePassword');
    const toggleEncodePassword = $('#toggleEncodePassword');
    const encodeBtn = $('#encodeBtn');

    // Secret File Elements
    const secretFileUploadZone = $('#secretFileUploadZone');
    const secretFileInput = $('#secretFileInput');
    const secretFileUploadContent = $('#secretFileUploadContent');
    const secretFilePreview = $('#secretFilePreview');
    const secretFileName = $('#secretFileName');
    const secretFileSize = $('#secretFileSize');
    const removeSecretFile = $('#removeSecretFile');
    const fileCapacityInfo = $('#fileCapacityInfo');

    // Encode Output
    const encodePlaceholder = $('#encodePlaceholder');
    const encodeResult = $('#encodeResult');
    const encodedCanvas = $('#encodedCanvas');
    const encodeResultInfo = $('#encodeResultInfo');
    const downloadBtn = $('#downloadBtn');
    const comparisonOriginal = $('#comparisonOriginal');
    const comparisonEncoded = $('#comparisonEncoded');

    // Decode Elements
    const decodeUploadZone = $('#decodeUploadZone');
    const decodeImageInput = $('#decodeImageInput');
    const decodeUploadContent = $('#decodeUploadContent');
    const decodePreview = $('#decodePreview');
    const decodePreviewImg = $('#decodePreviewImg');
    const removeDecodeImage = $('#removeDecodeImage');
    const decodeImageInfo = $('#decodeImageInfo');
    const decodePassword = $('#decodePassword');
    const toggleDecodePassword = $('#toggleDecodePassword');
    const decodeBtn = $('#decodeBtn');

    // Decode Output
    const decodePlaceholder = $('#decodePlaceholder');
    const decodeResult = $('#decodeResult');
    const decodeResultBadge = $('#decodeResultBadge');
    const decodeMessageResult = $('#decodeMessageResult');
    const decodeFileResult = $('#decodeFileResult');
    const decodedMessage = $('#decodedMessage');
    const copyDecodedBtn = $('#copyDecodedBtn');
    const decodeResultInfo = $('#decodeResultInfo');
    const decodedFileName = $('#decodedFileName');
    const decodedFileSize = $('#decodedFileSize');
    const downloadDecodedFileBtn = $('#downloadDecodedFileBtn');

    // Loading
    const loadingOverlay = $('#loadingOverlay');
    const loadingText = $('#loadingText');

    // Toast
    const toastContainer = $('#toastContainer');

    // ============================================================
    //  State
    // ============================================================
    let encodeImageLoaded = null;
    let encodeFileBlob = null;
    let decodeImageLoaded = null;
    let decodeFileBlob = null;
    let hideType = 'message'; // 'message' or 'file'
    let secretFileData = null; // { name: string, bytes: Uint8Array }
    let decodedFileData = null; // { name: string, bytes: Uint8Array }

    // ============================================================
    //  WebGL Neon Beam Background (Three.js)
    // ============================================================
    function initWebGLBackground() {
        const container = document.getElementById('webgl-bg');
        if (!container || typeof THREE === 'undefined') return;

        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const renderer = new THREE.WebGLRenderer({ alpha: false });

        const vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            uniform float u_time;
            uniform vec2 u_resolution;
            varying vec2 vUv;

            void main() {
                vec2 uv = vUv;
                float aspect = u_resolution.x / u_resolution.y;

                vec3 color = vec3(0.0);

                float x = uv.x;

                float y = 0.5 + 0.1 * sin(x * 6.0 + u_time * 1.5) + 0.05 * sin(x * 12.0 + u_time * 2.5);
                float dist = abs(uv.y - y);
                float glow = 0.02 / (dist + 0.001);

                float y2 = 0.5 + 0.12 * sin(x * 6.0 + u_time * 1.5 + 0.5);
                float dist2 = abs(uv.y - y2);
                float glow2 = 0.02 / (dist2 + 0.002);

                vec3 beamColor = 0.5 + 0.5 * cos(u_time * 0.5 + x * 3.0 + vec3(0, 2, 4));

                color += beamColor * glow * 1.5;
                color += beamColor * glow2 * 0.8;

                color += vec3(0.0, 0.05, 0.1) * (1.0 - uv.y) * 0.5;

                gl_FragColor = vec4(color, 1.0);
            }
        `;

        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                u_time: { value: 0.0 },
                u_resolution: { value: new THREE.Vector2() }
            }
        });

        const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
        scene.add(plane);

        function handleResize() {
            const w = window.innerWidth;
            const h = window.innerHeight;
            renderer.setSize(w, h);
            renderer.setPixelRatio(window.devicePixelRatio);
            material.uniforms.u_resolution.value.set(w, h);
        }

        container.appendChild(renderer.domElement);
        handleResize();
        window.addEventListener('resize', handleResize);

        function animate() {
            requestAnimationFrame(animate);
            material.uniforms.u_time.value += 0.01;
            renderer.render(scene, camera);
        }
        animate();
    }

    // ============================================================
    //  Pixel Grid Visualization (Hero) — Pixelate / Depixelate
    // ============================================================
    function initPixelGrid() {
        const grid = $('#pixelGrid');
        if (!grid) return;

        const cols = 12;
        const rows = 12;
        const total = cols * rows;

        // Generate a visually interesting "source image" palette
        // — a gradient with warm/cool zones like a real photo
        const sourceColors = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const nx = c / (cols - 1);  // 0..1
                const ny = r / (rows - 1);  // 0..1
                const hue = 20 + nx * 180 + Math.sin(ny * 3) * 30; // warm→cool sweep
                const sat = 50 + Math.sin(nx * 4 + ny * 2) * 25;
                const lit = 35 + ny * 20 + Math.cos(nx * 3) * 10;
                sourceColors.push({ h: hue, s: sat, l: lit });
            }
        }

        // Scrambled colors — random flat color per pixel
        const scrambledColors = sourceColors.map(() => ({
            h: Math.random() * 360,
            s: 15 + Math.random() * 20,
            l: 20 + Math.random() * 15
        }));

        // Build DOM pixels
        const pixels = [];
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < total; i++) {
            const pixel = document.createElement('div');
            pixel.className = 'pixel';
            fragment.appendChild(pixel);
            pixels.push(pixel);
        }
        grid.appendChild(fragment);

        // Animation state
        const cycleDuration = 4000; // ms for one full resolve/pixelate half-cycle
        const pauseDuration = 1200; // ms pause when fully resolved
        const totalCycle = cycleDuration * 2 + pauseDuration * 2;
        let startTime = performance.now();

        function lerp(a, b, t) { return a + (b - a) * t; }

        function hslToString(h, s, l) {
            return `hsl(${h.toFixed(0)}, ${s.toFixed(0)}%, ${l.toFixed(0)}%)`;
        }

        // Easing — smooth step
        function smoothstep(t) {
            t = Math.max(0, Math.min(1, t));
            return t * t * (3 - 2 * t);
        }

        function animate(now) {
            const elapsed = (now - startTime) % totalCycle;
            // Phase timeline:
            // 0..cycleDuration:                    depixelating (scrambled → resolved)
            // cycleDuration..cycleDuration+pause:   hold resolved
            // cycleDuration+pause..cycleDuration*2+pause: pixelating (resolved → scrambled)
            // cycleDuration*2+pause..totalCycle:    hold scrambled

            for (let i = 0; i < total; i++) {
                const r = Math.floor(i / cols);
                const c = i % cols;

                // Diagonal wave delay: pixels in top-left resolve first
                const diagNorm = (r + c) / (rows + cols - 2); // 0..1
                const waveDelay = diagNorm * cycleDuration * 0.6;

                let t; // 0 = scrambled, 1 = resolved

                if (elapsed < cycleDuration) {
                    // Depixelating phase (scrambled → resolved)
                    const localT = (elapsed - waveDelay) / (cycleDuration * 0.6);
                    t = smoothstep(Math.max(0, Math.min(1, localT)));
                } else if (elapsed < cycleDuration + pauseDuration) {
                    // Hold resolved
                    t = 1;
                } else if (elapsed < cycleDuration * 2 + pauseDuration) {
                    // Pixelating phase (resolved → scrambled)
                    const phaseStart = cycleDuration + pauseDuration;
                    const localT = ((elapsed - phaseStart) - waveDelay) / (cycleDuration * 0.6);
                    t = 1 - smoothstep(Math.max(0, Math.min(1, localT)));
                } else {
                    // Hold scrambled
                    t = 0;
                }

                const src = sourceColors[i];
                const scr = scrambledColors[i];
                const h = lerp(scr.h, src.h, t);
                const s = lerp(scr.s, src.s, t);
                const l = lerp(scr.l, src.l, t);

                pixels[i].style.backgroundColor = hslToString(h, s, l);

                // Scale effect: pixels "pop" when resolving
                const scale = 0.7 + 0.3 * t;
                const radius = lerp(50, 22, t); // circle → slightly rounded square
                pixels[i].style.transform = `scale(${scale.toFixed(3)})`;
                pixels[i].style.borderRadius = `${radius.toFixed(0)}%`;

                // Glow on resolved pixels
                if (t > 0.85) {
                    const glowOpacity = ((t - 0.85) / 0.15) * 0.5;
                    pixels[i].style.boxShadow = `0 0 6px hsla(${src.h.toFixed(0)}, 70%, 60%, ${glowOpacity.toFixed(2)})`;
                } else {
                    pixels[i].style.boxShadow = 'none';
                }
            }

            requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);
    }

    // ============================================================
    //  Navigation
    // ============================================================
    function initNavigation() {
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        });

        const sections = $$('section, #hero');
        const navLinksAll = $$('.nav-link');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    navLinksAll.forEach(link => {
                        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                    });
                }
            });
        }, { threshold: 0.3 });

        sections.forEach(section => observer.observe(section));

        mobileMenuBtn.addEventListener('click', () => {
            mobileMenuBtn.classList.toggle('active');
            navLinks.classList.toggle('open');
        });

        navLinksAll.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuBtn.classList.remove('active');
                navLinks.classList.remove('open');
            });
        });
    }

    // ============================================================
    //  Mode Toggle (Encode / Decode)
    // ============================================================
    function initModeToggle() {
        encodeModeBtn.addEventListener('click', () => switchMode('encode'));
        decodeModeBtn.addEventListener('click', () => switchMode('decode'));
    }

    function switchMode(mode) {
        encodeModeBtn.classList.toggle('active', mode === 'encode');
        decodeModeBtn.classList.toggle('active', mode === 'decode');
        encodePanel.classList.toggle('active', mode === 'encode');
        decodePanel.classList.toggle('active', mode === 'decode');
        modeToggle.setAttribute('data-active', mode);
    }

    // ============================================================
    //  Hide Type Toggle (Message / File)
    // ============================================================
    function initHideTypeToggle() {
        hideMessageBtn.addEventListener('click', () => switchHideType('message'));
        hideFileBtn.addEventListener('click', () => switchHideType('file'));
    }

    function switchHideType(type) {
        hideType = type;
        hideMessageBtn.classList.toggle('active', type === 'message');
        hideFileBtn.classList.toggle('active', type === 'file');
        messageInputGroup.style.display = type === 'message' ? '' : 'none';
        fileInputGroup.style.display = type === 'file' ? '' : 'none';
        hideTypeToggle.setAttribute('data-active', type);
        updateEncodeButton();
        updateFileCapacityInfo();
    }

    // ============================================================
    //  Image Upload Handling
    // ============================================================
    function setupUploadZone(zone, input, contentEl, previewEl, previewImg, removeBtn, imageInfoEl, onLoad) {
        zone.addEventListener('click', (e) => {
            if (e.target === removeBtn || removeBtn.contains(e.target)) return;
            input.click();
        });

        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('dragover');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('dragover');
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                handleImageFile(file, contentEl, previewEl, previewImg, imageInfoEl, onLoad);
            } else {
                showToast('Please drop a valid image file.', 'error');
            }
        });

        input.addEventListener('change', () => {
            const file = input.files[0];
            if (file) {
                handleImageFile(file, contentEl, previewEl, previewImg, imageInfoEl, onLoad);
            }
        });

        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            contentEl.style.display = '';
            previewEl.style.display = 'none';
            input.value = '';
            onLoad(null, null);
        });
    }

    function handleImageFile(file, contentEl, previewEl, previewImg, imageInfoEl, onLoad) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                previewImg.src = e.target.result;
                contentEl.style.display = 'none';
                previewEl.style.display = 'block';
                const fileSize = (file.size / 1024).toFixed(1);
                imageInfoEl.textContent = `${img.width} × ${img.height}px  •  ${fileSize} KB  •  ${file.type.split('/')[1].toUpperCase()}`;
                onLoad(img, file);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    async function loadFileToCanvas(file) {
        const canvas = document.createElement('canvas');
        try {
            const bitmap = await createImageBitmap(file, {
                colorSpaceConversion: 'none',
                premultiplyAlpha: 'none'
            });
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(bitmap, 0, 0);
            bitmap.close();
        } catch (e) {
            const img = await new Promise((resolve, reject) => {
                const i = new Image();
                i.onload = () => resolve(i);
                i.onerror = reject;
                i.src = URL.createObjectURL(file);
            });
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(img.src);
        }
        return canvas;
    }

    // ============================================================
    //  Secret File Upload Handling
    // ============================================================
    function initSecretFileUpload() {
        secretFileUploadZone.addEventListener('click', (e) => {
            if (e.target === removeSecretFile || removeSecretFile.contains(e.target)) return;
            secretFileInput.click();
        });

        secretFileUploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            secretFileUploadZone.classList.add('dragover');
        });

        secretFileUploadZone.addEventListener('dragleave', () => {
            secretFileUploadZone.classList.remove('dragover');
        });

        secretFileUploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            secretFileUploadZone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) {
                loadSecretFile(file);
            }
        });

        secretFileInput.addEventListener('change', () => {
            const file = secretFileInput.files[0];
            if (file) loadSecretFile(file);
        });

        removeSecretFile.addEventListener('click', (e) => {
            e.stopPropagation();
            secretFileData = null;
            secretFileUploadContent.style.display = '';
            secretFilePreview.style.display = 'none';
            secretFileInput.value = '';
            updateEncodeButton();
        });
    }

    function loadSecretFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            secretFileData = {
                name: file.name,
                bytes: new Uint8Array(e.target.result)
            };
            secretFileName.textContent = file.name;
            secretFileSize.textContent = formatFileSize(file.size);
            secretFileUploadContent.style.display = 'none';
            secretFilePreview.style.display = 'block';
            updateEncodeButton();
            updateFileCapacityInfo();
        };
        reader.readAsArrayBuffer(file);
    }

    function formatFileSize(bytes) {
        if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return bytes + ' B';
    }

    function updateFileCapacityInfo() {
        if (!encodeImageLoaded) {
            fileCapacityInfo.textContent = 'Select a cover image to see max file size';
            return;
        }
        const capacity = Steganography.calculateCapacity(encodeImageLoaded.width, encodeImageLoaded.height);
        // Subtract header overhead: "SC1:F:P:" + filename + \0 ≈ ~30 bytes typical
        const usable = Math.max(0, capacity - 50);
        fileCapacityInfo.textContent = `Max file size: ~${formatFileSize(usable)}`;
    }

    // ============================================================
    //  Encode Flow
    // ============================================================
    function initEncodeFlow() {
        setupUploadZone(
            encodeUploadZone, encodeImageInput,
            encodeUploadContent, encodePreview, encodePreviewImg,
            removeEncodeImage, encodeImageInfo,
            (img, file) => {
                encodeImageLoaded = img;
                encodeFileBlob = file;
                if (img) {
                    if (file && file.type && file.type !== 'image/png') {
                        showToast(
                            'Your cover image is ' + file.type.split('/')[1].toUpperCase() +
                            '. The encoded output will be saved as lossless PNG to preserve the hidden data.',
                            'info'
                        );
                    }
                    const capacity = Steganography.calculateCapacity(img.width, img.height);
                    maxChars.textContent = capacity.toLocaleString();
                } else {
                    maxChars.textContent = '—';
                }
                updateEncodeButton();
                updateFileCapacityInfo();
                encodePlaceholder.style.display = '';
                encodeResult.style.display = 'none';
            }
        );

        secretMessage.addEventListener('input', () => {
            charCount.textContent = secretMessage.value.length;
            updateEncodeButton();
        });

        toggleEncodePassword.addEventListener('click', () => {
            const isPassword = encodePassword.type === 'password';
            encodePassword.type = isPassword ? 'text' : 'password';
            toggleEncodePassword.querySelector('.eye-icon').textContent = isPassword ? '🔒' : '👁️';
        });

        encodeBtn.addEventListener('click', performEncode);
        downloadBtn.addEventListener('click', downloadEncodedImage);
    }

    function updateEncodeButton() {
        const hasImage = encodeImageLoaded !== null;
        if (hideType === 'message') {
            const hasMessage = secretMessage.value.trim().length > 0;
            encodeBtn.disabled = !(hasImage && hasMessage);
        } else {
            encodeBtn.disabled = !(hasImage && secretFileData !== null);
        }
    }

    async function performEncode() {
        if (!encodeImageLoaded || !encodeFileBlob) return;

        if (hideType === 'message') {
            await performEncodeMessage();
        } else {
            await performEncodeFile();
        }
    }

    async function performEncodeMessage() {
        if (!secretMessage.value.trim()) return;

        showLoading('Encoding message into image...');

        try {
            let message = secretMessage.value;
            const password = encodePassword.value.trim();
            let isEncrypted = false;

            if (password) {
                showLoading('Encrypting with AES-256...');
                message = await CryptoModule.encrypt(message, password);
                isEncrypted = true;
            }

            await new Promise(r => setTimeout(r, 100));

            showLoading('Loading image pixels...');
            const sourceCanvas = await loadFileToCanvas(encodeFileBlob);

            showLoading('Embedding in pixel LSBs...');
            const result = Steganography.encode(sourceCanvas, message, isEncrypted);

            if (!result.success) {
                hideLoading();
                showToast(result.error, 'error');
                return;
            }

            showEncodeResult(result, `
                Image: ${result.stats.imageWidth} x ${result.stats.imageHeight}px<br>
                Message: ${result.stats.messageLengthChars} characters<br>
                Capacity used: ${result.stats.capacityUsed}%<br>
                Encrypted: ${result.stats.isEncrypted ? 'Yes (AES-256-GCM)' : 'No'}
            `);

            hideLoading();
            showToast('Message encoded successfully!', 'success');
        } catch (err) {
            hideLoading();
            showToast('Encoding failed: ' + err.message, 'error');
            console.error(err);
        }
    }

    async function performEncodeFile() {
        if (!secretFileData) return;

        showLoading('Encoding file into image...');

        try {
            let fileBytes = secretFileData.bytes;
            const password = encodePassword.value.trim();
            let isEncrypted = false;

            if (password) {
                showLoading('Encrypting file with AES-256...');
                // Convert bytes to base64, encrypt, then convert back to bytes
                const base64 = arrayBufferToBase64(fileBytes);
                const encryptedStr = await CryptoModule.encrypt(base64, password);
                fileBytes = new Uint8Array(encryptedStr.length);
                for (let i = 0; i < encryptedStr.length; i++) {
                    fileBytes[i] = encryptedStr.charCodeAt(i);
                }
                isEncrypted = true;
            }

            await new Promise(r => setTimeout(r, 100));

            showLoading('Loading image pixels...');
            const sourceCanvas = await loadFileToCanvas(encodeFileBlob);

            showLoading('Embedding file in pixel LSBs...');
            const result = Steganography.encodeFile(sourceCanvas, secretFileData.name, fileBytes, isEncrypted);

            if (!result.success) {
                hideLoading();
                showToast(result.error, 'error');
                return;
            }

            showEncodeResult(result, `
                Image: ${result.stats.imageWidth} x ${result.stats.imageHeight}px<br>
                Hidden file: ${result.stats.fileName} (${formatFileSize(result.stats.fileSizeBytes)})<br>
                Capacity used: ${result.stats.capacityUsed}%<br>
                Encrypted: ${result.stats.isEncrypted ? 'Yes (AES-256-GCM)' : 'No'}
            `);

            hideLoading();
            showToast('File hidden successfully!', 'success');
        } catch (err) {
            hideLoading();
            showToast('Encoding failed: ' + err.message, 'error');
            console.error(err);
        }
    }

    function showEncodeResult(result, statsHtml) {
        encodedCanvas.width = result.canvas.width;
        encodedCanvas.height = result.canvas.height;
        encodedCanvas.getContext('2d').drawImage(result.canvas, 0, 0);

        encodeResultInfo.innerHTML = statsHtml;

        comparisonOriginal.src = encodePreviewImg.src;
        comparisonEncoded.src = encodedCanvas.toDataURL('image/png');

        encodePlaceholder.style.display = 'none';
        encodeResult.style.display = 'flex';
    }

    function arrayBufferToBase64(bytes) {
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    function downloadEncodedImage() {
        encodedCanvas.toBlob((blob) => {
            if (!blob) {
                showToast('Failed to generate image. Please try again.', 'error');
                return;
            }
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = 'totallynormalimage_encoded.png';
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            showToast('Image downloaded!', 'success');
        }, 'image/png');
    }

    // ============================================================
    //  Decode Flow
    // ============================================================
    function initDecodeFlow() {
        setupUploadZone(
            decodeUploadZone, decodeImageInput,
            decodeUploadContent, decodePreview, decodePreviewImg,
            removeDecodeImage, decodeImageInfo,
            (img, file) => {
                decodeImageLoaded = img;
                decodeFileBlob = file;
                updateDecodeButton();
                decodePlaceholder.style.display = '';
                decodeResult.style.display = 'none';
            }
        );

        toggleDecodePassword.addEventListener('click', () => {
            const isPassword = decodePassword.type === 'password';
            decodePassword.type = isPassword ? 'text' : 'password';
            toggleDecodePassword.querySelector('.eye-icon').textContent = isPassword ? '🔒' : '👁️';
        });

        decodeBtn.addEventListener('click', performDecode);

        copyDecodedBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(decodedMessage.textContent).then(() => {
                showToast('Message copied to clipboard!', 'success');
                copyDecodedBtn.textContent = '✅ Copied!';
                setTimeout(() => { copyDecodedBtn.textContent = '📋 Copy'; }, 2000);
            });
        });

        downloadDecodedFileBtn.addEventListener('click', downloadDecodedFile);
    }

    function updateDecodeButton() {
        decodeBtn.disabled = !decodeImageLoaded;
    }

    async function performDecode() {
        if (!decodeImageLoaded || !decodeFileBlob) return;

        showLoading('Extracting hidden data from pixels...');

        try {
            const canvas = await loadFileToCanvas(decodeFileBlob);
            await new Promise(r => setTimeout(r, 100));

            const result = Steganography.decode(canvas);

            if (!result.success) {
                hideLoading();
                showToast(result.error, 'error');
                return;
            }

            if (result.type === 'message') {
                await handleDecodedMessage(result);
            } else if (result.type === 'file') {
                await handleDecodedFile(result);
            }
        } catch (err) {
            hideLoading();
            showToast('Decoding failed: ' + err.message, 'error');
            console.error(err);
        }
    }

    async function handleDecodedMessage(result) {
        let finalMessage = result.message;

        if (result.isEncrypted) {
            const password = decodePassword.value.trim();
            if (!password) {
                hideLoading();
                showToast('This message is encrypted. Please enter the password.', 'error');
                return;
            }

            showLoading('Decrypting with AES-256...');
            try {
                finalMessage = await CryptoModule.decrypt(result.message, password);
            } catch (decryptErr) {
                hideLoading();
                showToast('Wrong password. Unable to decrypt the message.', 'error');
                return;
            }
        }

        decodedMessage.textContent = finalMessage;

        decodeResultBadge.textContent = '✅ Message Decoded';
        decodeMessageResult.style.display = '';
        decodeFileResult.style.display = 'none';

        decodeResultInfo.innerHTML = `
            Image: ${result.stats.imageWidth} x ${result.stats.imageHeight}px<br>
            Message length: ${finalMessage.length} characters<br>
            Was encrypted: ${result.stats.isEncrypted ? 'Yes (AES-256-GCM)' : 'No'}
        `;

        decodePlaceholder.style.display = 'none';
        decodeResult.style.display = 'flex';

        hideLoading();
        showToast('Message decoded successfully!', 'success');
    }

    async function handleDecodedFile(result) {
        let fileBytes = result.fileBytes;
        let fileName = result.fileName;

        if (result.isEncrypted) {
            const password = decodePassword.value.trim();
            if (!password) {
                hideLoading();
                showToast('This file is encrypted. Please enter the password.', 'error');
                return;
            }

            showLoading('Decrypting file with AES-256...');
            try {
                // fileBytes contains encrypted string as bytes, convert to string
                let encryptedStr = '';
                for (let i = 0; i < fileBytes.length; i++) {
                    encryptedStr += String.fromCharCode(fileBytes[i]);
                }
                const decryptedBase64 = await CryptoModule.decrypt(encryptedStr, password);
                // Convert base64 back to bytes
                const binaryStr = atob(decryptedBase64);
                fileBytes = new Uint8Array(binaryStr.length);
                for (let i = 0; i < binaryStr.length; i++) {
                    fileBytes[i] = binaryStr.charCodeAt(i);
                }
            } catch (decryptErr) {
                hideLoading();
                showToast('Wrong password. Unable to decrypt the file.', 'error');
                return;
            }
        }

        decodedFileData = { name: fileName, bytes: fileBytes };

        decodedFileName.textContent = fileName;
        decodedFileSize.textContent = formatFileSize(fileBytes.length);

        decodeResultBadge.textContent = '✅ File Extracted';
        decodeMessageResult.style.display = 'none';
        decodeFileResult.style.display = '';

        decodeResultInfo.innerHTML = `
            Image: ${result.stats.imageWidth} x ${result.stats.imageHeight}px<br>
            Hidden file: ${fileName} (${formatFileSize(fileBytes.length)})<br>
            Was encrypted: ${result.stats.isEncrypted ? 'Yes (AES-256-GCM)' : 'No'}
        `;

        decodePlaceholder.style.display = 'none';
        decodeResult.style.display = 'flex';

        hideLoading();
        showToast('File extracted successfully!', 'success');
    }

    function downloadDecodedFile() {
        if (!decodedFileData) return;

        const blob = new Blob([decodedFileData.bytes]);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = decodedFileData.name;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showToast('File downloaded!', 'success');
    }

    // ============================================================
    //  Interactive Binary Demo
    // ============================================================
    function initBinaryDemo() {
        const demoInput = $('#demoInput');
        const demoBinary = $('#demoBinary');
        const demoDescription = $('#demoDescription');

        demoInput.addEventListener('input', () => {
            const char = demoInput.value;
            if (char.length === 0) {
                const bits = demoBinary.querySelectorAll('.bit');
                bits.forEach((b, i) => {
                    b.textContent = '0';
                    b.classList.toggle('lsb', i === 7);
                });
                demoDescription.textContent = 'Type a character above to see its binary representation';
                return;
            }

            const charCode = char.charCodeAt(0);
            const binary = charCode.toString(2).padStart(8, '0');
            const bits = demoBinary.querySelectorAll('.bit');

            bits.forEach((bit, i) => {
                bit.textContent = binary[i];
                bit.classList.toggle('lsb', i === 7);

                bit.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    bit.style.transform = 'scale(1)';
                }, 200 + i * 50);
            });

            demoDescription.innerHTML = `
                '<strong>${char}</strong>' → ASCII ${charCode} → Binary <code>${binary}</code>
                <br>The <span style="color: var(--primary-light); font-weight: 700;">highlighted bit</span> is the LSB that gets modified
            `;
        });
    }

    // ============================================================
    //  Scroll Animations
    // ============================================================
    function initScrollAnimations() {
        if (typeof anime === 'undefined') return;

        // ── Helpers ──────────────────────────────────────────────────────────────

        // Observe a single element; animate it when it enters the viewport
        function scrollAnim(selector, props, opts = {}) {
            const elements = Array.from($$(selector));
            if (!elements.length) return;
            elements.forEach(el => { el.style.opacity = '0'; });
            const threshold = opts.threshold || 0.12;
            const rootMargin = opts.rootMargin || '0px 0px -50px 0px';
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        anime({ targets: entry.target, ...props });
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold, rootMargin });
            elements.forEach(el => observer.observe(el));
        }

        // Observe a container; animate its matching children when container enters
        function scrollGroup(containerSelector, childSelector, props, opts = {}) {
            const containers = Array.from($$(containerSelector));
            containers.forEach(container => {
                const targets = Array.from(container.querySelectorAll(childSelector));
                if (!targets.length) return;
                targets.forEach(el => { el.style.opacity = '0'; });
                const threshold = opts.threshold || 0.08;
                const rootMargin = opts.rootMargin || '0px 0px -60px 0px';
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            anime({ targets, ...props });
                            observer.unobserve(entry.target);
                        }
                    });
                }, { threshold, rootMargin });
                observer.observe(container);
            });
        }

        // ── Hero entrance (fires on load, not scroll) ────────────────────────────
        const heroInits = Array.from($$('.hero-badge, .hero-title, .hero-subtitle, .hero-actions, .visual-card, .stat-item'));
        heroInits.forEach(el => { el.style.opacity = '0'; });

        anime.timeline({ easing: 'easeOutExpo' })
            .add({ targets: '.hero-badge',    opacity: [0, 1], translateY: [24, 0], duration: 700 })
            .add({ targets: '.hero-title',    opacity: [0, 1], translateY: [40, 0], duration: 900 }, '-=400')
            .add({ targets: '.hero-subtitle', opacity: [0, 1], translateY: [28, 0], duration: 700 }, '-=500')
            .add({ targets: '.hero-actions',  opacity: [0, 1], translateY: [22, 0], duration: 600 }, '-=400')
            .add({
                targets: '.stat-item',
                opacity: [0, 1], translateY: [20, 0], scale: [0.85, 1],
                duration: 500,
                delay: anime.stagger(90),
            }, '-=300')
            .add({ targets: '.visual-card', opacity: [0, 1], scale: [0.88, 1], duration: 900 }, '-=700');

        // ── Section headers ──────────────────────────────────────────────────────
        scrollGroup('.section-header', '.section-badge, .section-title, .section-desc', {
            opacity: [0, 1],
            translateY: [32, 0],
            duration: 750,
            delay: anime.stagger(130),
            easing: 'easeOutExpo',
        });

        // ── Tool section ─────────────────────────────────────────────────────────
        scrollAnim('.mode-toggle', {
            opacity: [0, 1], scale: [0.94, 1],
            duration: 550, easing: 'easeOutCubic',
        });
        scrollAnim('.tool-input-area', {
            opacity: [0, 1], translateX: [-35, 0],
            duration: 750, easing: 'easeOutExpo',
        });
        scrollAnim('.tool-output-area', {
            opacity: [0, 1], translateX: [35, 0],
            duration: 750, delay: 120, easing: 'easeOutExpo',
        });

        // ── Feature cards — staggered wave ───────────────────────────────────────
        scrollGroup('.features-grid', '.feature-card', {
            opacity: [0, 1],
            translateY: [55, 0],
            scale: [0.91, 1],
            duration: 720,
            delay: anime.stagger(75, { start: 80 }),
            easing: 'easeOutExpo',
        });

        // ── About card ───────────────────────────────────────────────────────────
        scrollAnim('.about-card', {
            opacity: [0, 1], translateY: [40, 0], scale: [0.95, 1],
            duration: 750, easing: 'easeOutCubic',
        });

        // Info rows slide in from left, staggered
        scrollGroup('.project-info', '.info-row', {
            opacity: [0, 1],
            translateX: [-25, 0],
            duration: 500,
            delay: anime.stagger(80),
            easing: 'easeOutCubic',
        });

        // ── Footer ───────────────────────────────────────────────────────────────
        scrollGroup('.footer-top', '.footer-brand, .footer-links-group', {
            opacity: [0, 1],
            translateY: [30, 0],
            duration: 650,
            delay: anime.stagger(100),
            easing: 'easeOutCubic',
        });
    }

    // ============================================================
    //  Utilities
    // ============================================================
    function showLoading(text = 'Processing...') {
        loadingText.textContent = text;
        loadingOverlay.style.display = 'flex';
    }

    function hideLoading() {
        loadingOverlay.style.display = 'none';
    }

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    // ============================================================
    //  Initialize
    // ============================================================
    function init() {
        initWebGLBackground();
        initPixelGrid();
        initNavigation();
        initModeToggle();
        initHideTypeToggle();
        initSecretFileUpload();
        initEncodeFlow();
        initDecodeFlow();
        initBinaryDemo();
        initScrollAnimations();

        const heroEncodeBtn = $('#heroEncodeBtn');
        if (heroEncodeBtn) {
            heroEncodeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                switchMode('encode');
                document.getElementById('tool').scrollIntoView({ behavior: 'smooth' });
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
