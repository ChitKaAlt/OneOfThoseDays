import { state } from '../state.js';
import { $ } from '../utils.js';

export function setupItinerary() {
    const dealCheck = $('deal-check');
    const dealBox = $('deal-box');
    const dealDone = $('deal-done');

    dealCheck.addEventListener('click', function(e) {
        e.preventDefault();
        if (state.dealChecked) return;
        
        state.dealChecked = true;
        dealBox.textContent = '☑';
        dealBox.classList.add('checked');
        dealDone.style.display = 'block';
        
        if (navigator.vibrate) navigator.vibrate(10);
    });
}