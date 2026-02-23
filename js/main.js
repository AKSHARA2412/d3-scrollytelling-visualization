document.addEventListener("DOMContentLoaded", (event) => {
  gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin, MotionPathPlugin, GSDevTools);

  gsap.defaults({ease: "none"});
  
  const pulses = gsap.timeline({
    defaults: {
      scale: 2,
      autoAlpha:1,
      transformOrigin: 'center', 
      ease: "elastic(2.5, 1)"
    }})
  .to(".ball02, .text01", {}, 0.84)
  
  const main = gsap.timeline({
    scrollTrigger: {
      trigger: "#svg",
      scrub: true,
      start: "top center",
      end: "bottom center"
    }
  })
  .to(".ball01", {autoAlpha:1, duration:0.05})
  .from(".theLine", {drawSVG:0, duration:4}, 0)
  .to(".ball01", {motionPath:{
    path:".theLine",
    align:".theLine",
    alignOrigin:[0.5, 0.5],
  }, duration:4}, 0)
  .add(pulses, 0);

  const observer = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate");
          observer.unobserve(entry.target); 
        }
      });
    },
    { threshold: 0.2 }
  );

  document.querySelectorAll('.text-elevate, .alert-box').forEach(el => {
    observer.observe(el);
  });
});