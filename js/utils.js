// Helper for cleaner DOM selection
export const $ = (id) => document.getElementById(id);

// Canvas Round Rect Polyfill
export function initPolyfills() {
    if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
            const r = typeof radii === 'number' ? radii : (radii || 0);
            this.moveTo(x + r, y);
            this.arcTo(x + w, y, x + w, y + h, r);
            this.arcTo(x + w, y + h, x, y + h, r);
            this.arcTo(x, y + h, x, y, r);
            this.arcTo(x, y, x + w, y, r);
            return this;
        };
    }
}