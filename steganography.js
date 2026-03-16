/**
 * TotallyNormalImage — Steganography Engine
 * Image LSB (Least Significant Bit) encoding/decoding
 *
 * Supports hiding both text messages and arbitrary files.
 *
 * Header format (all stored as raw bytes in LSBs):
 *   [32-bit length header]  — total payload bits
 *   [4 bytes] MAGIC_MARKER  — "SC1:"
 *   [2 bytes] TYPE_FLAG     — "P:" | "E:" | "F:"
 *   [payload]               — depends on type:
 *       P:/E: UTF-8 text (message or encrypted base64)
 *       F:    <filename>\0<raw file bytes>
 *
 * Capacity: (width * height * 3 - 32) / 8 bytes
 */

const Steganography = (() => {
    'use strict';

    const MAGIC_MARKER = 'SC1:'; // v1 (kept for backwards compat)

    /**
     * Max embeddable bytes for given image dimensions.
     */
    function calculateCapacity(width, height) {
        const totalBits = width * height * 3;
        return Math.floor((totalBits - 32) / 8);
    }

    // ---- low-level helpers ----

    function stringToBinary(str) {
        let binary = '';
        for (let i = 0; i < str.length; i++) {
            binary += str.charCodeAt(i).toString(2).padStart(8, '0');
        }
        return binary;
    }

    function binaryToString(binary) {
        let str = '';
        for (let i = 0; i < binary.length; i += 8) {
            const byte = binary.substring(i, i + 8);
            if (byte.length === 8) {
                str += String.fromCharCode(parseInt(byte, 2));
            }
        }
        return str;
    }

    /**
     * Convert a Uint8Array to a binary string (each byte → 8 bits).
     */
    function bytesToBinary(bytes) {
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += bytes[i].toString(2).padStart(8, '0');
        }
        return binary;
    }

    /**
     * Convert a binary string back to a Uint8Array.
     */
    function binaryToBytes(binary) {
        const len = Math.floor(binary.length / 8);
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = parseInt(binary.substring(i * 8, i * 8 + 8), 2);
        }
        return bytes;
    }

    /**
     * Embed bits into pixel LSBs and return a new canvas.
     * @param {HTMLCanvasElement} canvas
     * @param {string} fullBinary - binary string including length header
     * @returns {HTMLCanvasElement}
     */
    function embedBits(canvas, fullBinary) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        let bitIndex = 0;
        for (let i = 0; i < pixels.length && bitIndex < fullBinary.length; i++) {
            if ((i + 1) % 4 === 0) continue; // skip alpha
            const bit = parseInt(fullBinary[bitIndex], 10);
            pixels[i] = (pixels[i] & 0xFE) | bit;
            bitIndex++;
        }

        const resultCanvas = document.createElement('canvas');
        resultCanvas.width = canvas.width;
        resultCanvas.height = canvas.height;
        resultCanvas.getContext('2d').putImageData(imageData, 0, 0);
        return resultCanvas;
    }

    /**
     * Extract all payload bits from pixel LSBs (after 32-bit length header).
     * @param {HTMLCanvasElement} canvas
     * @returns {{ success: boolean, payloadBinary?: string, error?: string }}
     */
    function extractBits(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        // Read 32-bit length header
        let lengthBinary = '';
        let pixelIndex = 0;
        for (let i = 0; i < pixels.length && lengthBinary.length < 32; i++) {
            if ((i + 1) % 4 === 0) continue;
            lengthBinary += (pixels[i] & 1).toString();
            pixelIndex = i + 1;
        }

        const payloadBitLength = parseInt(lengthBinary, 2);
        const maxBits = canvas.width * canvas.height * 3 - 32;
        if (payloadBitLength <= 0 || payloadBitLength > maxBits) {
            return { success: false, error: 'No hidden data found in this image, or the image has been modified.' };
        }

        let payloadBinary = '';
        for (let i = pixelIndex; i < pixels.length && payloadBinary.length < payloadBitLength; i++) {
            if ((i + 1) % 4 === 0) continue;
            payloadBinary += (pixels[i] & 1).toString();
        }

        return { success: true, payloadBinary };
    }

    // ---- public API ----

    /**
     * Encode a text message into an image.
     */
    function encode(canvas, message, isEncrypted = false) {
        const prefix = MAGIC_MARKER + (isEncrypted ? 'E:' : 'P:');
        const fullMessage = prefix + message;
        const maxCapacity = calculateCapacity(canvas.width, canvas.height);

        if (fullMessage.length > maxCapacity) {
            return {
                success: false, canvas: null,
                error: `Message is too long. Maximum ${maxCapacity - prefix.length} characters for this image (${canvas.width}x${canvas.height}).`
            };
        }

        const binaryMessage = stringToBinary(fullMessage);
        const lengthBinary = binaryMessage.length.toString(2).padStart(32, '0');
        const resultCanvas = embedBits(canvas, lengthBinary + binaryMessage);

        return {
            success: true,
            canvas: resultCanvas,
            stats: {
                imageWidth: canvas.width,
                imageHeight: canvas.height,
                messageLengthChars: message.length,
                totalBitsUsed: lengthBinary.length + binaryMessage.length,
                totalBitsAvailable: canvas.width * canvas.height * 3,
                capacityUsed: (((lengthBinary.length + binaryMessage.length) / (canvas.width * canvas.height * 3)) * 100).toFixed(2),
                isEncrypted
            }
        };
    }

    /**
     * Encode an arbitrary file into an image.
     * @param {HTMLCanvasElement} canvas - Source canvas with cover image
     * @param {string} fileName - Original file name (e.g. "secret.pdf")
     * @param {Uint8Array} fileBytes - Raw file bytes
     * @param {boolean} isEncrypted - Whether fileBytes were AES-encrypted
     * @returns {{ success: boolean, canvas?: HTMLCanvasElement, error?: string, stats?: object }}
     */
    function encodeFile(canvas, fileName, fileBytes, isEncrypted = false) {
        // Build header bytes: MAGIC + "F:" + filename + \0
        const headerStr = MAGIC_MARKER + 'F:' + (isEncrypted ? 'E:' : 'P:') + fileName + '\0';
        const headerBytes = new Uint8Array(headerStr.length);
        for (let i = 0; i < headerStr.length; i++) {
            headerBytes[i] = headerStr.charCodeAt(i);
        }

        // Total payload = header + file bytes
        const totalPayload = new Uint8Array(headerBytes.length + fileBytes.length);
        totalPayload.set(headerBytes, 0);
        totalPayload.set(fileBytes, headerBytes.length);

        const maxCapacity = calculateCapacity(canvas.width, canvas.height);
        if (totalPayload.length > maxCapacity) {
            const maxFileSize = maxCapacity - headerBytes.length;
            const friendlySize = maxFileSize > 1024 * 1024
                ? (maxFileSize / (1024 * 1024)).toFixed(1) + ' MB'
                : (maxFileSize / 1024).toFixed(1) + ' KB';
            return {
                success: false, canvas: null,
                error: `File is too large. Maximum ~${friendlySize} for this image (${canvas.width}x${canvas.height}).`
            };
        }

        const payloadBinary = bytesToBinary(totalPayload);
        const lengthBinary = payloadBinary.length.toString(2).padStart(32, '0');
        const resultCanvas = embedBits(canvas, lengthBinary + payloadBinary);

        return {
            success: true,
            canvas: resultCanvas,
            stats: {
                imageWidth: canvas.width,
                imageHeight: canvas.height,
                fileName,
                fileSizeBytes: fileBytes.length,
                totalBitsUsed: lengthBinary.length + payloadBinary.length,
                totalBitsAvailable: canvas.width * canvas.height * 3,
                capacityUsed: (((lengthBinary.length + payloadBinary.length) / (canvas.width * canvas.height * 3)) * 100).toFixed(2),
                isEncrypted
            }
        };
    }

    /**
     * Decode hidden data from an image. Returns either a text message or file data.
     * @param {HTMLCanvasElement} canvas
     * @returns {{ success: boolean, type: 'message'|'file', message?: string, fileName?: string, fileBytes?: Uint8Array, isEncrypted?: boolean, error?: string, stats?: object }}
     */
    function decode(canvas) {
        const extracted = extractBits(canvas);
        if (!extracted.success) return extracted;

        const payloadBinary = extracted.payloadBinary;

        // Convert first part to check magic marker (at least MAGIC + "X:" = 6 chars = 48 bits)
        if (payloadBinary.length < 48) {
            return { success: false, error: 'No hidden data found in this image.' };
        }

        const headerStr = binaryToString(payloadBinary.substring(0, 48));

        if (!headerStr.startsWith(MAGIC_MARKER)) {
            return {
                success: false,
                error: 'No TotallyNormalImage data found. This image may not contain hidden data, or it was encoded with a different tool.'
            };
        }

        const typeFlag = headerStr.substring(MAGIC_MARKER.length, MAGIC_MARKER.length + 2);

        // --- TEXT MESSAGE (P: or E:) ---
        if (typeFlag === 'P:' || typeFlag === 'E:') {
            const fullMessage = binaryToString(payloadBinary);
            const message = fullMessage.substring(MAGIC_MARKER.length + 2);
            const isEncrypted = typeFlag === 'E:';
            return {
                success: true,
                type: 'message',
                message,
                isEncrypted,
                stats: {
                    imageWidth: canvas.width,
                    imageHeight: canvas.height,
                    messageLengthChars: message.length,
                    totalBitsExtracted: payloadBinary.length,
                    isEncrypted
                }
            };
        }

        // --- FILE (F:) ---
        if (typeFlag === 'F:') {
            const payloadBytes = binaryToBytes(payloadBinary);
            // Header layout: SC1:F:E: or SC1:F:P: then filename\0 then file bytes
            // Skip past "SC1:F:" = 6 bytes
            const afterF = 6;
            // Check encryption flag
            let isEncrypted = false;
            let dataStart = afterF;
            const subFlag = String.fromCharCode(payloadBytes[afterF], payloadBytes[afterF + 1]);
            if (subFlag === 'E:' || subFlag === 'P:') {
                isEncrypted = subFlag === 'E:';
                dataStart = afterF + 2;
            }

            // Find null terminator for filename
            let nullPos = -1;
            for (let i = dataStart; i < payloadBytes.length; i++) {
                if (payloadBytes[i] === 0) {
                    nullPos = i;
                    break;
                }
            }
            if (nullPos === -1) {
                return { success: false, error: 'Corrupted file header. The image may have been modified.' };
            }

            let fileName = '';
            for (let i = dataStart; i < nullPos; i++) {
                fileName += String.fromCharCode(payloadBytes[i]);
            }

            const fileBytes = payloadBytes.slice(nullPos + 1);

            return {
                success: true,
                type: 'file',
                fileName,
                fileBytes,
                isEncrypted,
                stats: {
                    imageWidth: canvas.width,
                    imageHeight: canvas.height,
                    fileName,
                    fileSizeBytes: fileBytes.length,
                    totalBitsExtracted: payloadBinary.length,
                    isEncrypted
                }
            };
        }

        return { success: false, error: 'Corrupted header. The image may have been modified.' };
    }

    return {
        encode,
        encodeFile,
        decode,
        calculateCapacity,
        stringToBinary,
        binaryToString,
        bytesToBinary,
        binaryToBytes
    };
})();
