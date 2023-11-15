/**
 * @typedef {Object} RGBObject
 * @property {number} r - The red component of the color (0-255).
 * @property {number} g - The green component of the color (0-255).
 * @property {number} b - The blue component of the color (0-255).
 * @property {number} [a=1] - The alpha (opacity) value of the color, ranging from 0 to 1.
 */

/**
 * Converts a hexadecimal color code to its RGB representation.
 *
 * @param {string} hex - The hexadecimal color code to convert.
 * @returns {Object} An object containing the RGB representation of the color.
 * @property {string} str - The RGB representation of the color
 *  as a string in the format "rgb(r,g,b)".
 * @property {RGBObject} obj - The RGB representation of the color as an object.
 */

const hexToRGB = (hex: string) => {
    const preparedHexColor = hex.padEnd(8, 'ff');
    const [r, g, b, a = 1] = (preparedHexColor.match(/.{2}/g) || []).map((el) => parseInt(el, 16));

    return {
        str: `rgb(${r},${g},${b})`,
        obj: {
            r,
            g,
            b,
            a: Number((a / 256).toFixed(2)),
        },
    };
};

const normalize = (val: number, max: number, min: number) => (val - min) / (max - min);

/**
 * Converts a hexadecimal alpha value to a percentage representation.
 *
 * @param {string} alphaHexString - The hexadecimal alpha value to convert.
 * @returns {number} The alpha value represented as a percentage (0-100).
 */
const hexToAlpha = (alphaHexString: string) =>
    Math.round(normalize(parseInt(alphaHexString, 16), 255, 0) * 100);

/**
 * Converts a decimal color component to its two-digit hexadecimal representation.
 *
 * @param {number} c - The decimal color component (0-255) to convert.
 * @returns {string} The two-digit hexadecimal representation of the color component.
 */
const componentToHex = (c: number) => {
    const hex = c.toString(16);
    return hex.padStart(2, '0');
};

/**
 * Converts an RGB color to its hexadecimal representation.
 *
 * @param {RGBObject} color - The RGB color components.
 * @returns {string} The hexadecimal representation of the color.
 */
const rgbToHex = ({ r, g, b, a }: { r: number; g: number; b: number; a?: number }) =>
    `${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}${componentToHex(
        Math.floor((a || 1) * 255),
    )}`;

export { hexToRGB, hexToAlpha, rgbToHex };
