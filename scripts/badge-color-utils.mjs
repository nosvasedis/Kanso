/** Relative luminance and contrast for sRGB badge ink. */
export function luminance(rgb){
 const a=rgb.replace('#','').match(/../g).map(h=>parseInt(h,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
 return a[0]*.2126+a[1]*.7152+a[2]*.0722;
}
export function contrast(rgb,bg='151A21'){const a=luminance(rgb),b=luminance(bg);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);}
