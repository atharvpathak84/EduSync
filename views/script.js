let text = document.getElementById('text');
let sd1 = document.getElementById('sd1');
let sd2 = document.getElementById('sd2');
let sd3 = document.getElementById('sd3');

window.addEventListener('scroll',() => {
    let value = window.scrollY;

    text.style.marginTop = value * 0.61 +'px';
    sd3.style.marginBottom = value * 1.5 +'px';
    sd1.style.left = value * 1.5 + 'px';
    sd2.style.left = value * -1.5 + 'px';
    
});